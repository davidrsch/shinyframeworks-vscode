# Shinyframeworks - VS Code Extension

Shiny Frameworks is an extension designed to enhance your development workflow with [Shiny](https://shiny.posit.co), providing streamlined tools to simplify common tasks across a variety of Shiny frameworks. Currently supported frameworks are:

- R:
  1. shiny
  2. rhino
  3. golem
  4. teal

## Features

- Select Framework: Quickly choose from a list of supported Shiny frameworks to tailor your workflow to the specific tools and features of your project.
- Create App: Instantly generate a new app structure based on the selected framework, making it easier to start building your Shiny application without worrying about setup.
- Create Module: Effortlessly create modular components within your Shiny app, using the best practices and conventions of your chosen framework.
- Run Addins: Seamlessly access and execute addins specific to the selected framework, directly from VS Code, to streamline your development process.
- Status bar: See the active framework/language and click to switch.
- Open Framework JSON: Quickly open the current framework preset file in the editor.

## How it works

- Path token substitution

  - In each framework JSON, code snippets may contain the token `path`.
  - When you run Create App/Module/Addin from the Explorer context menu, `path` is replaced with the relative path to the clicked file or folder (from the workspace root), and wrapped in quotes.

- Interpreter resolution

  - R: Prefers Positron's runtime if available; otherwise uses the VS Code R extension setting `r.rpath`, then PATH lookup, then Windows registry.
  - Python: Uses the active interpreter from the Python extension API.

- Addin directory modes
  - `root`: Run at the workspace root.
  - `current`: Run in the clicked folder (or the parent folder when you clicked a file).
  - `file`: Pass the clicked file path.
  - `goto`: Open a target file in the editor instead of running code.

### Teal preset

The `teal` preset scaffolds a minimal `app.R` using the `teal` package. You can then run it with the "Run app (current dir)" addin from the folder where `app.R` was created.

<!--## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.-->

## Extension Settings

This extension contributes the following settings:

- `shinyframeworks.framework.defaultLanguage`:
  This setting determines the default programming language (e.g., R or Python) to be used for your Shiny framework-based projects within the workspace. When you select a framework using the Select Framework command, this setting is automatically updated to reflect the language associated with the chosen framework. This ensures that any new apps or modules you create are set up with the appropriate language without needing manual configuration.
- `shinyframeworks.framework.defaultFramework`:
  This setting defines the default Shiny framework to be used in the current workspace. When you use the Select Framework command to choose a framework, this setting is automatically updated to reflect the selected framework. This ensures that new apps, modules, and related addins are tailored to the specific framework, streamlining your development process.

<!-- ## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.-->

## Release Notes

### 0.0.7

- CI: Deterministic VSIX name (shinyframeworks.vsix) and publish steps updated

### 0.0.6

- CI: Fix publish jobs not finding VSIX artifact by downloading to workspace root

### 0.0.5

- Documentation updates in README
- Prepare release for CI tag-based publish

### 0.0.4

- Status bar item showing current framework/language with quick switch
- New command: Open Framework JSON to open the active framework preset
- Implement real teal preset (scaffold app.R, addins to open/run app)
- Fix addin "current" directory handling; expose helpers for testing
- Add basic tests for framework discovery, path substitution, and addin modes
- Improve GitHub Actions to publish from built VSIX and verify tag version
- Manifest/Settings cleanup and README "How it works" section

### 0.0.3

Updating build system and adding **golem** framework

### 0.0.2

Fixing some bugs detected in initial release

### 0.0.1

Initial release of shinyframeworks

---

## Releasing (maintainers)

This repo publishes on annotated tags only.

1. Bump version in `package.json` and update `CHANGELOG.md`.
2. Commit and push to `main`.
3. Create and push an annotated tag matching the version with a `v` prefix, e.g. `v0.0.5`.

- The CI verifies that the tag matches `package.json`.

4. The workflow builds the VSIX once and publishes to both registries from the artifact.

Requirements:

- GitHub Actions secrets: `OPEN_VSX_TOKEN`, `VSCE_PAT`.
- Workflow uses Node 20.18.1 and `@vscode/vsce` pinned locally.
