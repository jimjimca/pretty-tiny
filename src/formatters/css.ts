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
            
            // Check if there's a comment after the semicolon
            let tempI = i;
            let hasNewlineBeforeComment = false;
            while (tempI < len && /[ \t\r]/.test(css[tempI])) {
                tempI++;
            }
            if (tempI < len && css[tempI] === '\n') {
                hasNewlineBeforeComment = true;
            }
            
            // Skip to find if there's a comment
            tempI = i;
            while (tempI < len && /\s/.test(css[tempI])) {
                tempI++;
            }
            const hasComment = css.substring(tempI, tempI + 2) === '/*';
            const hasInlineComment = hasComment && !hasNewlineBeforeComment;
            
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
                
                // Check if result ends with newline (comment is on its own line)
                const endsWithNewline = result.endsWith('\n');
                const isInline = !endsWithNewline;
                
                // Check if there was a blank line before this comment in the original
                let blankLinesBefore = 0;
                let checkIndex = i - 1;
                let foundContent = false;
                while (checkIndex >= 0 && !foundContent) {
                    if (css[checkIndex] === '\n') {
                        blankLinesBefore++;
                        checkIndex--;
                    } else if (/\s/.test(css[checkIndex])) {
                        checkIndex--;
                    } else {
                        foundContent = true;
                    }
                }
                const hasBlankLineBefore = blankLinesBefore >= 2;
                
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
                    
                    // Add blank line before comment if it was there in the original
                    if (hasBlankLineBefore && !result.endsWith('\n\n')) {
                        result += '\n';
                    }
                    
                    // Add indentation before the comment
                    result += indent.repeat(indentLevel) + comment + '\n';

                    
                    // Skip whitespace after comment
                    i = commentEnd + 2;
                    while (i < len && /\s/.test(css[i])) {
                        i++;
                    }
                    
                    // Add indent for next line if not closing brace
                    if (i < len && css[i] !== '}') {
                        result += indent.repeat(indentLevel);
                    }
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