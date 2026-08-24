import path from "path";

export const CACHE_ROOT = path.resolve(process.cwd(), "tmp", "problem-cache");

export interface ProblemAssets {
    problemId: string;
    driverPath: string;
    testcasePath: string;
    expectedOutputPath: string;
}

export interface StorageProvider {
    downloadDriver(
        problemId: string,
        destination: string
    ): Promise<void>;

    downloadTestcases(
        problemId: string,
        destination: string
    ): Promise<void>;

    downloadExpectedOutput(
        problemId: string,
        destination: string
    ): Promise<void>;
}

export function getProblemCacheDir(problemId: string) {
    return path.resolve(CACHE_ROOT, problemId);
}

export function getDriverPath(problemId: string) {
    return path.resolve(getProblemCacheDir(problemId), "main.cpp");
}

export function getTestcasePath(problemId: string) {
    return path.resolve(getProblemCacheDir(problemId), "testcases.txt");
}

export function getExpectedOutputPath(problemId: string) {
    return path.resolve(getProblemCacheDir(problemId), "output.txt");
}