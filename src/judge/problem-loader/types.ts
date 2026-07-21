import path from "path";

export const CACHE_ROOT = "/tmp/problem-cache";

export interface ProblemAssets {
    problemId: string;
    driverPath: string;
    testcasePath: string;
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
}

export function getProblemCacheDir(problemId: string) {
    return path.join(CACHE_ROOT, problemId);
}

export function getDriverPath(problemId: string) {
    return path.join(getProblemCacheDir(problemId), "main.cpp");
}

export function getTestcasePath(problemId: string) {
    return path.join(getProblemCacheDir(problemId), "testcases.txt");
}