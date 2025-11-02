import * as vscode from "vscode";
import { updateSettings } from "./framework-settings";
import {
  selectFramework,
  createApp,
  createModule,
  runAddin,
} from "./explorer-actions";
import * as path from "path";
import * as fs from "fs/promises";

export function activate(context: vscode.ExtensionContext) {
  updateSettings();

  // Status bar item showing current framework/language
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Left,
    100
  );
  statusBar.command = "shinyframeworks.selectFramework";
  context.subscriptions.push(statusBar);

  const refreshStatusBar = () => {
    const config = vscode.workspace.getConfiguration("shinyframeworks");
    const framework = config.get<string>("framework.defaultFramework") || "";
    const language = config.get<string>("framework.defaultLanguage") || "";
    if (framework && language) {
      statusBar.text = `$(settings-gear) Shiny: ${framework} (${language})`;
      statusBar.tooltip =
        "Click to select Shiny framework and language for this workspace";
      statusBar.show();
    } else {
      statusBar.text = "$(settings-gear) Shiny: configure";
      statusBar.show();
    }
  };

  refreshStatusBar();

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration(
          "shinyframeworks.framework.defaultLanguage"
        ) ||
        event.affectsConfiguration("shinyframeworks.framework.defaultFramework")
      ) {
        updateSettings();
        refreshStatusBar();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "shinyframeworks.selectFramework",
      async () => {
        await selectFramework();
        refreshStatusBar();
      }
    ),
    vscode.commands.registerCommand(
      "shinyframeworks.createModule",
      createModule
    ),
    vscode.commands.registerCommand("shinyframeworks.createApp", createApp),
    vscode.commands.registerCommand("shinyframeworks.Addins", runAddin),
    vscode.commands.registerCommand(
      "shinyframeworks.openFrameworkConfig",
      async () => {
        const config = vscode.workspace.getConfiguration("shinyframeworks");
        const currentFramework = config.get<string>(
          "framework.defaultFramework"
        );
        const currentLanguage = config.get<string>("framework.defaultLanguage");
        if (!currentFramework || !currentLanguage) {
          vscode.window.showErrorMessage("No framework or language selected.");
          return;
        }
        const frameworkFilePath = path.join(
          vscode.extensions.getExtension("davidrsch.shinyframeworks")!
            .extensionPath,
          "frameworks",
          `${currentFramework}-${currentLanguage}.json`
        );
        try {
          await fs.access(frameworkFilePath);
          const doc = await vscode.workspace.openTextDocument(
            vscode.Uri.file(frameworkFilePath)
          );
          await vscode.window.showTextDocument(doc, { preview: false });
        } catch (e) {
          vscode.window.showErrorMessage(
            `Framework JSON not found: ${frameworkFilePath}`
          );
        }
      }
    )
  );
}

export function deactivate() {}
