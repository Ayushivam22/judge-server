import {
    Language,
    Verdict,
    ExecutionStatus,
} from "../types.js";


export interface Submission {
    id: string;
    problemId: string;
    language: Language;
    sourceCode: string;
}


export interface JudgeResult {
    verdict: Verdict;

    executionTimeMs?: number;

    compileOutput?: string;

    runtimeOutput?: string;
}