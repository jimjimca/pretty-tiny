"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const css_1 = require("./formatters/css");
// Global state for file modes
const fileModes = new Map();
let statusBarItem;
let workspaceState;
// Helper function to get full document range
function getFullDocumentRange(document) {
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    return new vscode.Range(firstLine.range.start, lastLine.range.end);
}
function activate(context) {
    // Store workspace state
    workspaceState = context.workspaceState;
    // Load saved file modes from workspace state
    const savedModes = workspaceState.get('fileModes', {});
    for (const [uri, mode] of Object.entries(savedModes)) {
        fileModes.set(uri, mode);
    }
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'pretty-tiny.setMode';
    context.subscriptions.push(statusBarItem);
    // Update status bar when editor changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBar));
    // Initial update
    updateStatusBar();
    // Listen for save events
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument((event) => {
        const document = event.document;
        // Check if it's a CSS file
        if (document.languageId !== 'css')
            return;
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const autoBeautify = config.get('autoBeautifyOnSave', true);
        if (!autoBeautify)
            return;
        const fileUri = document.uri.toString();
        const mode = fileModes.get(fileUri) || config.get('defaultMode', 'auto');
        // If in pretty mode, beautify before save
        if (mode === 'pretty') {
            const indentSize = config.get('indentSize', 4);
            const fullRange = getFullDocumentRange(document);
            const text = document.getText();
            const beautified = (0, css_1.beautifyCSS)(text, indentSize);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, fullRange, beautified);
            event.waitUntil(vscode.workspace.applyEdit(edit));
        }
    }));
    // Command: Minify
    let miniCommand = vscode.commands.registerCommand('pretty-tiny.mini', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        // Cache config
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const removeComments = config.get('removeComments', true);
        const minified = (0, css_1.minifyCSS)(text, removeComments);
        await editor.edit((editBuilder) => {
            editBuilder.replace(range, minified);
        });
        // Set mode to mini
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'mini');
        saveFileModes();
        updateStatusBar();
        vscode.window.showInformationMessage('CSS minified! Mode: Mini');
    });
    // Command: Beautify
    let prettyCommand = vscode.commands.registerCommand('pretty-tiny.pretty', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        // Cache config
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const indentSize = config.get('indentSize', 4);
        const beautified = (0, css_1.beautifyCSS)(text, indentSize);
        await editor.edit((editBuilder) => {
            editBuilder.replace(range, beautified);
        });
        // Set mode to pretty
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'pretty');
        saveFileModes();
        updateStatusBar();
        vscode.window.showInformationMessage('CSS beautified! Mode: Pretty (auto-beautify enabled)');
    });
    // Command: Toggle
    let toggleCommand = vscode.commands.registerCommand('pretty-tiny.toggle', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        const fileUri = document.uri.toString();
        // Cache config once
        const config = vscode.workspace.getConfiguration('prettyTiny');
        // Detect if CSS is minified
        const lineCount = text.split('\n').length;
        const charCount = text.length;
        const isMinified = lineCount < 5 || charCount / lineCount > 100;
        if (isMinified) {
            // Beautify
            const indentSize = config.get('indentSize', 4);
            const beautified = (0, css_1.beautifyCSS)(text, indentSize);
            await editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });
            fileModes.set(fileUri, 'pretty');
            saveFileModes();
            updateStatusBar();
            vscode.window.showInformationMessage('CSS beautified! Mode: Pretty');
        }
        else {
            // Minify
            const removeComments = config.get('removeComments', true);
            const minified = (0, css_1.minifyCSS)(text, removeComments);
            await editor.edit((editBuilder) => {
                editBuilder.replace(range, minified);
            });
            fileModes.set(fileUri, 'mini');
            saveFileModes();
            updateStatusBar();
            vscode.window.showInformationMessage('CSS minified! Mode: Mini');
        }
    });
    // Command: Change mode manually
    let setModeCommand = vscode.commands.registerCommand('pretty-tiny.setMode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'css') {
            vscode.window.showWarningMessage('Open a CSS file first');
            return;
        }
        const fileUri = editor.document.uri.toString();
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const currentMode = fileModes.get(fileUri) || config.get('defaultMode', 'auto');
        const choice = await vscode.window.showInformationMessage(`Current: ${getModeLabel(currentMode)}. Select new mode:`, 'Pretty', 'Mini', 'Normal');
        if (!choice) {
            return;
        }
        let selectedMode;
        if (choice === 'Pretty') {
            selectedMode = 'pretty';
        }
        else if (choice === 'Mini') {
            selectedMode = 'mini';
        }
        else {
            selectedMode = 'auto';
        }
        fileModes.set(fileUri, selectedMode);
        saveFileModes();
        updateStatusBar();
        if (selectedMode === 'pretty') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const indentSize = config.get('indentSize', 4);
            const beautified = (0, css_1.beautifyCSS)(text, indentSize);
            await editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });
            vscode.window.showInformationMessage('Mode changed: Pretty Mode (CSS beautified)');
        }
        else if (selectedMode === 'mini') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const removeComments = config.get('removeComments', true);
            const minified = (0, css_1.minifyCSS)(text, removeComments);
            await editor.edit((editBuilder) => {
                editBuilder.replace(range, minified);
            });
            vscode.window.showInformationMessage('Mode changed: Mini Mode (CSS minified)');
        }
        else {
            vscode.window.showInformationMessage('Mode changed: Normal Mode');
        }
    });
    context.subscriptions.push(miniCommand, prettyCommand, toggleCommand, setModeCommand);
}
exports.activate = activate;
function saveFileModes() {
    const modesToSave = {};
    fileModes.forEach((mode, uri) => {
        modesToSave[uri] = mode;
    });
    workspaceState.update('fileModes', modesToSave);
}
function getModeLabel(mode) {
    const labels = {
        pretty: 'Pretty',
        mini: 'Mini',
        auto: 'Normal',
    };
    return labels[mode] || 'Normal';
}
function updateStatusBar() {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'css') {
        statusBarItem.hide();
        return;
    }
    const fileUri = editor.document.uri.toString();
    // Get default mode from settings
    const config = vscode.workspace.getConfiguration('prettyTiny');
    const defaultMode = config.get('defaultMode', 'auto');
    // Get mode for this file, or use default
    const mode = fileModes.get(fileUri) || defaultMode;
    // Save the mode if it's not already set
    if (!fileModes.has(fileUri)) {
        fileModes.set(fileUri, mode);
        saveFileModes();
    }
    const labels = {
        pretty: 'Pretty',
        mini: 'Mini',
        auto: 'Normal',
    };
    statusBarItem.text = `CSS: ${labels[mode]}`;
    statusBarItem.tooltip = 'Pretty Tiny - Click to change mode';
    statusBarItem.show();
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map