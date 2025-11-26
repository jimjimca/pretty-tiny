import * as vscode from 'vscode';
import { beautifyCSS, minifyCSS } from './css';

const selfClosingTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect', 'stop', 'use', 'animate', 'animateTransform', 'set'
]);

export function minifyHTML(html: string, removeComments: boolean = true, indentSize: number = 4): string {
    // Preserve PHP blocks FIRST (before anything else)
    const phpBlocks: string[] = [];
    html = html.replace(/<\?(?:php|=)[\s\S]*?\?>/gi, (match) => {
        phpBlocks.push(match);
        return `__PHP_${phpBlocks.length - 1}__`;
    });

    let result = html;

    // Preserve <script> tags with their content
    const scripts: string[] = [];
    result = result.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, (match) => {
        const cleaned = match.replace(/\n\s+(<\/script>)/g, '\n$1');
        scripts.push(cleaned);
        return `__SCRIPT_${scripts.length - 1}__`;
    });

    // Preserve <pre> tags with their content
    const pres: string[] = [];
    result = result.replace(/<pre[^>]*>[\s\S]*?<\/pre>/gi, (match) => {
        pres.push(match);
        return `__PRE_${pres.length - 1}__`;
    });

    // Preserve <textarea> tags with their content
    const textareas: string[] = [];
    result = result.replace(/<textarea[^>]*>[\s\S]*?<\/textarea>/gi, (match) => {
        textareas.push(match);
        return `__TEXTAREA_${textareas.length - 1}__`;
    });

    // Minify CSS inside <style> tags
    result = result.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
        const minifiedCSS = minifyCSS(cssContent.trim(), removeComments);
        return match.replace(cssContent, minifiedCSS);
    });

    // Remove comments
    if (removeComments) {
        result = result.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Remove leading whitespace and empty lines
    const lines = result.split('\n');
    result = lines.map(line => line.replace(/^\s+/, '')).filter(line => line.length > 0).join('\n');
    
    // Collapse multiple whitespaces to single space
    result = result.replace(/\s{2,}/g, ' ');
    
    // Remove all newlines
    result = result.replace(/\n/g, '');

    // Restore preserved content
    scripts.forEach((script, index) => {
        result = result.replace(`__SCRIPT_${index}__`, `\n${script}\n`);
    });

    pres.forEach((pre, index) => {
        result = result.replace(`__PRE_${index}__`, pre);
    });

    textareas.forEach((textarea, index) => {
        result = result.replace(`__TEXTAREA_${index}__`, textarea);
    });

    // Restore PHP blocks last
    phpBlocks.forEach((php, index) => {
        result = result.replace(`__PHP_${index}__`, php);
    });

    return result.trim();
}

function normalizeIndentation(content: string, targetIndent: string): string {
    const lines = content.split('\n');
    
    // Remove empty lines at start and end
    while (lines.length > 0 && lines[0].trim().length === 0) {
        lines.shift();
    }
    while (lines.length > 0 && lines[lines.length - 1].trim().length === 0) {
        lines.pop();
    }
    
    if (lines.length === 0) return '';
    
    // Find minimum indentation
    let minIndent = Infinity;
    for (const line of lines) {
        if (line.trim().length === 0) continue;
        const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
        minIndent = Math.min(minIndent, leadingSpaces);
    }
    
    if (minIndent === Infinity) minIndent = 0;
    
    // Apply target indentation
    return lines.map(line => {
        if (line.trim().length === 0) return '';
        const stripped = line.substring(minIndent);
        return targetIndent + stripped;
    }).join('\n');
}

export function beautifyHTML(html: string, indentSize: number = 4): string {
    // Preserve PHP blocks FIRST (before anything else)
    const phpBlocks: string[] = [];
    html = html.replace(/<\?(?:php|=)[\s\S]*?\?>/gi, (match) => {
        phpBlocks.push(match);
        return `__PHP_${phpBlocks.length - 1}__`;
    });

    const indent = ' '.repeat(indentSize);
    let result = '';
    let level = 0;

    let i = 0;
    const len = html.length;

    // Skip whitespace
    function skipWhitespace() {
        while (i < len && /\s/.test(html[i])) {
            i++;
        }
    }
    
    // Extract tag name from opening tag
    function extractTagName(tag: string): string {
        let name = '';
        let j = 1;
        while (j < tag.length && !/[\s/>]/.test(tag[j])) {
            name += tag[j];
            j++;
        }
        return name.toLowerCase();
    }

    // Check if element contains direct text (not just nested tags)
    function hasDirectText(startPos: number, tagName: string): boolean {
        let pos = startPos;
        const openTags: string[] = [];
        let placeholderCount = 0;
        let hasOtherContent = false;
        
        while (pos < len) {
            if (/\s/.test(html[pos])) {
                pos++;
                continue;
            }
            
            // Closing tag
            if (html.substring(pos, pos + 2) === '</') {
                const closeEnd = html.indexOf('>', pos);
                const closeTagName = html.substring(pos + 2, closeEnd).trim().toLowerCase();
                
                if (openTags.length === 0 && closeTagName === tagName) {
                    // Only inline if exactly 1 placeholder and nothing else
                    return placeholderCount === 1 && !hasOtherContent;
                }
                
                if (openTags.length > 0 && openTags[openTags.length - 1] === closeTagName) {
                    openTags.pop();
                }
                
                pos = closeEnd + 1;
                continue;
            }
            
            // Opening tag
            if (html[pos] === '<') {
                hasOtherContent = true;  // Found a tag
                const openEnd = html.indexOf('>', pos);
                const openTag = html.substring(pos, openEnd + 1);
                const openTagName = extractTagName(openTag);
                
                if (!selfClosingTags.has(openTagName)) {
                    openTags.push(openTagName);
                }
                
                pos = openEnd + 1;
                continue;
            }
            
            // Text or placeholder at depth 0
            if (openTags.length === 0) {
                // PHP placeholder
                if (html.substring(pos).startsWith('__PHP_')) {
                    placeholderCount++;
                    const endPlaceholder = html.indexOf('__', pos + 6);
                    if (endPlaceholder !== -1) {
                        pos = endPlaceholder + 2;
                        continue;
                    }
                }
                
                // Real text found
                return true;
            }
            
            pos++;
        }
        
        return placeholderCount === 1 && !hasOtherContent;
    }

    // Collect content until closing tag
    function collectInlineContent(startPos: number, tagName: string): { content: string; endPos: number } {
        let content = '';
        let pos = startPos;
        const openTags: string[] = [];
        
        while (pos < len) {
            // Closing tag
            if (html.substring(pos, pos + 2) === '</') {
                const closeEnd = html.indexOf('>', pos);
                const closeTagName = html.substring(pos + 2, closeEnd).trim().toLowerCase();
                
                if (openTags.length === 0 && closeTagName === tagName) {
                    return { content, endPos: pos };
                }
                
                const closeTag = html.substring(pos, closeEnd + 1);
                content += closeTag;
                pos = closeEnd + 1;
                
                if (openTags.length > 0 && openTags[openTags.length - 1] === closeTagName) {
                    openTags.pop();
                }
                
                continue;
            }
            
            // Opening tag
            if (html[pos] === '<') {
                const openEnd = html.indexOf('>', pos);
                const openTag = html.substring(pos, openEnd + 1);
                const openTagName = extractTagName(openTag);
                
                content += openTag;
                pos = openEnd + 1;
                
                if (!selfClosingTags.has(openTagName)) {
                    openTags.push(openTagName);
                }
                
                continue;
            }
            
            content += html[pos];
            pos++;
        }
        
        return { content: '', endPos: pos };
    }
        
    // ========================================================================
    // MAIN LOOP
    // ========================================================================
    
    while (i < len) {
        skipWhitespace();
        if (i >= len) break;
        
        // DOCTYPE
        if (html.substring(i, i + 9).toLowerCase() === '<!doctype') {
            const end = html.indexOf('>', i);
            result += html.substring(i, end + 1) + '\n';
            i = end + 1;
            continue;
        }
        
        // Comment
        if (html.substring(i, i + 4) === '<!--') {
            const end = html.indexOf('-->', i);
            if (end !== -1) {
                result += indent.repeat(level) + html.substring(i, end + 3) + '\n';
                i = end + 3;
                continue;
            }
        }

        // PHP placeholder
        if (html.substring(i).startsWith('__PHP_')) {
            const endPlaceholder = html.indexOf('__', i + 6);
            if (endPlaceholder !== -1) {
                const placeholder = html.substring(i, endPlaceholder + 2);
                result += indent.repeat(level) + placeholder + '\n';
                i = endPlaceholder + 2;
                continue;
            }
        }

        // Closing tag
        if (html.substring(i, i + 2) === '</') {
            level = Math.max(0, level - 1);
            const end = html.indexOf('>', i);
            result += indent.repeat(level) + html.substring(i, end + 1) + '\n';
            i = end + 1;
            continue;
        }
        
        // Opening tag
        if (html[i] === '<') {
            const tagEnd = html.indexOf('>', i);
            if (tagEnd === -1) break;
            
            const tag = html.substring(i, tagEnd + 1);
            const tagName = extractTagName(tag);
            const isSelfClosing = selfClosingTags.has(tagName);
            
            // <script> - preserve with normalized indentation
            if (tagName === 'script') {
                const closeTag = '</script>';
                const closeIndex = html.indexOf(closeTag, tagEnd);
                
                if (closeIndex !== -1) {
                    const content = html.substring(tagEnd + 1, closeIndex);
                    
                    if (content.length > 0) {
                        if (content.trim().length === 0) {
                            // Only whitespace - preserve as-is (for CSS animation hacks)
                            result += indent.repeat(level) + tag + content + closeTag + '\n';
                        } else {
                            // Normal script - normalize indentation
                            const normalized = normalizeIndentation(content, indent.repeat(level + 1));
                            result += indent.repeat(level) + tag + '\n';
                            result += normalized + '\n';
                            result += indent.repeat(level) + closeTag + '\n';
                        }
                    } else {
                        result += indent.repeat(level) + tag + closeTag + '\n';
                    }
                    
                    i = closeIndex + closeTag.length;
                    continue;
                }
            }
            
            // <pre> - preserve exactly
            if (tagName === 'pre') {
                const closeTag = '</pre>';
                const closeIndex = html.indexOf(closeTag, tagEnd);
                
                if (closeIndex !== -1) {
                    const content = html.substring(tagEnd + 1, closeIndex);
                    result += indent.repeat(level) + tag + content + closeTag + '\n';
                    i = closeIndex + closeTag.length;
                    continue;
                }
            }
            
            // <textarea> - preserve exactly
            if (tagName === 'textarea') {
                const closeTag = '</textarea>';
                const closeIndex = html.indexOf(closeTag, tagEnd);
                
                if (closeIndex !== -1) {
                    const content = html.substring(tagEnd + 1, closeIndex);
                    result += indent.repeat(level) + tag + content + closeTag + '\n';
                    i = closeIndex + closeTag.length;
                    continue;
                }
            }
            
            // <style> - beautify CSS content
            if (tagName === 'style') {
                const closeTag = '</style>';
                const closeIndex = html.indexOf(closeTag, tagEnd);
                
                if (closeIndex !== -1) {
                    const cssContent = html.substring(tagEnd + 1, closeIndex).trim();
                    
                    if (cssContent) {
                        const formatted = beautifyCSS(cssContent, indentSize);
                        const indented = formatted.split('\n')
                            .map(line => line.trim() ? indent.repeat(level + 1) + line : '')
                            .join('\n');
                        
                        result += indent.repeat(level) + tag + '\n';
                        result += indented + '\n';
                        result += indent.repeat(level) + closeTag + '\n';
                    } else {
                        result += indent.repeat(level) + tag + closeTag + '\n';
                    }
                    
                    i = closeIndex + closeTag.length;
                    continue;
                }
            }
            
            // Normal tags - check for inline content
            const hasText = hasDirectText(tagEnd + 1, tagName);
            const forceBlockMode = tagName === 'video' || tagName === 'audio';

            if (hasText && !isSelfClosing && !forceBlockMode) {
                const { content, endPos } = collectInlineContent(tagEnd + 1, tagName);
                
                if (content.trim()) {
                    // Preserve leading/trailing spaces, collapse internal whitespace
                    const hasLeadingSpace = /^\s/.test(content);
                    const hasTrailingSpace = /\s$/.test(content);
                    const trimmed = content.trim();
                    const collapsed = trimmed.replace(/\s+/g, ' ');
                    const normalized = (hasLeadingSpace ? ' ' : '') + collapsed + (hasTrailingSpace ? ' ' : '');
                    
                    result += indent.repeat(level) + tag + normalized + '</' + tagName + '>\n';
                    i = endPos + ('</' + tagName + '>').length;
                    continue;
                }
            }

            // Block mode
            result += indent.repeat(level) + tag + '\n';

            if (!isSelfClosing) {
                level++;
            }

            i = tagEnd + 1;
            continue;
        }
        
        // Text content
        let text = '';
        while (i < len && html[i] !== '<') {
            text += html[i];
            i++;
        }

        text = text.trim();
        if (text) {
            result += indent.repeat(level) + text + '\n';
        }
    }

    // Restore PHP blocks last
    phpBlocks.forEach((php, index) => {
        result = result.replace(`__PHP_${index}__`, php);
    });

    return result.trim() + '\n';
}