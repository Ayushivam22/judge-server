import type { Workspace } from "../workspace/types.js";
import { execInContainer } from "../container/docker.js";

import type { CompileResult } from "./types.js";

export async function compileCpp(
  workspace: Workspace,
  containerId: string
): Promise<CompileResult> {
  const executable = "main";

  const result = await execInContainer(containerId, [
    "g++",
    "main.cpp",
    "-O2",
    "-std=c++20",
    "-o",
    executable,
  ]);

  return {
    success: result.exitCode === 0,
    executablePath: result.exitCode === 0 ? executable : undefined,
    stdout: result.stdout,
    stderr: result.stderr,
    durationMs: result.durationMs,
  };
}