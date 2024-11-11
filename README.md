# Shinyframeworks - VS Code Extension

Shiny Frameworks is an extension designed to enhance your development workflow with [Shiny](https://shiny.posit.co), providing streamlined tools to simplify common tasks across a variety of Shiny frameworks. Currentlt suported frameworks are:
* R:
    1. shiny
    2. rhino

## Features

* Select Framework: Quickly choose from a list of supported Shiny frameworks to tailor your workflow to the specific tools and features of your project.
* Create App: Instantly generate a new app structure based on the selected framework, making it easier to start building your Shiny application without worrying about setup.
* Create Module: Effortlessly create modular components within your Shiny app, using the best practices and conventions of your chosen framework.
* Run Addins: Seamlessly access and execute addins specific to the selected framework, directly from VS Code, to streamline your development process.

<!--## Requirements

If you have any requirements or dependencies, add a section describing those and how to install and configure them.-->

## Extension Settings

This extension contributes the following settings:
* `shinyframeworks.framework.defaultLanguage`:
This setting determines the default programming language (e.g., R or Python) to be used for your Shiny framework-based projects within the workspace. When you select a framework using the Select Framework command, this setting is automatically updated to reflect the language associated with the chosen framework. This ensures that any new apps or modules you create are set up with the appropriate language without needing manual configuration.
* `shinyframeworks.framework.defaultFramework`:
This setting defines the default Shiny framework to be used in the current workspace. When you use the Select Framework command to choose a framework, this setting is automatically updated to reflect the selected framework. This ensures that new apps, modules, and related addins are tailored to the specific framework, streamlining your development process.

<!-- ## Known Issues

Calling out known issues can help limit users opening duplicate issues against your extension.-->

## Release Notes

### 0.0.1

Initial release of shinyframeworks

---
