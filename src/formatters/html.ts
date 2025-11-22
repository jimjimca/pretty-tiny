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
    
    // Inline tags that should keep content on same line
    const inlineTags = /^<(span|a|strong|em|b|i|code|small|label|button)/i;

    // Split by tags but keep text with its opening tag
    const tokens: string[] = [];
    let i = 0;
    
    while (i < html.length) {
        if (html[i] === '<') {
            const tagEnd = html.indexOf('>', i);
            if (tagEnd !== -1) {
                const tag = html.substring(i, tagEnd + 1);
                tokens.push(tag);
                i = tagEnd + 1;
            } else {
                i++;
            }
        } else {
            // Collect text until next tag
            let text = '';
            while (i < html.length && html[i] !== '<') {
                text += html[i];
                i++;
            }
            if (text.trim()) {
                tokens.push(text.trim());
            }
        }
    }

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        // Skip empty tokens
        if (!token.trim()) continue;

        // HTML comment
        if (token.startsWith('<!--')) {
            result += indent.repeat(level) + token + '\n';
            continue;
        }

        // Closing tag
        if (token.startsWith('</')) {
            level = Math.max(0, level - 1);
            result += indent.repeat(level) + token + '\n';
            continue;
        }

        // Opening tag
        if (token.startsWith('<')) {
            const isSelfClosing = token.endsWith('/>') || selfClosingTags.test(token);
            const isInline = inlineTags.test(token);
            
            // Check if next token is text content
            const nextToken = i + 1 < tokens.length ? tokens[i + 1] : '';
            const hasTextContent = nextToken && !nextToken.startsWith('<');

            if (hasTextContent && isInline) {
                // Inline tag with text - keep on same line
                result += indent.repeat(level) + token + nextToken;
                i++; // Skip next token (we consumed it)
            } else if (hasTextContent) {
                // Block tag with text - put text on same line as opening tag
                result += indent.repeat(level) + token + nextToken + '\n';
                i++; // Skip next token
            } else {
                // Tag without immediate text content
                result += indent.repeat(level) + token + '\n';
            }

            if (!isSelfClosing) {
                level++;
            }
            continue;
        }

        // Standalone text (shouldn't happen often)
        result += indent.repeat(level) + token + '\n';
    }

    // Cleanup
    result = result.replace(/\n{3,}/g, '\n\n');
    result = result.replace(/ +$/gm, '');

    return result.trim() + '\n';
}