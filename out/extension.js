"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const css_1 = require("./formatters/css");
const html_1 = require("./formatters/html");
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
// Helper function ro get supported language
function isLanguageSupported(languageId) {
    if (languageId === 'css' || languageId === 'html')
        return true;
    const config = vscode.workspace.getConfiguration('prettyTiny');
    const enablePHP = config.get('enablePHP', false);
    return enablePHP && languageId === 'php';
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
        // Check if it's a CSS or HTML file
        if (!isLanguageSupported(document.languageId))
            return;
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const autoBeautify = config.get('autoBeautifyOnSave', true);
        if (!autoBeautify)
            return;
        const fileUri = document.uri.toString();
        const defaultModeKey = document.languageId === 'css' ? 'defaultModeCSS' : 'defaultModeHTML';
        const mode = fileModes.get(fileUri) || config.get(defaultModeKey, 'auto');
        const fullRange = getFullDocumentRange(document);
        const text = document.getText();
        // Apply formatting based on mode
        if (mode === 'pretty') {
            const indentSize = config.get('indentSize', 4);
            const beautified = document.languageId === 'css'
                ? (0, css_1.beautifyCSS)(text, indentSize)
                : (0, html_1.beautifyHTML)(text, indentSize);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, fullRange, beautified);
            event.waitUntil(vscode.workspace.applyEdit(edit));
        }
        else if (mode === 'tiny') {
            // Auto-minify on save when in Tiny mode
            const removeComments = config.get('removeComments', true);
            const minified = document.languageId === 'css'
                ? (0, css_1.minifyCSS)(text, removeComments)
                : (0, html_1.minifyHTML)(text, removeComments);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, fullRange, minified);
            event.waitUntil(vscode.workspace.applyEdit(edit));
        }
    }));
    // Command: Minify
    let tinyCommand = vscode.commands.registerCommand('pretty-tiny.tiny', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const language = document.languageId === 'php' ? 'html' : document.languageId;
        // Check if supported language
        if (!isLanguageSupported(document.languageId)) {
            vscode.window.showWarningMessage('Pretty Tiny only supports CSS and HTML files');
            return;
        }
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        // Cache config
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const removeComments = config.get('removeComments', true);
        // Minify based on language
        const minified = language === 'css'
            ? (0, css_1.minifyCSS)(text, removeComments)
            : (0, html_1.minifyHTML)(text, removeComments);
        await editor.edit((editBuilder) => {
            editBuilder.replace(range, minified);
        });
        // Set mode to Tiny
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'tiny');
        saveFileModes();
        updateStatusBar();
        vscode.window.showInformationMessage(`${language.toUpperCase()} minified`);
    });
    // Command: Beautify
    let prettyCommand = vscode.commands.registerCommand('pretty-tiny.pretty', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const language = document.languageId === 'php' ? 'html' : document.languageId;
        // Check if supported language
        if (!isLanguageSupported(document.languageId)) {
            vscode.window.showWarningMessage('Pretty Tiny only supports CSS and HTML files');
            return;
        }
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        // Cache config
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const indentSize = config.get('indentSize', 4);
        // Beautify based on language
        const beautified = language === 'css'
            ? (0, css_1.beautifyCSS)(text, indentSize)
            : (0, html_1.beautifyHTML)(text, indentSize);
        await editor.edit((editBuilder) => {
            editBuilder.replace(range, beautified);
        });
        // Set mode to pretty
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'pretty');
        saveFileModes();
        updateStatusBar();
        vscode.window.showInformationMessage(`${language.toUpperCase()} beautified`);
    });
    // Command: Toggle
    let toggleCommand = vscode.commands.registerCommand('pretty-tiny.toggle', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const language = document.languageId === 'php' ? 'html' : document.languageId;
        // Check if supported language
        if (!isLanguageSupported(document.languageId)) {
            vscode.window.showWarningMessage('Pretty Tiny only supports CSS and HTML files');
            return;
        }
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        const fileUri = document.uri.toString();
        // Cache config
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const indentSize = config.get('indentSize', 4);
        const removeComments = config.get('removeComments', true);
        // Get current mode
        const defaultModeKey = language === 'css' ? 'defaultModeCSS' : 'defaultModeHTML';
        const defaultMode = config.get(defaultModeKey, 'auto');
        const currentMode = fileModes.get(fileUri) || defaultMode;
        // Toggle logic: tiny → pretty, (pretty or auto) → tiny
        if (currentMode === 'tiny') {
            // Switch to pretty
            const beautified = language === 'css'
                ? (0, css_1.beautifyCSS)(text, indentSize)
                : (0, html_1.beautifyHTML)(text, indentSize);
            await editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });
            fileModes.set(fileUri, 'pretty');
            saveFileModes();
            updateStatusBar();
            vscode.window.showInformationMessage(`${language.toUpperCase()} beautified`);
        }
        else {
            // Switch to tiny (from pretty or auto)
            const minified = language === 'css'
                ? (0, css_1.minifyCSS)(text, removeComments)
                : (0, html_1.minifyHTML)(text, removeComments);
            await editor.edit((editBuilder) => {
                editBuilder.replace(range, minified);
            });
            fileModes.set(fileUri, 'tiny');
            saveFileModes();
            updateStatusBar();
            vscode.window.showInformationMessage(`${language.toUpperCase()} minified`);
        }
    });
    // Command: Change mode manually
    let setModeCommand = vscode.commands.registerCommand('pretty-tiny.setMode', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('Open a file first');
            return;
        }
        const language = editor.document.languageId === 'php' ? 'html' : editor.document.languageId;
        // Check if supported language
        if (!isLanguageSupported(editor.document.languageId)) {
            vscode.window.showWarningMessage('Pretty Tiny only supports CSS, HTML, and PHP files');
            return;
        }
        const fileUri = editor.document.uri.toString();
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const defaultModeKey = language === 'css' ? 'defaultModeCSS' : 'defaultModeHTML';
        const currentMode = fileModes.get(fileUri) || config.get(defaultModeKey, 'auto');
        const choice = await vscode.window.showInformationMessage(`Current: ${getModeLabel(currentMode)}. Select new mode:`, 'Pretty', 'Tiny', 'Normal');
        if (!choice) {
            return;
        }
        let selectedMode;
        if (choice === 'Pretty') {
            selectedMode = 'pretty';
        }
        else if (choice === 'Tiny') {
            selectedMode = 'tiny';
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
            const beautified = language === 'css'
                ? (0, css_1.beautifyCSS)(text, indentSize)
                : (0, html_1.beautifyHTML)(text, indentSize);
            await editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });
            vscode.window.showInformationMessage(`${language.toUpperCase()} beautified`);
        }
        else if (selectedMode === 'tiny') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const removeComments = config.get('removeComments', true);
            const minified = language === 'css'
                ? (0, css_1.minifyCSS)(text, removeComments)
                : (0, html_1.minifyHTML)(text, removeComments);
            await editor.edit((editBuilder) => {
                editBuilder.replace(range, minified);
            });
            vscode.window.showInformationMessage(`${language.toUpperCase()} minified`);
        }
        else {
            vscode.window.showInformationMessage('Normal Mode');
        }
    });
    context.subscriptions.push(tinyCommand, prettyCommand, toggleCommand, setModeCommand);
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
        tiny: 'Tiny',
        auto: 'Normal',
    };
    return labels[mode] || 'Normal';
}
function updateStatusBar() {
    const editor = vscode.window.activeTextEditor;
    // Show status bar only for CSS and HTML files
    if (!editor || (!isLanguageSupported(editor.document.languageId))) {
        statusBarItem.hide();
        return;
    }
    const fileUri = editor.document.uri.toString();
    // Get default mode from settings
    const config = vscode.workspace.getConfiguration('prettyTiny');
    const defaultModeKey = editor.document.languageId === 'css' ? 'defaultModeCSS' : 'defaultModeHTML';
    const defaultMode = config.get(defaultModeKey, 'auto');
    // Get mode for this file, or use default
    const mode = fileModes.get(fileUri) || defaultMode;
    // Save the mode if it's not already set
    if (!fileModes.has(fileUri)) {
        fileModes.set(fileUri, mode);
        saveFileModes();
    }
    const labels = {
        pretty: 'Pretty',
        tiny: 'Tiny',
        auto: 'Normal',
    };
    // Show language in status bar
    const lang = editor.document.languageId.toUpperCase();
    statusBarItem.text = `${lang}: ${labels[mode]}`;
    statusBarItem.tooltip = 'Pretty Tiny - Change mode';
    statusBarItem.show();
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map