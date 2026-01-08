# Change Log

All notable changes to the "Pretty Tiny" extension will be documented in this file.

## [1.1.4] - 2026-01-08

### Fixed
- Case sensitivity issue fixed with newly added self-closing tags

## [1.1.3] - 2026-01-07

### Added
- Added less used self-closing tags

## [1.1.2] - 2025-12-30

### Fixed
- Fixed CSS comment handling

## [1.1.1] - 2025-11-25

### Added
- HTML inside PHP files can be formatted if enabled in the configuration

### Changed
- Split default mode configuration for CSS and HTML

## [1.1.0] - 2025-11-23

### Added
- **HTML Support** - Full HTML minificatioEn and beautification
- Smart inline detection - Elements with direct text stay on one line (e.g., `<p>Text</p>`)
- Block formatting for nested structures with proper indentation
- Special tag preservation:
  - `<script>` tags with normalized JavaScript indentation
  - `<pre>` tags preserved exactly as written
  - `<textarea>` content preserved with spacing
  - `<style>` tags with automatic CSS formatting
- SVG support for both inline and block elements
- HTML5 element support (`<video>`, `<audio>`, `<details>`, `<dialog>`, etc.)
- Self-closing tag detection (HTML and SVG)
- Whitespace preservation in some cases
- Comment preservation in Pretty mode
- HTML entity support (`&nbsp;`, `&copy;`, etc.)

### Improved
- Mode indicator now shows language-specific status (CSS/HTML)
- Auto-format on save works for both CSS and HTML files
- Better handling of mixed content (text + nested tags)

### Changed
- Changed Mini mode name to Tiny mode

## [1.0.9] - 2025-11-21

### Fixed
- Fixed comment handling

### Improved
- Better performance and reliability
- Added protection for large files (>500KB)

## [1.0.8] - 2025-11-21

### Fixed
- Fixed an issue with where empty selector and comments would add `;`

## [1.0.7] - 2025-11-19

### Fixed
- Fixed selectors starting with `:` inside at-rule
- Fixed selectors starting tag name inside at-rule

## [1.0.6] - 2025-11-17

### Fixed
- Fixed selectors starting with `:` (like `::selection`, `:root`, `:where()`)
- Fixed strings in at-rules (URLs no longer broken by commas/colons)
- Added default mode setting (can default to Pretty mode)
- Modes are now remembered per file across sessions

## [1.0.5] - 2025-11-14

### Fixed
- Fixed nested selector spacing preserving original structure
- Fixed pseudo-class spacing (e.g., `&:hover`, `*:not(:hover)`)
- Fixed pseudo-element spacing (e.g., `&::after`, `div::before`)
- Selectors are now preserved exactly as written (only whitespace normalized)

## [1.0.2] - 2025-11-14

### Fixed
- Fixed `&` nested selector spacing (e.g., `& .wrap` now stays as-is instead of becoming `&.wrap`)
- Fixed pseudo-class spacing in nested selectors (e.g., `&:not(:first-child)` now formats correctly)
- Fixed spacing after opening parenthesis in selectors

## [1.0.1] - 2025-11-14

### Changed
- Updated README with clearer documentation

## [1.0.0] - 2025-11-14

### Added
- Initial release of Pretty Tiny
- CSS minification without external dependencies
- CSS beautification with configurable indentation
- Automatic toggle between Pretty and Mini modes
- Pretty mode with auto-beautify on save
- Mini mode with optional comment removal
- Normal mode for manual control only
- Mode indicator in status bar
- Keyboard shortcut (`Ctrl+Alt+M` / `Ctrl+Cmd+M`) for quick toggle
- Support for nested CSS rules (`&:hover`)
- Support for media queries and nested at-rules
- Support for keyframes and animations
- Support for modern CSS features (`:has()`, `:is()`, `:not()`, etc.)
- Configurable indentation size (default: 4 spaces)
- Configurable comment removal for minification (default: true)
- Selection support - works on selected text or entire file

### Configuration
- `prettyTiny.indentSize` - Number of spaces for indentation
- `prettyTiny.removeComments` - Remove comments when minifying
- `prettyTiny.autoBeautifyOnSave` - Auto-beautify on save in Pretty mode

[1.1.4]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.1.4
[1.1.3]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.1.3
[1.1.2]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.1.2
[1.1.1]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.1.1
[1.1.0]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.1.0
[1.0.9]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.0.9
[1.0.8]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.0.8
[1.0.7]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.0.7
[1.0.6]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.0.6
[1.0.5]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.0.5
[1.0.2]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.0.2
[1.0.1]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.0.1
[1.0.0]: https://github.com/jimjimca/pretty-tiny/releases/tag/v1.0.0