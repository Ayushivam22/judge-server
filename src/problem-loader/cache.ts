import { promises as fs } from "fs";
import {
    getDriverPath,
    getExpectedOutputPath,
    getProblemCacheDir,
    getTestcasePath
} from "./types.js";

export async function exists(path: string): Promise<boolean> {
    try {
        await fs.access(path);
        return true;
    } catch {
        return false;
    }
}

export async function cacheExists(problemId: string) {
    return (
        await exists(getDriverPath(problemId)) &&
        await exists(getTestcasePath(problemId)) &&
        await exists(getExpectedOutputPath(problemId))
    );
}

export async function createCache(problemId: string) {
    await fs.mkdir(
        getProblemCacheDir(problemId),
        { recursive: true }
    );
}