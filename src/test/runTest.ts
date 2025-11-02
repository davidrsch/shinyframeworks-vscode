import * as path from "path";
import * as os from "os";
import * as fs from "fs";
import { mkdtempSync } from "fs";
import { runTests } from "@vscode/test-electron";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../");

    // The path to test runner
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./suite/index");

    // Create a temporary workspace folder for tests that need a workspace root
    const tmpRoot = mkdtempSync(
      path.join(os.tmpdir(), "shinyframeworks-test-")
    );
    if (!fs.existsSync(tmpRoot)) {
      fs.mkdirSync(tmpRoot, { recursive: true });
    }

    // Download VS Code, unzip it and run the integration test
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      launchArgs: [tmpRoot, "--disable-extensions"],
    });
  } catch (err) {
    console.error("Failed to run tests");
    process.exit(1);
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
main();
