import * as vscode from 'vscode';
import { beautifyCSS, minifyCSS } from './formatters/css';
import { beautifyHTML, minifyHTML } from './formatters/html';
// Global state for file modes
const fileModes = new Map<string, 'pretty' | 'mini' | 'auto'>();
let statusBarItem: vscode.StatusBarItem;
let workspaceState: vscode.Memento;

// Helper function to get full document range
function getFullDocumentRange(document: vscode.TextDocument): vscode.Range {
    const firstLine = document.lineAt(0);
    const lastLine = document.lineAt(document.lineCount - 1);
    return new vscode.Range(firstLine.range.start, lastLine.range.end);
}

export function activate(context: vscode.ExtensionContext) {
    // Store workspace state
    workspaceState = context.workspaceState;
    
    // Load saved file modes from workspace state
    const savedModes = workspaceState.get<Record<string, 'pretty' | 'mini' | 'auto'>>('fileModes', {});
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
    context.subscriptions.push(
        vscode.workspace.onWillSaveTextDocument((event) => {
            const document = event.document;

            // Check if it's a CSS or HTML file
            if (document.languageId !== 'css' && document.languageId !== 'html') return;

            const config = vscode.workspace.getConfiguration('prettyTiny');
            const autoBeautify = config.get<boolean>('autoBeautifyOnSave', true);

            if (!autoBeautify) return;

            const fileUri = document.uri.toString();
            const mode = fileModes.get(fileUri) || config.get<'pretty' | 'mini' | 'auto'>('defaultMode', 'auto');

            // If in pretty mode, beautify before save
            if (mode === 'pretty') {
                const indentSize = config.get<number>('indentSize', 4);
                const fullRange = getFullDocumentRange(document);

                const text = document.getText();
                const beautified = document.languageId === 'css'
                    ? beautifyCSS(text, indentSize)
                    : beautifyHTML(text, indentSize);

                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, fullRange, beautified);

                event.waitUntil(vscode.workspace.applyEdit(edit));
            }
        }),
    );

    // Command: Minify
    let miniCommand = vscode.commands.registerCommand('pretty-tiny.mini', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const language = document.languageId;
        
        // Check if supported language
        if (language !== 'css' && language !== 'html') {
            vscode.window.showWarningMessage('Pretty Tiny only supports CSS and HTML files');
            return;
        }

        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);

        // Cache config
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const removeComments = config.get<boolean>('removeComments', true);

        // Minify based on language
        const minified = language === 'css' 
            ? minifyCSS(text, removeComments)
            : minifyHTML(text, removeComments);

        await editor.edit((editBuilder) => {
            editBuilder.replace(range, minified);
        });

        // Set mode to mini
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'mini');
        saveFileModes();
        updateStatusBar();

        vscode.window.showInformationMessage(`${language.toUpperCase()} minified`);
    });

    // Command: Beautify
    let prettyCommand = vscode.commands.registerCommand('pretty-tiny.pretty', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const language = document.languageId;
        
        // Check if supported language
        if (language !== 'css' && language !== 'html') {
            vscode.window.showWarningMessage('Pretty Tiny only supports CSS and HTML files');
            return;
        }

        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);

        // Cache config
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const indentSize = config.get<number>('indentSize', 4);

        // Beautify based on language
        const beautified = language === 'css'
            ? beautifyCSS(text, indentSize)
            : beautifyHTML(text, indentSize);

        await editor.edit((editBuilder) => {
            editBuilder.replace(range, beautified);
        });

        // Set mode to pretty
        const fileUri = document.uri.toString();
        fileModes.set(fileUri, 'pretty');
        saveFileModes();
        updateStatusBar();

        vscode.window.showInformationMessage(
            `${language.toUpperCase()} beautified`,
        );
    });

    // Command: Toggle
    let toggleCommand = vscode.commands.registerCommand('pretty-tiny.toggle', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const document = editor.document;
        const language = document.languageId;
        
        // Check if supported language
        if (language !== 'css' && language !== 'html') {
            vscode.window.showWarningMessage('Pretty Tiny only supports CSS and HTML files');
            return;
        }

        const selection = editor.selection;
        const range = selection.isEmpty ? getFullDocumentRange(document) : selection;
        const text = document.getText(range);
        const fileUri = document.uri.toString();

        // Cache config once
        const config = vscode.workspace.getConfiguration('prettyTiny');

        // Detect if content is minified
        const lineCount = text.split('\n').length;
        const charCount = text.length;
        const isMinified = lineCount < 5 || charCount / lineCount > 100;

        if (isMinified) {
            // Beautify
            const indentSize = config.get<number>('indentSize', 4);
            const beautified = language === 'css'
                ? beautifyCSS(text, indentSize)
                : beautifyHTML(text, indentSize);

            await editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });

            fileModes.set(fileUri, 'pretty');
            saveFileModes();
            updateStatusBar();
            vscode.window.showInformationMessage(`${language.toUpperCase()} beautified`);
        } else {
            // Minify
            const removeComments = config.get<boolean>('removeComments', true);
            const minified = language === 'css'
                ? minifyCSS(text, removeComments)
                : minifyHTML(text, removeComments);

            await editor.edit((editBuilder) => {
                editBuilder.replace(range, minified);
            });

            fileModes.set(fileUri, 'mini');
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

        const language = editor.document.languageId;
        
        // Check if supported language
        if (language !== 'css' && language !== 'html') {
            vscode.window.showWarningMessage('Pretty Tiny only supports CSS and HTML files');
            return;
        }

        const fileUri = editor.document.uri.toString();
        const config = vscode.workspace.getConfiguration('prettyTiny');
        const currentMode = fileModes.get(fileUri) || config.get<'pretty' | 'mini' | 'auto'>('defaultMode', 'auto');

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
        saveFileModes();
        updateStatusBar();

        if (selectedMode === 'pretty') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const indentSize = config.get<number>('indentSize', 4);
            const beautified = language === 'css'
                ? beautifyCSS(text, indentSize)
                : beautifyHTML(text, indentSize);

            await editor.edit((editBuilder) => {
                editBuilder.replace(range, beautified);
            });

            vscode.window.showInformationMessage(`Pretty Mode (${language.toUpperCase()} beautified)`);
        } else if (selectedMode === 'mini') {
            const document = editor.document;
            const range = getFullDocumentRange(document);
            const text = document.getText(range);
            const removeComments = config.get<boolean>('removeComments', true);
            const minified = language === 'css'
                ? minifyCSS(text, removeComments)
                : minifyHTML(text, removeComments);

            await editor.edit((editBuilder) => {
                editBuilder.replace(range, minified);
            });

            vscode.window.showInformationMessage(`Mini Mode (${language.toUpperCase()} minified)`);
        } else {
            vscode.window.showInformationMessage('Normal Mode');
        }
    });
    context.subscriptions.push(miniCommand, prettyCommand, toggleCommand, setModeCommand);
}

function saveFileModes() {
    const modesToSave: Record<string, 'pretty' | 'mini' | 'auto'> = {};
    fileModes.forEach((mode, uri) => {
        modesToSave[uri] = mode;
    });
    workspaceState.update('fileModes', modesToSave);
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

    // Show status bar only for CSS and HTML files
    if (!editor || (editor.document.languageId !== 'css' && editor.document.languageId !== 'html')) {
        statusBarItem.hide();
        return;
    }

    const fileUri = editor.document.uri.toString();
    
    // Get default mode from settings
    const config = vscode.workspace.getConfiguration('prettyTiny');
    const defaultMode = config.get<'pretty' | 'mini' | 'auto'>('defaultMode', 'auto');
    
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

    // Show language in status bar
    const lang = editor.document.languageId.toUpperCase();
    statusBarItem.text = `${lang}: ${labels[mode]}`;
    statusBarItem.tooltip = 'Pretty Tiny - Change mode';
    statusBarItem.show();
}
export function deactivate() {}