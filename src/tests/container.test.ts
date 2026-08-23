import { promises as fs } from "node:fs";
import path from "node:path";

import { createWorkspace, removeWorkspace } from "../workspace/index.js";
import { createContainer } from "../container/index.js";

async function expect(
  name: string,
  fn: () => Promise<void>
) {
  process.stdout.write(`Testing ${name}... `);

  try {
    await fn();
    console.log("✅ PASS");
  } catch (err) {
    console.error("❌ FAIL");
    console.error(err);
    process.exit(1);
  }
}

async function main() {
  console.log("\n========== Container Module Tests ==========\n");

  const workspace = await createWorkspace("container-test");

  await fs.writeFile(
    path.join(workspace.path, "hello.txt"),
    "Hello Docker"
  );

  const container = await createContainer({
    workspace,
    image: "judge-cpp",
  });

  await expect("Container created", async () => {
    if (!container.id) {
      throw new Error("Container id is empty.");
    }
  });

  await expect("pwd", async () => {
    const result = await container.exec(["pwd"]);

    if (result.exitCode !== 0) {
      throw new Error(result.stderr);
    }

    if (result.stdout.trim() !== "/workspace") {
      throw new Error(
        `Expected '/workspace', got '${result.stdout.trim()}'`
      );
    }
  });

  await expect("ls", async () => {
    const result = await container.exec(["ls"]);
    console.log(result)

    if (!result.stdout.includes("hello.txt")) {
      throw new Error("Workspace not mounted correctly.");
    }
  });

  await expect("cat", async () => {
    const result = await container.exec([
      "cat",
      "hello.txt",
    ]);

    if (result.stdout.trim() !== "Hello Docker") {
      throw new Error("Incorrect file contents.");
    }
  });

  await expect("echo", async () => {
    const result = await container.exec([
      "echo",
      "Judge Running",
    ]);

    if (result.stdout.trim() !== "Judge Running") {
      throw new Error("Echo failed.");
    }
  });

  await expect("Invalid command", async () => {
    const result = await container.exec([
      "this-command-does-not-exist",
    ]);

    if (result.exitCode === 0) {
      throw new Error(
        "Expected non-zero exit code."
      );
    }
  });

  await expect("Stop container", async () => {
    await container.stop();
  });

  await expect("Remove container", async () => {
    await container.remove();
  });

  await expect("Remove already removed container", async () => {
    await container.remove();
  });

  await removeWorkspace(workspace);

  console.log("\n============================================");
  console.log("✅ All Container Module Tests Passed");
  console.log("============================================\n");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});