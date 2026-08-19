// =========================
// Language
// =========================

export enum Language {
  CPP = "cpp",
  JAVA = "java",
  PYTHON = "python",
}

// =========================
// Verdict
// =========================

export enum Verdict {
  ACCEPTED = "ACCEPTED",
  WRONG_ANSWER = "WRONG_ANSWER",
  COMPILATION_ERROR = "COMPILATION_ERROR",
  RUNTIME_ERROR = "RUNTIME_ERROR",
  TIME_LIMIT_EXCEEDED = "TIME_LIMIT_EXCEEDED",
  MEMORY_LIMIT_EXCEEDED = "MEMORY_LIMIT_EXCEEDED",
  INTERNAL_ERROR = "INTERNAL_ERROR",
}

// =========================
// Submission
// =========================

export interface Submission {
  id: string;

  problemId: string;

  language: Language;

  sourceCode: string;

  timeLimitMs: number;

  memoryLimitMb: number;
}

// =========================
// Workspace
// =========================

export interface Workspace {
  id: string;

  path: string;
}

// =========================
// Problem Assets
// =========================

// export interface ProblemAssets {
//   driverPath: string;

//   testcasePath: string;
// }

// // =========================
// // Compile Result
// // =========================

// export interface CompileResult {
//   success: boolean;

//   executable?: string;

//   stdout: string;

//   stderr: string;

//   compileTimeMs: number;
// }

// // =========================
// // Execution Result
// // =========================

// export interface ExecutionResult {
//   exitCode: number;
//   signal?: NodeJS.Signals;

//   timedOut: boolean;

//   executionTimeMs: number;

//   memoryUsedMb: number;

//   stdout: string;

//   stderr: string;
// }

// // =========================
// // Final Judge Result
// // =========================

// export interface JudgeResult {
//   verdict: Verdict;

//   executionTimeMs?: number;

//   memoryUsedMb?: number;

//   compileError?: string;

//   runtimeError?: string;
// }

// export interface Container {
//   id: string;
// }