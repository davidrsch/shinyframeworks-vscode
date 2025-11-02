# Change Log

## 0.0.7

- CI: Deterministic VSIX name (shinyframeworks.vsix) and publish steps updated

## 0.0.6

- CI: Fix publish jobs not finding VSIX artifact by downloading to workspace root

## 0.0.5

- Documentation updates in README
- Prepare release for CI tag-based publish (no functional code changes)

## 0.0.4

- Add status bar item showing current framework/language with quick switch
- New command: `Open Framework JSON` to open the active framework preset
- Implement real `teal` preset (scaffold app.R, addins to open/run app)
- Fix addin "current" directory handling; expose helpers for testing
- Add basic tests for framework discovery, path substitution, and addin modes
- Improve GitHub Actions to publish from built VSIX and verify tag version
- Manifest/Settings cleanup and README "How it works" section

## 0.0.3

- Build system updates to make it closer to shiny-vscode
- Adding Golem Framework

## 0.0.2

- Downgrading vscode requirement to match shiny extension.
- Fixing issue with terminal targetpath.
- Adding workflow for automating pushing.

## 0.0.1

- Initial release
