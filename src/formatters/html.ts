import * as vscode from 'vscode';
import { beautifyCSS, minifyCSS } from './css';

const selfClosingTags = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

export function minifyHTML(html: string, removeComments: boolean = true, indentSize: number = 4): string {
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

    // Minify CSS inside <style> tags with minifyCSS
    result = result.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, cssContent) => {
        const minifiedCSS = minifyCSS(cssContent.trim(), removeComments);
        return match.replace(cssContent, minifiedCSS);
    });

    // Remove comments according to config
    if (removeComments) {
        result = result.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Remove ALL leading whitespace
    const lines = result.split('\n');
    result = lines.map(line => line.replace(/^\s+/, '')).filter(line => line.length > 0).join('\n');
    
    // Collapse multiple whitespaces to single space
    result = result.replace(/\s{2,}/g, ' ');
    
    // Remove all remaining newlines
    result = result.replace(/\n/g, '');

    // Restore <script> tags with separation from the HTML
    scripts.forEach((script, index) => {
        result = result.replace(`__SCRIPT_${index}__`, `\n${script}\n`);
    });

    // Restore <pre> tags
    pres.forEach((pre, index) => {
        result = result.replace(`__PRE_${index}__`, `${pre}`);
    });

    // Restore <script> tags
    textareas.forEach((textarea, index) => {
        result = result.replace(`__TEXTAREA_${index}__`, `${textarea}`);
    });

    return result.trim();
}

export function beautifyHTML(html: string, indentSize: number = 4): string {
    const indent = ' '.repeat(indentSize);
    let result = '';
    let level = 0;

    let i = 0;
    const len = html.length;

    // Skip whitespace helper
    function skipWhitespace() {
        while (i < len && /\s/.test(html[i])) {
            i++;
        }
    }

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
            const end = html.indexOf('>', i);
            if (end !== -1) {
                const tag = html.substring(i, end + 1);
                
                // Extract tag name
                let tagName = '';
                let j = 1; // Skip '<'
                while (j < tag.length && !/[\s/>]/.test(tag[j])) {
                    tagName += tag[j];
                    j++;
                }
                tagName = tagName.toLowerCase();
                
                result += indent.repeat(level) + tag + '\n';
                
                // Check if self-closing
                const isSelfClosing = selfClosingTags.has(tagName);
                
                if (!isSelfClosing) {
                    level++;
                }
                
                i = end + 1;
                continue;
            }
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

    return result.trim() + '\n';
}