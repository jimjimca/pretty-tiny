import * as vscode from 'vscode';

// Global state for file modes
const fileModes = new Map<string, 'pretty' | 'mini' | 'auto'>();
let statusBarItem: vscode.StatusBarItem;

// Helper function to get full document range
function getFullDocumentRange(document: vscode.TextDocument): vscode.Range {
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    return new vscode.Range(firstLine.range.start, lastLine.range.end);
}

export function activate(context: vscode.ExtensionContext) {
    // Create status bar item
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'pretty-tiny.setMode';
    context.subscriptions.push(statusBarItem);

    // Update status bar when editor changes
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(updateStatusBar));

    // Initial update
    updateStatusBar();

    // Listen for save events
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument((event) => {
            const document = event.document;

            // Check if it's a CSS file
            if (document.languageId !== 'css') return;

            const config = vscode.workspace.getConfiguration('prettyTiny');
            const autoBeautify = config.get<boolean>('autoBeautifyOnSave', true);

            if (!autoBeautify) return;

            const fileUri = document.uri.toString();
            const mode = fileModes.get(fileUri) || 'auto';

            // If in pretty mode, beautify before save
            if (mode === 'pretty') {
                const indentSize = config.get<number>('indentSize', 4);
                const fullRange = new vscode.Range(
                    0,
                    0,
                    document.lineCount,
                    document.lineAt(document.lineCount - 1).text.length,
                );

                const text = document.getText();
                const beautified = beautifyCSS(text, indentSize);

                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, fullRange, beautified);

                event.waitUntil(vscode.workspace.applyEdit(edit));
            }
        }),
    );

    // Command: Minify
    let miniCommand = vscode.commands.registerCommand('pretty-tiny.mini', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const selection = editor.selection;

        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;

        const text = document.getText(range);
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const removeComments = config.get<boolean>('removeComments', true);

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
        if (!editor) return;

        const document = editor.document;
        const selection = editor.selection;

        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;

        const text = document.getText(range);
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const indentSize = config.get<number>('indentSize', 4);

        const beautified = beautifyCSS(text, indentSize);

        editor.edit((editBuilder) => {
            editBuilder.replace(range, beautified);
        });

        // Set mode to pretty
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'pretty');
        updateStatusBar();

        vscode.window.showInformationMessage(
            'CSS beautified! Mode: Pretty (auto-beautify enabled)',
        );
    });

    // Command: Toggle
    let toggleCommand = vscode.commands.registerCommand('pretty-tiny.toggle', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

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
            const indentSize = config.get<number>('indentSize', 4);
            const beautified = beautifyCSS(text, indentSize);

            editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });

            fileModes.set(fileUri, 'pretty');
            updateStatusBar();
            vscode.window.showInformationMessage('CSS beautified! Mode: Pretty');
        } else {
            // Minify
            const config = vscode.workspace.getConfiguration('prettyTiny');
            const removeComments = config.get<boolean>('removeComments', true);
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

        const choice = await vscode.window.showInformationMessage(
            `Current: ${getModeLabel(currentMode)}. Select new mode:`,
            'Pretty',
            'Mini',
            'Normal',
        );

        if (!choice) {
            return;
        }

        let selectedMode: 'pretty' | 'mini' | 'auto';
        if (choice === 'Pretty') {
            selectedMode = 'pretty';
        } else if (choice === 'Mini') {
            selectedMode = 'mini';
        } else {
            selectedMode = 'auto';
        }

        fileModes.set(fileUri, selectedMode);
        updateStatusBar();

        if (selectedMode === 'pretty') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const config = vscode.workspace.getConfiguration('prettyTiny');
            const indentSize = config.get<number>('indentSize', 4);
            const beautified = beautifyCSS(text, indentSize);

            editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });

            vscode.window.showInformationMessage('Mode changed: Pretty Mode (CSS beautified)');
        } else if (selectedMode === 'mini') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const config = vscode.workspace.getConfiguration('prettyTiny');
            const removeComments = config.get<boolean>('removeComments', true);
            const minified = minifyCSS(text, removeComments);

            editor.edit((editBuilder) => {
                editBuilder.replace(range, minified);
            });

            vscode.window.showInformationMessage('Mode changed: Mini Mode (CSS minified)');
        } else {
            vscode.window.showInformationMessage('Mode changed: Normal Mode');
        }
    });

    context.subscriptions.push(miniCommand, prettyCommand, toggleCommand, setModeCommand);
}

function getModeLabel(mode: string): string {
    const labels = {
        pretty: 'Pretty',
        mini: 'Mini',
        auto: 'Normal',
    };
    return labels[mode as keyof typeof labels] || 'Normal';
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

function minifyCSS(css: string, removeComments: boolean = true): string {
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

function beautifyCSS(css: string, indentSize: number = 4): string {
    let result = '';
    let indentLevel = 0;
    const indent = ' '.repeat(indentSize);
    let inProperty = false; // Track if we're inside a property declaration

    let i = 0;

    // Helper to skip whitespace
    function skipWhitespace(): boolean {
        let hadSpace = false;
        while (i < css.length && /\s/.test(css[i])) {
            hadSpace = true;
            i++;
        }
        return hadSpace;
    }

    while (i < css.length) {
        const char = css[i];

        // Skip whitespace at current position
        if (/\s/.test(char)) {
            const hadSpace = skipWhitespace();
            // Add single space if appropriate
            if (hadSpace && !result.endsWith('\n') && !result.endsWith(' ') && i < css.length) {
                const nextChar = css[i];
                if (nextChar !== '{' && nextChar !== '}' && nextChar !== ';' && nextChar !== ',') {
                    result += ' ';
                }
            }
            continue;
        }

        // Handle at-rules
        if (char === '@') {
            inProperty = false;
            if (indentLevel === 0 && result && !result.endsWith('\n\n')) {
                result += '\n\n';
            } else if (indentLevel > 0 && result.endsWith('\n')) {
                result += indent.repeat(indentLevel);
            }

            // Copy at-rule until {
            while (i < css.length && css[i] !== '{') {
                if (/\s/.test(css[i])) {
                    skipWhitespace();
                    if (i < css.length && css[i] !== '{') {
                        result += ' ';
                    }
                } else {
                    result += css[i];
                    i++;
                }
            }
        }
        // Handle opening brace
        else if (char === '{') {
            inProperty = false;
            if (!result.endsWith(' ')) {
                result += ' ';
            }
            result += '{\n';
            indentLevel++;
            i++;
        }
        // Handle closing brace
        else if (char === '}') {
            inProperty = false;
            result = result.trimEnd();
            if (!result.endsWith(';') && !result.endsWith('{') && !result.endsWith('}')) {
                result += ';';
            }
            if (!result.endsWith('\n')) {
                result += '\n';
            }
            indentLevel--;
            result += indent.repeat(indentLevel) + '}';
            i++;

            skipWhitespace();
            
            // Add spacing after }
            if (i < css.length && css[i] !== '}') {
                const nextContent = css.substring(i, Math.min(i + 10, css.length));
                const isKeyframeSelector = /^[\d]/.test(nextContent) || /^from/.test(nextContent) || /^to/.test(nextContent);
                
                if (isKeyframeSelector) {
                    result += '\n';
                } else if (indentLevel === 0) {
                    result += '\n\n';
                } else {
                    result += '\n';
                }
            }
        }
        // Handle colon
        else if (char === ':') {
            // Check if this is a property colon or a selector pseudo-class
            // If we just had a newline + indentation, this is likely a property
            if (result.endsWith('\n' + indent.repeat(indentLevel)) || inProperty) {
                // This is a property colon
                result += ': ';
                inProperty = true;
            } else {
                // This is a selector pseudo-class/element - keep as-is
                result += ':';
            }
            i++;
        }
        // Handle semicolon
        else if (char === ';') {
            inProperty = false;
            result += ';\n';
            i++;
            if (i < css.length && css[i] !== '}') {
                result += indent.repeat(indentLevel);
            }
        }
        // Handle comma
        else if (char === ',') {
            result += ', ';
            i++;
        }
        // Handle comments
        else if (char === '/' && i + 1 < css.length && css[i + 1] === '*') {
            const commentEnd = css.indexOf('*/', i + 2);
            if (commentEnd !== -1) {
                const comment = css.substring(i, commentEnd + 2);
                result += '\n' + indent.repeat(indentLevel) + comment + '\n';
                if (indentLevel > 0) {
                    result += indent.repeat(indentLevel);
                }
                i = commentEnd + 2;
            } else {
                result += char;
                i++;
            }
        }
        // Regular character
        else {
            if (result.endsWith('\n')) {
                result += indent.repeat(indentLevel);
            }
            result += char;
            i++;
        }
    }

    // Cleanup
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.replace(/ +$/gm, '');

    return result.trim() + '\n';
}

export function deactivate() {}
