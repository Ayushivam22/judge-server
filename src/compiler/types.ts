export interface CompileResult {
  success: boolean;

  executablePath?: string | undefined;

  stdout: string;
  stderr: string;

  durationMs: number;
}