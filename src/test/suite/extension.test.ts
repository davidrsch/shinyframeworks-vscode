import * as assert from "assert";
import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs/promises";

import { getFrameworks } from "../../framework-settings";
import { prepareCommandWithRelativePath } from "../../explorer-actions";
import { resolveAddinTargetPath } from "../../explorer-actions";

suite("Shinyframeworks basic tests", () => {
  test("getFrameworks discovers R frameworks from filenames", async () => {
    const frameworks = await getFrameworks();
    const names = new Set(frameworks.map((f) => f.name));
    const languages = new Set(frameworks.map((f) => f.language));

    assert.ok(names.has("shiny"), "Expected to find shiny framework");
    assert.ok(names.has("rhino"), "Expected to find rhino framework");
    assert.ok(names.has("golem"), "Expected to find golem framework");

    assert.ok(languages.has("r"), "Expected to see language r");
  });

  test("prepareCommandWithRelativePath substitutes path token with relative path", async () => {
    // Ensure we have a workspace folder from the test launcher
    const root = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(root, "Workspace root not set for tests");

    const nestedDir = path.join(root!, "a", "b");
    await fs.mkdir(nestedDir, { recursive: true });

    const uri = vscode.Uri.file(nestedDir);

    const cmdLines = ["'print(path)'"];
    const result = await prepareCommandWithRelativePath(uri, cmdLines);
    assert.ok(result, "Expected a command result");

    // Relative path should be a/b (forward slashes) wrapped in escaped quotes
    const expectedRel = "a/b";
    assert.ok(result!.command.includes(expectedRel), "Relative path missing");
    assert.ok(
      result!.command.includes('\\"'),
      "Expected escaped quote markers in command"
    );
  });

  test("resolveAddinTargetPath handles file/current/root/goto correctly", () => {
    const rootMaybe = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    assert.ok(rootMaybe, "Workspace root not set for tests");
    const root = rootMaybe as string;
    const clickedFile = path.join(root, "dir", "file.R");
    const clickedDir = path.join(root, "dir");

    // file mode returns the clicked file path
    assert.strictEqual(
      resolveAddinTargetPath("file", clickedFile, root, false),
      clickedFile
    );

    // current mode: for a file, returns its folder
    assert.strictEqual(
      resolveAddinTargetPath("current", clickedFile, root, false),
      path.dirname(clickedFile)
    );

    // current mode: for a directory, returns the directory itself
    assert.strictEqual(
      resolveAddinTargetPath("current", clickedDir, root, true),
      clickedDir
    );

    // root mode: returns workspace root
    assert.strictEqual(
      resolveAddinTargetPath("root", clickedDir, root, true),
      root
    );

    // goto mode: returns null (handled by caller)
    assert.strictEqual(
      resolveAddinTargetPath("goto", clickedDir, root, true),
      null
    );
  });
});
