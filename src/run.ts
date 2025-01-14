import { PythonExtension } from "@vscode/python-extension";
import * as vscode from "vscode";
import { join as path_join, dirname as path_dirname } from "path";
import * as fs from "fs";
import * as winreg from "winreg";
import { getPositronPreferredRuntime } from "./extension-api-utils/extensionHost";

/**
 * Gets the currently selected Python interpreter, according to the Python extension.
 * @returns A path, or false if no interpreter is selected.
 */
export async function getSelectedPythonInterpreter(): Promise<string | false> {
  // Gather details of the current Python interpreter. We want to make sure
  // only to re-use a terminal if it's using the same interpreter.
  const pythonAPI: PythonExtension = await PythonExtension.api();

  // The getActiveEnvironmentPath docstring says: "Note that this can be an
  // invalid environment, use resolveEnvironment to get full details."
  const unresolvedEnv = pythonAPI.environments.getActiveEnvironmentPath(
    vscode.window.activeTextEditor?.document.uri
  );
  const resolvedEnv =
    await pythonAPI.environments.resolveEnvironment(unresolvedEnv);
  if (!resolvedEnv) {
    vscode.window.showErrorMessage(
      "Unable to find Python interpreter. " +
        'Please use the "Python: Select Interpreter" command, and try again.'
    );
    return false;
  }

  return resolvedEnv.path;
}

export async function getRBinPath(bin: string): Promise<string> {
  return (
    (await getRPathFromPositron(bin)) ||
    getRPathFromConfig(bin) ||
    getRPathFromEnv(bin) ||
    (await getRPathFromWindowsReg(bin)) ||
    ""
  );
}

async function getRPathFromPositron(bin: string): Promise<string> {
  const runtimeMetadata = await getPositronPreferredRuntime("r");
  if (!runtimeMetadata) {
    return "";
  }

  console.log(
    `[shinyframeworks] runtimeMetadata: ${JSON.stringify(runtimeMetadata)}`
  );

  const runtimePath = runtimeMetadata.runtimePath;
  if (!runtimePath) {
    return "";
  }

  const { platform } = process;
  const fileExt = platform === "win32" ? ".exe" : "";
  return path_join(path_dirname(runtimePath), bin + fileExt);
}

function getRPathFromConfig(bin: string): string {
  const { platform } = process;
  const fileExt = platform === "win32" ? ".exe" : "";
  let osType: string;

  switch (platform) {
    case "win32":
      osType = "windows";
      break;
    case "darwin":
      osType = "mac";
      break;
    default:
      osType = "linux";
  }

  const rPath = vscode.workspace
    .getConfiguration("r.rpath")
    .get(osType, undefined);

  console.log(`[shinyframeworks] rPath: ${rPath}`);

  return rPath ? path_join(path_dirname(rPath), bin + fileExt) : "";
}

function getRPathFromEnv(bin: string = "R"): string {
  const { platform } = process;
  const splitChr = platform === "win32" ? ";" : ":";
  const fileExt = platform === "win32" ? ".exe" : "";

  if (!process.env.PATH) {
    return "";
  }

  for (const envPath of process.env.PATH.split(splitChr)) {
    const rBinPath = path_join(envPath, bin + fileExt);
    if (fs.existsSync(rBinPath)) {
      return rBinPath;
    }
  }

  return "";
}

async function getRPathFromWindowsReg(bin: string = "R"): Promise<string> {
  if (process.platform !== "win32") {
    return "";
  }

  let rPath = "";

  try {
    const key = new winreg({
      hive: winreg.HKLM,
      key: "\\Software\\R-Core\\R",
    });
    const item: winreg.RegistryItem = await new Promise((c, e) =>
      key.get("InstallPath", (err, result) =>
        err === null ? c(result) : e(err)
      )
    );
    rPath = path_join(item.value, "bin", bin + ".exe");
    rPath = fs.existsSync(rPath) ? rPath : "";
  } catch (e) {
    rPath = "";
  }

  return rPath;
}
