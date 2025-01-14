import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";
import { getFrameworks } from "./framework-settings";
import { getSelectedPythonInterpreter, getRBinPath } from "./run";

export async function selectFramework() {
  const availableFrameworks = await getFrameworks();
  const groupedFrameworks: { [language: string]: string[] } =
    availableFrameworks.reduce(
      (acc, { language, name }) => {
        if (!acc[language]) {
          acc[language] = [];
        }
        acc[language].push(name);
        return acc;
      },
      {} as { [language: string]: string[] }
    );

  const config = vscode.workspace.getConfiguration("shinyframeworks");
  const currentFramework =
    config.get<string>("framework.defaultFramework") || "";
  const currentLanguage = config.get<string>("framework.defaultLanguage") || "";

  const frameworkOptions: vscode.QuickPickItem[] = Object.entries(
    groupedFrameworks
  ).flatMap(([language, frameworks]) => {
    return [
      {
        label: language.toLowerCase(),
        kind: vscode.QuickPickItemKind.Separator,
      },
      ...frameworks.map((framework) => ({
        label:
          framework === currentFramework && language === currentLanguage
            ? `✓ ${framework}`
            : framework,
        description: language,
      })),
    ];
  });

  const selected = await vscode.window.showQuickPick(frameworkOptions, {
    placeHolder: "Select a framework",
  });

  if (selected) {
    const frameworkName = selected.label.replace("✓ ", "");
    const language = selected.description;

    if (frameworkName && language) {
      // Save settings to the current workspace instead of global
      await config.update(
        "framework.defaultLanguage",
        language,
        vscode.ConfigurationTarget.Workspace
      );
      await config.update(
        "framework.defaultFramework",
        frameworkName,
        vscode.ConfigurationTarget.Workspace
      );
      vscode.window.showInformationMessage(
        `Selected framework: ${frameworkName} (${language})`
      );
    }
  }
}

interface FrameworkConfig {
  name: string;
  language: string;
  app: {
    code: string[];
  };
  module: {
    code: string[] | null;
    file: {
      filename: string;
      content: string[];
    };
  };
  addins: {
    name: string;
    code: string[];
    directory?: string; // Optional because some addins may not have a directory
  }[];
}

interface FrameworkConfigResult {
  frameworkConfig: FrameworkConfig;
  currentLanguage: string;
}

// Function to load framework configuration
async function loadFrameworkConfig(): Promise<FrameworkConfigResult | null> {
  const config = vscode.workspace.getConfiguration("shinyframeworks");
  const currentFramework = config.get<string>("framework.defaultFramework");
  const currentLanguage = config.get<string>("framework.defaultLanguage");

  // Log configuration to verify settings
  console.log(`Current Framework: ${currentFramework}`);
  console.log(`Current Language: ${currentLanguage}`);

  if (!currentFramework || !currentLanguage) {
    vscode.window.showErrorMessage("No framework or language selected.");
    return null;
  }

  const frameworkFilePath = path.join(
    vscode.extensions.getExtension("davidrsch.shinyframeworks")!.extensionPath,
    "frameworks",
    `${currentFramework}-${currentLanguage}.json`
  );

  try {
    const frameworkData = await fs.readFile(frameworkFilePath, "utf-8");
    const parsedData: FrameworkConfig = JSON.parse(frameworkData);
    return { frameworkConfig: parsedData, currentLanguage };
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error loading framework configuration: ${error instanceof Error ? error.message : error}`
    );
    return null;
  }
}

// Helper function to get the correct interpreter based on language
async function getInterpreter(language: string): Promise<string | null> {
  let interpreterPath: string | null = null;

  if (language.toLowerCase() === "python") {
    // Fetch the Python interpreter using the Python extension API
    const pythonPath = await getSelectedPythonInterpreter();
    if (pythonPath) {
      interpreterPath = `"${pythonPath}"`;
    } else {
      vscode.window.showErrorMessage(
        "Python interpreter not configured or found. Please set it up and try again."
      );
    }
  } else if (language.toLowerCase() === "r") {
    // Use getRBinPath to find the R interpreter path
    const rPath = await getRBinPath("Rscript");
    if (rPath) {
      interpreterPath = `"${rPath}"`;
    } else {
      vscode.window.showErrorMessage(
        "R interpreter not configured or found. Please set it up and try again."
      );
    }
  }

  if (!interpreterPath) {
    console.warn(`Interpreter for language "${language}" could not be found.`);
  }
  return interpreterPath;
}

async function runCommandInTerminal(
  interpreterPath: string,
  command: string,
  cwd: string
): Promise<void> {
  const terminalName = "Shiny Frameworks Terminal";

  // Close any existing terminal with the same name
  vscode.window.terminals.forEach((terminal) => {
    if (terminal.name === terminalName) {
      terminal.dispose();
    }
  });

  // Prepend interpreter path to the command
  const fullCommand = `& ${interpreterPath} -e ${command}`;

  // Add success/failure message handling
  const terminalCommand =
    process.platform === "win32"
      ? `${fullCommand}; if ($?) { Write-Output 'Execution succeeded.'; exit } else { Write-Output 'Execution failed.' }`
      : `${fullCommand} && echo 'Execution succeeded.' && exit || echo 'Execution failed.'`;

  // Create and show a new terminal
  const terminal = vscode.window.createTerminal({ name: terminalName, cwd });
  terminal.show();
  terminal.sendText(terminalCommand);
}

// Helper function to get command with relative path and set target directory
async function prepareCommandWithRelativePath(
  uri: vscode.Uri,
  commandLines: string[]
): Promise<{ command: string; targetPath: string } | null> {
  // Determine the workspace root path
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage("Workspace root could not be determined.");
    return null;
  }

  // Compute the relative path from the workspace root to the selected file or folder
  const selectedPath = uri.fsPath;
  let relativePath = path.relative(workspaceRoot, selectedPath);
  if (!relativePath) {
    relativePath = ".";
  }
  // Replace backslashes with forward slashes for cross-platform compatibility
  relativePath = relativePath.replace(/\\/g, "/");

  // Join the command lines into a single string, replacing 'path' with the relative path
  const command = commandLines
    .map((line: string) => line.replace("path", `\\"${relativePath}\\"`))
    .join("");

  // Set the target path to the workspace root directory
  const targetPath = workspaceRoot;

  return { command, targetPath };
}

// Function to create an application
export async function createApp(uri: vscode.Uri) {
  const frameworkData = await loadFrameworkConfig();
  if (!frameworkData || !frameworkData.frameworkConfig.app) {
    vscode.window.showErrorMessage("App configuration not found.");
    return;
  }

  const appConfig = frameworkData.frameworkConfig.app;
  if (!appConfig.code) {
    vscode.window.showErrorMessage("App code not found.");
    return;
  }

  // Determine if the URI is a file, then get the parent directory if needed
  const uriPath = (await fs.stat(uri.fsPath)).isDirectory()
    ? uri
    : vscode.Uri.file(path.dirname(uri.fsPath));

  const result = await prepareCommandWithRelativePath(uriPath, appConfig.code);
  if (!result) {
    return;
  }

  // Get interpreter path for the language
  const interpreterPath = await getInterpreter(frameworkData.currentLanguage);
  if (!interpreterPath) {
    vscode.window.showErrorMessage(
      `Interpreter for language "${frameworkData.currentLanguage}" is not configured.`
    );
    return;
  }

  // Execute the command in the terminal
  await runCommandInTerminal(
    interpreterPath,
    result.command,
    result.targetPath
  );
}

//Function to create Module
export async function createModule(uri: vscode.Uri) {
  const frameworkData = await loadFrameworkConfig();
  if (!frameworkData || !frameworkData.frameworkConfig.module) {
    vscode.window.showErrorMessage("Module configuration not found.");
    return;
  }

  const moduleConfig = frameworkData.frameworkConfig.module;

  // Determine if the URI is a file, then get the parent directory if needed
  const uriPath = (await fs.stat(uri.fsPath)).isDirectory()
    ? uri
    : vscode.Uri.file(path.dirname(uri.fsPath));

  // Case 1: Execute code command if provided
  if (moduleConfig.code) {
    const result = await prepareCommandWithRelativePath(
      uriPath,
      moduleConfig.code
    );
    if (!result) {
      return;
    }

    // Get interpreter path for the language
    const interpreterPath = await getInterpreter(frameworkData.currentLanguage);
    if (!interpreterPath) {
      vscode.window.showErrorMessage(
        `Interpreter for language "${frameworkData.currentLanguage}" is not configured.`
      );
      return;
    }

    // Execute the command in the terminal
    await runCommandInTerminal(
      interpreterPath,
      result.command,
      result.targetPath
    );

    // Case 2: Create file if file configuration is provided
  } else if (moduleConfig.file) {
    // Ensure the file is created in the directory represented by `uri`
    const targetDirectory = (await fs.stat(uri.fsPath)).isDirectory()
      ? uri.fsPath
      : path.dirname(uri.fsPath);
    const filePath = path.join(targetDirectory, moduleConfig.file.filename);
    const fileContent = moduleConfig.file.content.join("\n");

    try {
      await fs.writeFile(filePath, fileContent, "utf-8");
      vscode.window.showInformationMessage(
        `Module file created successfully at ${filePath}.`
      );
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error creating module file: ${error instanceof Error ? error.message : error}`
      );
    }
  } else {
    vscode.window.showErrorMessage(
      "No code or file specified in module configuration."
    );
  }
}

export async function runAddin(uri: vscode.Uri) {
  const frameworkData = await loadFrameworkConfig();
  if (!frameworkData || !frameworkData.frameworkConfig.addins) {
    vscode.window.showErrorMessage("Add-ins configuration not found.");
    return;
  }

  const addins = frameworkData.frameworkConfig.addins;
  const addinNames = addins.map((addin: { name: string }) => addin.name);
  const selectedAddinName = await vscode.window.showQuickPick(addinNames, {
    placeHolder: "Select an add-in to run",
  });

  if (!selectedAddinName) {
    return;
  }

  const selectedAddin = addins.find(
    (addin: { name: string }) => addin.name === selectedAddinName
  );
  if (!selectedAddin) {
    vscode.window.showErrorMessage("Selected add-in configuration not found.");
    return;
  }

  let command: string | string[] | undefined;
  let uriToPass: vscode.Uri;

  // Get the workspace root path
  const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (!workspaceRoot) {
    vscode.window.showErrorMessage("Workspace root could not be determined.");
    return;
  }

  // Determine the correct uriToPass based on the directory setting in the addin
  if (selectedAddin.directory === "file") {
    // Use the path to the right-clicked file for uriToPass
    uriToPass = vscode.Uri.file(uri.fsPath);
    command = selectedAddin.code;
  } else if (selectedAddin.directory === "current") {
    // Use the path to the right-clicked folder (current) for uriToPass
    uriToPass = vscode.Uri.file(path.dirname(uri.fsPath));
    command = selectedAddin.code;
  } else if (selectedAddin.directory === "root") {
    // Use the workspace root for uriToPass
    uriToPass = uriToPass =
      vscode.workspace.workspaceFolders?.[0]?.uri || vscode.Uri.file("");
    command = selectedAddin.code;
  } else {
    vscode.window.showErrorMessage(
      "Invalid directory setting in add-in configuration."
    );
    return;
  }

  // Ensure command is an array of strings before passing to prepareCommandWithRelativePath
  if (typeof command === "string") {
    command = [command]; // Convert string to an array if necessary
  }

  if (!command || !uriToPass) {
    vscode.window.showErrorMessage(
      "Target directory or command could not be determined."
    );
    return;
  }

  // Use the prepareCommandWithRelativePath to process the command and paths
  const result = await prepareCommandWithRelativePath(uriToPass, command);
  if (!result) {
    return;
  }

  // Get interpreter path for the language
  const interpreterPath = await getInterpreter(frameworkData.currentLanguage);
  if (!interpreterPath) {
    vscode.window.showErrorMessage(
      `Interpreter for language "${frameworkData.currentLanguage}" is not configured.`
    );
    return;
  }

  // Execute the command in the terminal
  await runCommandInTerminal(interpreterPath, result.command, workspaceRoot);
}
