"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
// Global state for file modes
const fileModes = new Map();
let statusBarItem;
// Helper function to get full document range
function getFullDocumentRange(document) {
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    return new vscode.Range(firstLine.range.start, lastLine.range.end);
}
function activate(context) {
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
        const mode = fileModes.get(fileUri) || 'auto';
        // If in pretty mode, beautify before save
        if (mode === 'pretty') {
            const indentSize = config.get('indentSize', 4);
            const fullRange = new vscode.Range(0, 0, document.lineCount, document.lineAt(document.lineCount - 1).text.length);
            const text = document.getText();
            const beautified = beautifyCSS(text, indentSize);
            const edit = new vscode.WorkspaceEdit();
            edit.replace(document.uri, fullRange, beautified);
            event.waitUntil(vscode.workspace.applyEdit(edit));
        }
    }));
    // Command: Minify
    let miniCommand = vscode.commands.registerCommand('pretty-tiny.mini', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const removeComments = config.get('removeComments', true);
        const minified = minifyCSS(text, removeComments);
        editor.edit((editBuilder) => {
            editBuilder.replace(range, minified);
        });
        // Set mode to mini
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'mini');
        updateStatusBar();
        vscode.window.showInformationMessage('CSS minified! Mode: Mini');
    });
    // Command: Beautify
    let prettyCommand = vscode.commands.registerCommand('pretty-tiny.pretty', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const indentSize = config.get('indentSize', 4);
        const beautified = beautifyCSS(text, indentSize);
        editor.edit((editBuilder) => {
            editBuilder.replace(range, beautified);
        });
        // Set mode to pretty
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'pretty');
        updateStatusBar();
        vscode.window.showInformationMessage('CSS beautified! Mode: Pretty (auto-beautify enabled)');
    });
    // Command: Toggle
    let toggleCommand = vscode.commands.registerCommand('pretty-tiny.toggle', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const document = editor.document;
        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        const fileUri = document.uri.toString();
        // Detect if CSS is minified
        const lineCount = text.split('\n').length;
        const charCount = text.length;
        const isMinified = lineCount < 5 || charCount / lineCount > 100;
        if (isMinified) {
            // Beautify
            const config = vscode.workspace.getConfiguration('prettyTiny');
            const indentSize = config.get('indentSize', 4);
            const beautified = beautifyCSS(text, indentSize);
            editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });
            fileModes.set(fileUri, 'pretty');
            updateStatusBar();
            vscode.window.showInformationMessage('CSS beautified! Mode: Pretty');
        }
        else {
            // Minify
            const config = vscode.workspace.getConfiguration('prettyTiny');
            const removeComments = config.get('removeComments', true);
            const minified = minifyCSS(text, removeComments);
            editor.edit((editBuilder) => {
                editBuilder.replace(range, minified);
            });
            fileModes.set(fileUri, 'mini');
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
        const currentMode = fileModes.get(fileUri) || 'auto';
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
        updateStatusBar();
        if (selectedMode === 'pretty') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const config = vscode.workspace.getConfiguration('prettyTiny');
            const indentSize = config.get('indentSize', 4);
            const beautified = beautifyCSS(text, indentSize);
            editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });
            vscode.window.showInformationMessage('Mode changed: Pretty Mode (CSS beautified)');
        }
        else if (selectedMode === 'mini') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const config = vscode.workspace.getConfiguration('prettyTiny');
            const removeComments = config.get('removeComments', true);
            const minified = minifyCSS(text, removeComments);
            editor.edit((editBuilder) => {
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
    const mode = fileModes.get(fileUri) || 'auto';
    const labels = {
        pretty: 'Pretty',
        mini: 'Mini',
        auto: 'Normal',
    };
    statusBarItem.text = `CSS: ${labels[mode]}`;
    statusBarItem.tooltip = 'Pretty Tiny - Click to change mode';
    statusBarItem.show();
}
function minifyCSS(css, removeComments = true) {
    let result = css;
    if (removeComments) {
        result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    }
    result = result.replace(/\s+/g, ' ');
    result = result.replace(/\s*{\s*/g, '{');
    result = result.replace(/\s*}\s*/g, '}');
    result = result.replace(/\s*:\s*/g, ':');
    result = result.replace(/\s*;\s*/g, ';');
    result = result.replace(/\s*,\s*/g, ',');
    result = result.replace(/\s*>\s*/g, '>');
    result = result.replace(/\s*\+\s*/g, '+');
    result = result.replace(/\s*~\s*/g, '~');
    result = result.replace(/;}/g, '}');
    result = result.trim();
    return result;
}
function beautifyCSS(css, indentSize = 4) {
    let result = '';
    let indentLevel = 0;
    const indent = ' '.repeat(indentSize);
    // Normalize whitespace (but keep comments)
    css = css.replace(/\s+/g, ' ').trim();
    let i = 0;
    let inSelector = true;
    while (i < css.length) {
        const char = css[i];
        if (char === '@') {
            // At-rule
            inSelector = true;
            // Add spacing before at-rule
            if (indentLevel === 0) {
                // Top-level at-rule
                if (result && !result.endsWith('\n\n') && !result.endsWith('\n')) {
                    result += '\n\n';
                }
            }
            else {
                // Nested at-rule - add indentation if at start of line
                if (result.endsWith('\n')) {
                    result += indent.repeat(indentLevel);
                }
            }
            let atRuleText = '';
            while (i < css.length && css[i] !== '{') {
                atRuleText += css[i];
                i++;
            }
            atRuleText = atRuleText.replace(/\s+/g, ' ').trim();
            result += atRuleText;
        }
        else if (char === '{') {
            // Add space before { only if not already there
            if (!result.endsWith(' ')) {
                result += ' ';
            }
            result += '{\n';
            indentLevel++;
            inSelector = false;
            i++;
            while (i < css.length && css[i] === ' ') {
                i++;
            }
        }
        else if (char === '}') {
            result = result.trimEnd();
            if (!result.endsWith(';') && !result.endsWith('{') && !result.endsWith('}')) {
                result += ';';
            }
            if (!result.endsWith('\n')) {
                result += '\n';
            }
            indentLevel--;
            result += indent.repeat(indentLevel) + '}';
            inSelector = true;
            i++;
            while (i < css.length && css[i] === ' ') {
                i++;
            }
            if (i < css.length && css[i] !== '}') {
                const nextContent = css.substring(i, Math.min(i + 10, css.length));
                const isKeyframeSelector = /^[\d]/.test(nextContent) ||
                    /^from/.test(nextContent) ||
                    /^to/.test(nextContent);
                if (isKeyframeSelector) {
                    result += '\n';
                    inSelector = false;
                }
                else if (indentLevel === 0) {
                    result += '\n\n';
                }
                else {
                    result += '\n';
                }
            }
        }
        else if (char === ':') {
            // Don't add space if we already have one or after newline
            if (result.endsWith(' ') || result.endsWith('\n')) {
                i++;
                continue;
            }
            // In selector mode, don't add space after ( or before :
            if (inSelector) {
                const lastChar = result.length > 0 ? result[result.length - 1] : '';
                // Skip space after opening parenthesis
                if (lastChar === '(') {
                    i++;
                    continue;
                }
            }
            result += char;
            i++;
        }
        else if (char === ';') {
            result += ';\n';
            i++;
            while (i < css.length && css[i] === ' ') {
                i++;
            }
            if (i < css.length && css[i] !== '}') {
                result += indent.repeat(indentLevel);
            }
        }
        else if (char === ',') {
            result += ', ';
            i++;
            while (i < css.length && css[i] === ' ') {
                i++;
            }
        }
        else if (char === '/' && i + 1 < css.length && css[i + 1] === '*') {
            const commentEnd = css.indexOf('*/', i + 2);
            if (commentEnd !== -1) {
                const comment = css.substring(i, commentEnd + 2);
                result += '\n' + indent.repeat(indentLevel) + comment + '\n';
                if (indentLevel > 0) {
                    result += indent.repeat(indentLevel);
                }
                i = commentEnd + 2;
            }
            else {
                result += char;
                i++;
            }
        }
        else if (char === ' ') {
            // Don't add space if we already have one or after newline
            if (result.endsWith(' ') || result.endsWith('\n')) {
                i++;
                continue;
            }
            result += char;
            i++;
        }
        else {
            if (result.endsWith('\n')) {
                result += indent.repeat(indentLevel);
            }
            result += char;
            i++;
        }
    }
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.replace(/ +$/gm, '');
    return result.trim() + '\n';
}
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map