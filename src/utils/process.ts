import { spawn, type SpawnOptionsWithoutStdio } from "node:child_process";

export interface ProcessResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export async function runProcess(
  command: string,
  args: string[],
  options: SpawnOptionsWithoutStdio = {}
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const start = performance.now();

    const child = spawn(command, args, {
      ...options,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      reject(err);
    });

    child.on("close", (code) => {
      resolve({
        exitCode: code ?? -1,
        stdout,
        stderr,
        durationMs: performance.now() - start,
      });
    });
  });
}