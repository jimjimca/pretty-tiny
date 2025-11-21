"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
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
            const beautified = beautifyCSS(text, indentSize);
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
        const minified = minifyCSS(text, removeComments);
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
        const beautified = beautifyCSS(text, indentSize);
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
            const beautified = beautifyCSS(text, indentSize);
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
            const minified = minifyCSS(text, removeComments);
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
            const beautified = beautifyCSS(text, indentSize);
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
            const minified = minifyCSS(text, removeComments);
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
    // Size safeguard - skip beautification for very large files
    if (css.length > 500000) {
        vscode.window.showWarningMessage('File too large to beautify (>500KB). Operation skipped.');
        return css;
    }
    let result = '';
    let indentLevel = 0;
    const indent = ' '.repeat(indentSize);
    let inProperty = false;
    let i = 0;
    const len = css.length;
    // Helper to skip whitespace
    function skipWhitespace() {
        let hadSpace = false;
        while (i < len && /\s/.test(css[i])) {
            hadSpace = true;
            i++;
        }
        return hadSpace;
    }
    while (i < len) {
        const char = css[i];
        if (char === '"' || char === "'") {
            const quote = char;
            result += char;
            i++;
            while (i < len) {
                result += css[i];
                if (css[i] === quote && css[i - 1] !== '\\') {
                    i++;
                    break;
                }
                i++;
            }
            continue;
        }
        if (/\s/.test(char)) {
            const hadSpace = skipWhitespace();
            if (hadSpace && !result.endsWith('\n') && !result.endsWith(' ') && i < len) {
                const nextChar = css[i];
                if (nextChar !== '{' && nextChar !== '}' && nextChar !== ';' && nextChar !== ',') {
                    result += ' ';
                }
            }
            continue;
        }
        if (char === '@') {
            inProperty = false;
            if (indentLevel === 0 && result && !result.endsWith('\n\n')) {
                result += '\n\n';
            }
            else if (indentLevel > 0 && result.endsWith('\n')) {
                result += indent.repeat(indentLevel);
            }
            let atRuleContent = '';
            while (i < len && css[i] !== '{' && css[i] !== ';') {
                if (css[i] === '"' || css[i] === "'") {
                    const quote = css[i];
                    atRuleContent += css[i];
                    i++;
                    while (i < len) {
                        atRuleContent += css[i];
                        if (css[i] === quote && css[i - 1] !== '\\') {
                            i++;
                            break;
                        }
                        i++;
                    }
                }
                else if (/\s/.test(css[i])) {
                    skipWhitespace();
                    if (i < len && css[i] !== '{' && css[i] !== ';') {
                        atRuleContent += ' ';
                    }
                }
                else {
                    atRuleContent += css[i];
                    i++;
                }
            }
            result += atRuleContent;
            if (i < len && css[i] === ';') {
                result += ';\n';
                i++;
                if (indentLevel === 0) {
                    result += '\n';
                }
            }
        }
        else if (char === '{') {
            inProperty = false;
            if (!result.endsWith(' ')) {
                result += ' ';
            }
            result += '{\n';
            indentLevel++;
            i++;
        }
        else if (char === '}') {
            result = result.trimEnd();
            if (!result.endsWith(';') &&
                !result.endsWith('{') &&
                !result.endsWith('}') &&
                !result.endsWith('*/')) {
                result += ';';
            }
            if (!result.endsWith('\n')) {
                result += '\n';
            }
            indentLevel--;
            result += indent.repeat(indentLevel) + '}';
            i++;
            skipWhitespace();
            if (i < len && css[i] !== '}') {
                const nextContent = css.substring(i, Math.min(i + 10, len));
                const isKeyframeSelector = /^[\d]/.test(nextContent) || /^from/.test(nextContent) || /^to/.test(nextContent);
                if (isKeyframeSelector) {
                    result += '\n';
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
            if (result.endsWith('\n')) {
                result += indent.repeat(indentLevel);
            }
            const lastNewlineIndex = result.lastIndexOf('\n');
            const currentLineContent = lastNewlineIndex >= 0 ? result.substring(lastNewlineIndex + 1) : result;
            const currentLineAfterIndent = currentLineContent.replace(indent.repeat(indentLevel), '');
            const colonsOnLine = (currentLineAfterIndent.match(/:/g) || []).length;
            const trimmedLine = currentLineAfterIndent.trim();
            const restOfCSS = css.substring(i + 1);
            const nextBraceIndex = restOfCSS.indexOf('{');
            const nextSemiIndex = restOfCSS.indexOf(';');
            const isSelector = indentLevel === 0 ||
                colonsOnLine > 0 ||
                trimmedLine.length === 0 ||
                /^[&*\.#\[\]>+~,:]/.test(trimmedLine) ||
                (nextBraceIndex !== -1 && (nextSemiIndex === -1 || nextBraceIndex < nextSemiIndex));
            if (!isSelector && indentLevel > 0) {
                result += ': ';
                inProperty = true;
            }
            else {
                result += ':';
            }
            i++;
        }
        else if (char === ';') {
            result += ';';
            i++;
            let tempI = i;
            while (tempI < len && /\s/.test(css[tempI])) {
                tempI++;
            }
            const hasInlineComment = css.substring(tempI, tempI + 2) === '/*';
            if (!hasInlineComment) {
                result += '\n';
                while (i < len && /\s/.test(css[i])) {
                    i++;
                }
                if (i < len && css[i] !== '}') {
                    result += indent.repeat(indentLevel);
                }
            }
            else {
                while (i < len && /\s/.test(css[i])) {
                    i++;
                }
            }
        }
        else if (char === ',') {
            result += ', ';
            i++;
        }
        else if (char === '/' && i + 1 < len && css[i + 1] === '*') {
            const commentEnd = css.indexOf('*/', i + 2);
            if (commentEnd !== -1) {
                const comment = css.substring(i, commentEnd + 2);
                // Check what comes after the comment
                let afterCommentIndex = commentEnd + 2;
                while (afterCommentIndex < len && /\s/.test(css[afterCommentIndex])) {
                    afterCommentIndex++;
                }
                const followedBySemicolon = afterCommentIndex < len && css[afterCommentIndex] === ';';
                // Check if this is an inline comment
                const lastNonSpace = result.trimEnd();
                const isInline = lastNonSpace.length > 0 && !lastNonSpace.endsWith('\n');
                if (isInline) {
                    // Inline comment - add space only if not already there
                    if (!result.endsWith(' ')) {
                        result += ' ';
                    }
                    result += comment;
                    i = commentEnd + 2;
                    if (followedBySemicolon) {
                        // Skip whitespace, semicolon will be handled next
                        while (i < len && /\s/.test(css[i])) {
                            i++;
                        }
                    }
                    else {
                        // No semicolon after, add newline
                        result += '\n';
                        while (i < len && /\s/.test(css[i])) {
                            i++;
                        }
                        if (i < len && css[i] !== '}') {
                            result += indent.repeat(indentLevel);
                        }
                    }
                }
                else {
                    // Block comment - on its own line
                    if (!result.endsWith('\n')) {
                        result += '\n';
                    }
                    const commentIndent = indentLevel > 0 ? indent.repeat(indentLevel) : '';
                    result += commentIndent + comment + '\n';
                    if (indentLevel > 0) {
                        result += indent.repeat(indentLevel);
                    }
                    i = commentEnd + 2;
                }
            }
            else {
                result += char;
                i++;
            }
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