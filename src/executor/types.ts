export enum ExecutionStatus {
  SUCCESS,
  RUNTIME_ERROR,
  TIME_LIMIT_EXCEEDED,
}

export interface ExecuteOptions {
  stdin?: string;
  timeoutMs?: number;
}

export interface ExecutionResult {
  status: ExecutionStatus;

  stdout: string;
  stderr: string;

  exitCode: number;
  durationMs: number;
}