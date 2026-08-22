import {
    getDriverPath,
    getExpectedOutputPath,
    getTestcasePath
} from "./types.js";

import {
    cacheExists,
    createCache
} from "./cache.js";

import { localStorage } from "./local-storage.js";

export async function loadProblem(problemId: string) {
    const expectedOutputPath = getExpectedOutputPath(problemId);

    if (!await cacheExists(problemId)) {

        await createCache(problemId);

        await Promise.all([
            localStorage.downloadDriver(
                problemId,
                getDriverPath(problemId)
            ),
            localStorage.downloadTestcases(
                problemId,
                getTestcasePath(problemId)
            ),
            localStorage.downloadExpectedOutput(
                problemId,
                expectedOutputPath
            )
        ]);
    }

    return {
        problemId,
        driverPath: getDriverPath(problemId),
        testcasePath: getTestcasePath(problemId),
        expectedOutputPath,
    };
}