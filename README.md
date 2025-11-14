# Pretty Tiny

[![Version](https://img.shields.io/visual-studio-marketplace/v/jimjimca.pretty-tiny)](https://marketplace.visualstudio.com/items?itemName=jimjimca.pretty-tiny)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/jimjimca.pretty-tiny)](https://marketplace.visualstudio.com/items?itemName=jimjimca.pretty-tiny)
[![Rating](https://img.shields.io/visual-studio-marketplace/r/jimjimca.pretty-tiny)](https://marketplace.visualstudio.com/items?itemName=jimjimca.pretty-tiny)
[![License](https://img.shields.io/github/license/jimjimca/pretty-tiny)](LICENSE)

Minify and beautify CSS - Simple, fast, and powerful.

**Pretty** = Beautified, readable code  
**Mini** = Minified, compact code

## Features

-   **CSS Minification** - Compress your CSS to save space (Mini mode)
-   **CSS Beautification** - Format your CSS for readability (Pretty mode)
-   **Automatic Toggle** - Intelligently detects if CSS is minified or beautified
-   **Auto-beautify on Save** - Keep your code formatted automatically in Pretty mode
-   **Zero Dependencies** - 100% native TypeScript implementation
-   **Configurable** - Customize indentation size and comment handling
-   **Visual Mode Indicator** - Status bar shows current mode
-   **Selection Support** - Works on selected text or entire file
-   **Advanced CSS Support** - Handles nested rules, media queries, keyframes, pseudo-classes, and more

## Usage

### Available Commands

Open the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P`):

-   **`Pretty Tiny: Minify`** - Minify CSS code and switch to Mini mode
-   **`Pretty Tiny: Beautify`** - Beautify CSS code and switch to Pretty mode
-   **`Pretty Tiny: Toggle Pretty/Mini`** - Automatically toggle between modes
-   **`Pretty Tiny: Change Mode`** - Select mode (Pretty/Mini/Normal)

### Keyboard Shortcuts

-   **`Ctrl+Alt+M`** (Windows/Linux)
-   **`Ctrl+Cmd+M`** (Mac)

Quickly toggle between Pretty and Mini modes.

### Mode Indicator

Look for the mode indicator in the status bar (bottom right):

-   **CSS: Pretty** - Auto-beautify enabled on save
-   **CSS: Mini** - Keep code minified
-   **CSS: Normal** - No automatic processing

Click the indicator to quickly change modes.

## Modes Explained

### Pretty Mode

-   **Beautifies code** with proper indentation and spacing
-   **Auto-formats on save** - your CSS stays clean automatically
-   **Keeps comments** - preserves your documentation
-   **Perfect for development** - readable and maintainable

### Mini Mode

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
    "prettyTiny.autoBeautifyOnSave": true
}
```

### Settings Details

**`prettyTiny.indentSize`**

-   Controls the number of spaces used for indentation when beautifying
-   Default: `4`
-   Example: Set to `2` for 2-space indentation

**`prettyTiny.removeComments`**

-   When enabled, comments are removed during minification
-   When disabled, comments are preserved even in Mini mode
-   Default: `true`
-   **Note:** Pretty mode always keeps comments regardless of this setting

**`prettyTiny.autoBeautifyOnSave`**

-   When enabled, CSS is automatically beautified on save in Pretty mode
-   Default: `true`

## Examples

### Before Pretty Mode

```css
body,
html {
    margin: 0;
    padding: 0;
}
*,
*::before,
*::after {
    box-sizing: border-box;
}
.container:has(> section:target) section:not(:target) {
    opacity: 0.5;
}
&:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
@media screen and (max-width: 768px) {
    body {
        font-size: 14px;
    }
}
```

### After Pretty Mode

```css
body, html {
    margin: 0;
    padding: 0;
}

*, *::before, *::after {
    box-sizing: border-box;
}

.container:has(> section:target) section:not(:target) {
    opacity: 0.5;
}

&:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

@media screen and (max-width: 768px) {
    body {
        font-size: 14px;
    }
}
```

### After Mini Mode

```css
body,html{margin:0;padding:0}*,*::before,*::after{box-sizing:border-box}.container:has(>section:target) section:not(:target){opacity:0.5}&:hover{box-shadow:0 4px 12px rgba(0,0,0,0.15)}@media screen and (max-width:768px){body{font-size:14px}}
```

## Supported CSS Features

Pretty Tiny handles all modern CSS features:

-   **Nested rules** - `&:hover`, `&.active`
-   **Media queries** - `@media`, `@supports`
-   **Keyframes** - `@keyframes`, including nested in `@media`
-   **Pseudo-classes** - `:hover`, `:focus`, `:has()`, `:not()`, `:is()`
-   **Pseudo-elements** - `::before`, `::after`
-   **Complex selectors** - attribute selectors, combinators
-   **CSS variables** - `var(--custom-property)`
-   **CSS functions** - `calc()`, `clamp()`, `rgba()`, `linear-gradient()`
-   **Comments** - Preserved in Pretty mode, optional in Mini mode

## Workflow Examples

### Development Workflow

1. Open your CSS file
2. Click the status bar indicator → Select **Pretty Mode**
3. Your CSS is automatically formatted on every save
4. Work with clean, readable code

### Production Workflow

1. Finished with development
2. Use `Ctrl+Alt+M` (macOS: `Ctrl+Cmd+M`) to toggle to Mini mode
3. Your CSS is now optimized for production
4. Deploy the minified file

### Quick Formatting

1. Select a block of CSS
2. Press `Ctrl+Alt+M` (macOS: `Ctrl+Cmd+M`)
3. Only the selected CSS is formatted

## Known Limitations

-   Designed for CSS only (not SCSS, LESS, or other preprocessors)
-   Does not validate CSS syntax
-   Cannot recover from malformed CSS

## License

MIT

## Feedback & Issues

Found a bug or have a suggestion? Please report it on [GitHub](https://github.com/jimjimca/pretty-tiny/issues)

---

**Made with love for the CSS community**

Enjoy coding with Pretty Tiny!
