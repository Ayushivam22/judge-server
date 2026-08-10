import { execInContainer } from "../container/docker.js";
import {
  ExecutionStatus,
  type ExecutionResult,
} from "./types.js";

export async function execute(
  containerId: string,
  inputFile: string
): Promise<ExecutionResult> {
  const result = await execInContainer(
    containerId,
    ["./main"],
    {
      stdinFile: inputFile,
    }
  );

  return {
    status:
      result.exitCode === 0
        ? ExecutionStatus.SUCCESS
        : ExecutionStatus.RUNTIME_ERROR,

    stdout: result.stdout,
    stderr: result.stderr,

    exitCode: result.exitCode,
    durationMs: result.durationMs,
  };
}