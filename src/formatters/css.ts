import * as vscode from 'vscode';

export function minifyCSS(css: string, removeComments: boolean = true): string {
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

export function beautifyCSS(css: string, indentSize: number = 4): string {
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
    function skipWhitespace(): boolean {
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
            } else if (indentLevel > 0 && result.endsWith('\n')) {
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
                } else {
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
                } else if (indentLevel === 0) {
                    result += '\n\n';
                } else {
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
            
            const isSelector = 
                indentLevel === 0 ||
                colonsOnLine > 0 ||
                trimmedLine.length === 0 ||
                /^[&*\.#\[\]>+~,:]/.test(trimmedLine) ||
                (nextBraceIndex !== -1 && (nextSemiIndex === -1 || nextBraceIndex < nextSemiIndex));
            
            if (!isSelector && indentLevel > 0) {
                result += ': ';
                inProperty = true;
            } else {
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
            } else {
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
                
                let afterCommentIndex = commentEnd + 2;
                while (afterCommentIndex < len && /\s/.test(css[afterCommentIndex])) {
                    afterCommentIndex++;
                }
                const followedBySemicolon = afterCommentIndex < len && css[afterCommentIndex] === ';';
                
                const lastNonSpace = result.trimEnd();
                const isInline = lastNonSpace.length > 0 && !lastNonSpace.endsWith('\n');
                
                if (isInline) {
                    if (!result.endsWith(' ')) {
                        result += ' ';
                    }
                    result += comment;
                    i = commentEnd + 2;
                    
                    if (followedBySemicolon) {
                        while (i < len && /\s/.test(css[i])) {
                            i++;
                        }
                    } else {
                        result += '\n';
                        while (i < len && /\s/.test(css[i])) {
                            i++;
                        }
                        if (i < len && css[i] !== '}') {
                            result += indent.repeat(indentLevel);
                        }
                    }
                } else {
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
            } else {
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