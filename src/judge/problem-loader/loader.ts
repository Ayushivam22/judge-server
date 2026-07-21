import {
    getDriverPath,
    getTestcasePath
} from "./types.js";

import {
    cacheExists,
    createCache
} from "./cache.js";

import { localStorage } from "./local-storage.js";

export async function loadProblem(problemId: string) {

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
            )
        ]);
    }

    return {
        problemId,
        driverPath: getDriverPath(problemId),
        testcasePath: getTestcasePath(problemId)
    };
}