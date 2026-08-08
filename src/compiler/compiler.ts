import { execInContainer } from "../container/docker.js";
import type { CompileResult } from "./types.js";

export async function compile(
  containerId: string
): Promise<CompileResult> {
  const result = await execInContainer(containerId, [
    "g++",
    "main.cpp",
    "-std=c++20",
    "-O2",
    "-o",
    "main",
  ]);

  return {
    success: result.exitCode === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    durationMs: result.durationMs,
  };
}