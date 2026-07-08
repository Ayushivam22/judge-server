import { promises as fs } from "fs";
import path from "path";
// import { fileURLToPath } from "url";

import type { ProblemAssets, Workspace } from "./types.js";

const ROOT_WORKSPACE = "/tmp/judge";

/**
 * Creates an empty workspace for a submission.
 */
export async function createWorkspace(
  submissionId: string
): Promise<Workspace> {
  const workspacePath = path.join(ROOT_WORKSPACE, submissionId);

  await fs.mkdir(workspacePath, {
    recursive: true,
  });

  return {
    id: submissionId,
    path: workspacePath,
  };
}

/**
 * Copies problem assets and writes the user's solution.
 */
export async function populateWorkspace(
  workspace: Workspace,
  assets: ProblemAssets,
  sourceCode: string
): Promise<void> {
  const userCodePath = path.join(
    workspace.path,
    "code.cpp"
  );

  const driverPath = path.join(
    workspace.path,
    "main.cpp"
  );
  console.log("driver:",driverPath)

  const testcasePath = path.join(
    workspace.path,
    "testcases.txt"
  );

  await fs.writeFile(userCodePath, sourceCode);

  await fs.copyFile(
    assets.driverPath,
    driverPath
  );

  await fs.copyFile(
    assets.testcasePath,
    testcasePath
  );
}

/**
 * Deletes the workspace recursively.
 */
export async function deleteWorkspace(
  workspace: Workspace
): Promise<void> {
  await fs.rm(workspace.path, {
    recursive: true,
    force: true,
  });
}