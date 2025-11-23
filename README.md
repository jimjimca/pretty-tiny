# Pretty Tiny

Instant toggle between minified and beautified HTML/CSS. 
A code formatter for dev and production workflows.

[![Version](https://img.shields.io/visual-studio-marketplace/v/jimjimca.pretty-tiny)](https://marketplace.visualstudio.com/items?itemName=jimjimca.pretty-tiny)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/jimjimca.pretty-tiny)](https://marketplace.visualstudio.com/items?itemName=jimjimca.pretty-tiny)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/jimjimca.pretty-tiny)](https://marketplace.visualstudio.com/items?itemName=jimjimca.pretty-tiny)
[![License](https://img.shields.io/github/license/jimjimca/pretty-tiny)](LICENSE)

Perfect for **Pretty** development and **Tiny** production.  
Fast. Lightweight. Zero dependencies.
Supports **format on save** to keep your code readable automatically.

- **Pretty** = Readable code for development.
- **Tiny** = Compressed code for production.

## Why Pretty Tiny?

- **Toggle Pretty ↔ Tiny** with one command
- **Status bar indicator** shows current mode
- **Remembers mode per file**
- **Auto-format on save** in Pretty mode
- Works on **full file or selection**
- **HTML formatter and CSS minifier** in the same extension

## Features

### CSS
-   **CSS Minification** - Compress your CSS to save space (Tiny mode)
-   **CSS Beautification** - Format your CSS for readability (Pretty mode)
-   **Advanced CSS Support** - Handles complex selectors, nested rules, media queries, keyframes, pseudo-classes, and more

### HTML
-   **HTML Minification** - Compress your HTML while preserving special tags
-   **HTML Beautification** - Format your HTML with smart inline detection
-   **Intelligent Formatting** - Detects when content should be inline (`<p>Text</p>`) or block
-   **Special Tag Preservation** - `<script>`, `<pre>`, `<textarea>` content preserved exactly
-   **CSS Formatting in `<style>`** - Automatically formats embedded CSS using Pretty Tiny
-   **SVG Support** - Handles inline and block SVG elements

### General
-   **Mode Memory** - Remembers formatting preference per file across sessions
-   **Auto-format on Save** - Keep your code formatted automatically in Pretty mode
-   **Zero Dependencies** - 100% native TypeScript implementation
-   **Configurable** - Customize indentation size and comment handling
-   **Visual Mode Indicator** - Status bar shows current mode
-   **Selection Support** - Works on selected text or entire file

## Usage

Pretty Tiny works as a **VS Code HTML formatter and CSS minifier**.  
Use commands or the **format on save** option to automatically beautify or minify your files.

### Available Commands

Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

-   **`Pretty Tiny: Minify`** - Minify CSS/HTML code and switch to Tiny mode
-   **`Pretty Tiny: Beautify`** - Beautify CSS/HTML code and switch to Pretty mode
-   **`Pretty Tiny: Toggle Pretty/Tiny`** - Automatically toggle between modes
-   **`Pretty Tiny: Change Mode`** - Select mode (Pretty/Tiny/Normal)

### Keyboard Shortcuts

-   **`Ctrl+Alt+M`** (Windows/Linux)
-   **`Ctrl+Cmd+M`** (Mac)

Quickly toggle between Pretty and Tiny modes.

### Mode Indicator

Look for the mode indicator in the status bar (bottom right):

-   **CSS: Pretty** / **HTML: Pretty** - Auto-beautify enabled on save
-   **CSS: Tiny** / **HTML: Tiny** - Keep code minified
-   **CSS: Normal** / **HTML: Normal** - No automatic processing

Click the indicator to quickly change modes.

## Modes Explained

### Pretty Mode

-   **Beautifies code** with proper indentation and spacing
-   **Auto-formats on save** - your code stays clean automatically
-   **Keeps comments** - preserves your documentation
-   **Perfect for development** - readable and maintainable

### Tiny Mode

-   **Minifies code** - removes unnecessary whitespace
-   **Removes semicolons** before closing braces
-   **Optional comment removal** - configurable in settings
-   **Perfect for production** - smallest file size

### Normal Mode

-   **No automatic processing** - manual control only
-   **Use commands when needed** - toggle on demand

## Configuration

Access settings in **File > Preferences > Settings** (or **Code > Preferences > Settings** on Mac):

```json
{
    // Number of spaces for indentation (default: 4)
    "prettyTiny.indentSize": 4,

    // Remove comments when minifying (default: true)
    "prettyTiny.removeComments": true,

    // Auto-beautify on save in Pretty mode (default: true)
    "prettyTiny.autoBeautifyOnSave": true,

    // Default mode for new CSS files (default: "pretty")
    "prettyTiny.defaultMode": "pretty"
}
```

### Settings Details

**`prettyTiny.indentSize`**

-   Controls the number of spaces used for indentation when beautifying
-   Default: `4`
-   Example: Set to `2` for 2-space indentation

**`prettyTiny.removeComments`**

-   When enabled, comments are removed during minification
-   When disabled, comments are preserved even in Tiny mode
-   Default: `true`
-   **Note:** Pretty mode always keeps comments regardless of this setting

**`prettyTiny.autoBeautifyOnSave`**

-   When enabled, code is automatically beautified on save in Pretty mode
-   Default: `true`

**`prettyTiny.defaultMode`**

- Sets the default mode for files when opened for the first time
- Options: `"pretty"`, `"tiny"`, `"auto"`
- Default: `"pretty"`
- **Note:** Once you change a file's mode, that preference is remembered for that specific file

## Examples

### CSS

#### Before Pretty Mode

```css
body,
html {
    
    margin: 0;
    padding: 0;
}
*,*::before,*::after {
    box-sizing: border-box;
}
.container:has( > section:target) section:not(:target) {
    opacity: 0.5;
}
&:hover {box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);}

@media screen and (max-width: 768px) {
    body {font-size: 14px; color:rebeccapurple;}
}
```

#### After Pretty Mode

```css
body, html {
    margin: 0;
    padding: 0;
}

*, *::before, *::after {
    box-sizing: border-box;
}

.container:has( > section:target) section:not(:target) {
    opacity: 0.5;
}

&:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media screen and (max-width: 768px) {
    body {
        font-size: 14px;
        color: rebeccapurple;
    }
}
```

#### After Tiny Mode

```css
body,html{margin:0;padding:0}*,*::before,*::after{box-sizing:border-box}.container:has(>section:target) section:not(:target){opacity:0.5}&:hover{box-shadow:0 4px 12px rgba(0,0,0,0.15)}@media screen and (max-width:768px){body{font-size:14px;color:rebeccapurple}}
```

### HTML

#### Before Pretty Mode

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
</head>
<body>
<main>
<p>Lorem ipsum <strong>bold</strong></p>
</main>
</body>
</html>
```

#### After Pretty Mode

```html
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document</title>
    </head>
    <body>
        <main>
            <p>Lorem ipsum <strong>bold</strong></p>
        </main>
    </body>
</html>
```

#### After Tiny Mode

```html
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Document</title></head><body><main><p>Lorem ipsum <strong>bold</strong></p></main></body></html>
```

## Supported CSS Features

### CSS Features
-   **Nested rules** - `&:hover`, `&.active`
-   **Media queries** - `@media`, `@supports`
-   **Keyframes** - `@keyframes`, including nested in `@media`
-   **Pseudo-classes** - `:hover`, `:focus`, `:has()`, `:not()`, `:is()`
-   **Pseudo-elements** - `::before`, `::after`
-   **Complex selectors** - attribute selectors, combinators
-   **CSS variables** - `var(--custom-property)`
-   **CSS functions** - `calc()`, `clamp()`, `rgba()`, `linear-gradient()`

### HTML Features
-   **Smart inline detection** - `<p>Text</p>` formatted on one line
-   **Block formatting** - Nested structures properly indented
-   **Special tag preservation**:
    -   `<script>` - JavaScript with normalized indentation
    -   `<pre>` - Preformatted text preserved exactly
    -   `<textarea>` - Content preserved with spacing
    -   `<style>` - CSS automatically formatted
-   **SVG support** - Inline and block SVG elements
-   **HTML5 elements** - `<video>`, `<audio>`, `<details>`, `<dialog>`, etc.
-   **Self-closing tags** - Proper handling of `<img>`, `<br>`, `<input>`, etc.
-   **Comments** - Preserved in Pretty mode, optional in Tiny mode
-   **Entities** - HTML entities preserved (`&nbsp;`, `&copy;`, etc.)

## Workflow Examples

### Development Workflow

1. Open your CSS/HTML file
2. Click the status bar indicator → Select **Pretty Mode**
3. Your code is automatically formatted on every save
4. Work with clean, readable code

### Production Workflow

1. Finished with development
2. Use `Ctrl+Alt+M` (macOS: `Ctrl+Cmd+M`) to toggle to Tiny mode
3. Your code is now optimized for production
4. Deploy the minified file

### Quick Formatting

1. Select a block of code
2. Press `Ctrl+Alt+M` (macOS: `Ctrl+Cmd+M`)
3. Only the selected code is formatted

## Known Limitations

-   Designed for CSS and HTML only (not SCSS, LESS, JSX, or other preprocessors)
-   Does not validate syntax
-   Cannot recover from malformed code

## License

MIT

## Feedback & Issues

Found a bug or have a suggestion? Please report it on [GitHub](https://github.com/jimjimca/pretty-tiny/issues)

---

Enjoy coding with Pretty Tiny!
