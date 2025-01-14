import * as vscode from "vscode";
import * as fs from "fs/promises";
import * as path from "path";

export async function getFrameworks(): Promise<
  { language: string; name: string }[]
> {
  const extensionId = "davidrsch.shinyframeworks";
  const extension = vscode.extensions.getExtension(extensionId);
  if (!extension) {
    vscode.window.showErrorMessage("Extension not found.");
    return [];
  }
  const frameworkFolder = path.join(extension.extensionPath, "frameworks");
  try {
    const files = await fs.readdir(frameworkFolder);
    const frameworks = files
      .map((file) => {
        const parts = file.split("-");
        if (parts.length >= 2) {
          const [name, languageExt] = parts;
          const language = languageExt.split(".")[0];
          return { name, language };
        }
        return null;
      })
      .filter(
        (item): item is { name: string; language: string } => item !== null
      ); // filter out null

    return frameworks;
  } catch (error) {
    if (error instanceof Error) {
      vscode.window.showErrorMessage(
        `Error reading frameworks: ${error.message}`
      );
    } else {
      vscode.window.showErrorMessage(
        "An unknown error occurred while reading frameworks."
      );
    }

    return [];
  }
}

function getConfigValue<T>(key: string): T | undefined {
  const config = vscode.workspace.getConfiguration("shinyframeworks");
  return config.get<T>(key);
}

export function updateSettings() {
  getFrameworks()
    .then((availableFrameworks) => {
      const config = vscode.workspace.getConfiguration("shinyframeworks");

      // Ensure the language and framework are selected uniquely
      const uniqueLanguages = Array.from(
        new Set(availableFrameworks.map((f) => f.language))
      );
      let currentLanguage =
        getConfigValue<string>("framework.defaultLanguage") || "";

      if (!uniqueLanguages.includes(currentLanguage)) {
        currentLanguage = uniqueLanguages[0];
        config.update(
          "framework.defaultLanguage",
          currentLanguage,
          vscode.ConfigurationTarget.Workspace
        );
        vscode.window.showInformationMessage(
          `Language updated to: ${currentLanguage}`
        );
      }

      // Filter frameworks based on the selected language
      const availableFrameworksForCurrentLanguage = availableFrameworks.filter(
        (f) => f.language === currentLanguage
      );

      // Ensure uniqueness of frameworks within the current language
      const uniqueFrameworks = Array.from(
        new Set(availableFrameworksForCurrentLanguage.map((f) => f.name))
      );
      let currentFramework =
        getConfigValue<string>("framework.defaultFramework") || "";

      // Select only one framework for the chosen language
      if (!uniqueFrameworks.includes(currentFramework)) {
        currentFramework = uniqueFrameworks[0];
        config.update(
          "framework.defaultFramework",
          currentFramework,
          vscode.ConfigurationTarget.Workspace
        );
        vscode.window.showInformationMessage(
          `Framework updated to: ${currentFramework}`
        );
      }
    })
    .catch((error) => {
      vscode.window.showErrorMessage(
        `Error retrieving frameworks: ${error instanceof Error ? error.message : error}`
      );
    });
}
