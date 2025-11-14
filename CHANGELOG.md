# Change Log

All notable changes to the "Pretty Tiny" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2025-11-14

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

[Unreleased]: https://github.com/jimmyhoule/pretty-tiny/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/jimmyhoule/pretty-tiny/releases/tag/v1.0.2
[1.0.1]: https://github.com/jimmyhoule/pretty-tiny/releases/tag/v1.0.1
[1.0.0]: https://github.com/jimmyhoule/pretty-tiny/releases/tag/v1.0.0