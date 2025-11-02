import * as path from "path";
import Mocha from "mocha";
import { glob } from "glob";

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: "tdd", color: true, timeout: 20000 });
  const testsRoot = path.resolve(__dirname, ".");

  const files: string[] = await glob("**/**.test.js", { cwd: testsRoot });
  files.forEach((f: string) => mocha.addFile(path.resolve(testsRoot, f)));

  return new Promise((c, e) => {
    try {
      mocha.run((failures: number) => {
        if (failures > 0) {
          e(new Error(`${failures} tests failed.`));
        } else {
          c();
        }
      });
    } catch (err) {
      e(err);
    }
  });
}
