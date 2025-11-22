import * as vscode from 'vscode';

export function minifyHTML(html: string, removeComments: boolean = true): string {
    let result = html;

    if (removeComments) {
        result = result.replace(/<!--[\s\S]*?-->/g, '');
    }

    result = result.replace(/>\s+</g, '><');
    result = result.trim();

    return result;
}

export function beautifyHTML(html: string, indentSize: number = 4): string {
    // Size safeguard
    if (html.length > 500000) {
        vscode.window.showWarningMessage('File too large to beautify (>500KB). Operation skipped.');
        return html;
    }

    const indent = ' '.repeat(indentSize);
    let result = '';
    let level = 0;

    // Self-closing tags
    const selfClosingTags = /^<(area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)/i;
    
    // Structural tags that should not increase indent for themselves
    const structuralTags = ['html', 'head', 'body'];

    // Split into tokens
    const tokens: string[] = [];
    let i = 0;
    
    while (i < html.length) {
        if (html[i] === '<') {
            const tagEnd = html.indexOf('>', i);
            if (tagEnd !== -1) {
                tokens.push(html.substring(i, tagEnd + 1));
                i = tagEnd + 1;
            } else {
                i++;
            }
        } else {
            // Collect text
            let text = '';
            while (i < html.length && html[i] !== '<') {
                text += html[i];
                i++;
            }
            const trimmed = text.trim();
            if (trimmed) {
                tokens.push(trimmed);
            }
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (!token.trim()) continue;

        // HTML comment
        if (token.startsWith('<!--')) {
            result += indent.repeat(level) + token + '\n';
            continue;
        }

        // Doctype
        if (token.toLowerCase().startsWith('<!doctype')) {
            result += token + '\n';
            continue;
        }

        // Closing tag
        if (token.startsWith('</')) {
            const tagName = token.substring(2, token.length - 1).trim().toLowerCase();
            
            // Check if previous token was text - if so, put closing tag on same line
            const prevToken = i > 0 ? tokens[i - 1] : '';
            const prevWasText = prevToken && !prevToken.startsWith('<');
            
            if (prevWasText) {
                // Text was on same line, close on same line
                result = result.trimEnd(); // Remove trailing newline from text
                result += token + '\n';
            } else {
                // Normal closing tag
                if (!structuralTags.includes(tagName)) {
                    level = Math.max(0, level - 1);
                }
                result += indent.repeat(level) + token + '\n';
            }
            continue;
        }

        // Opening tag
        if (token.startsWith('<')) {
            const isSelfClosing = token.endsWith('/>') || selfClosingTags.test(token);
            
            // Extract tag name
            let tagName = '';
            let j = 1; // Skip '<'
            while (j < token.length && !/[\s/>]/.test(token[j])) {
                tagName += token[j];
                j++;
            }
            tagName = tagName.toLowerCase();

            // Check if next token is text
            const nextToken = i + 1 < tokens.length ? tokens[i + 1] : '';
            const nextIsText = nextToken && !nextToken.startsWith('<');

            // Add the opening tag
            result += indent.repeat(level) + token;

            if (nextIsText) {
                // Text content follows - add it on same line
                result += nextToken;
                i++; // Skip next token
                // Don't add newline yet - closing tag will handle it
            } else {
                result += '\n';
            }

            // Increase indent for children (but not for structural tags)
            if (!isSelfClosing && !structuralTags.includes(tagName)) {
                level++;
            }
            continue;
        }

        // Standalone text (shouldn't happen if we consumed it above)
        result += indent.repeat(level) + token + '\n';
    }

    // Cleanup
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.replace(/ +$/gm, '');

    return result.trim() + '\n';
}