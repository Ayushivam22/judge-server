import {
    type EvaluationResult,
    EvaluationStatus,
} from "./types.js";

/**
 * Normalizes program output for comparison.
 *
 * Rules:
 * - Remove leading/trailing whitespace
 * - Treat spaces, tabs and newlines as equivalent
 * - Collapse consecutive whitespace into a single space
 */
function normalizeOutput(output: string): string {
    return output
        .replace(/\r\n/g, "\n")  // CRLF → LF
        .replace(/\r/g, "\n")    // handle standalone CR as well
        .trim()
        .split(/\s+/)
        .join(" ");
}

/**
 * Evaluates actual program output against expected output.
 */
export function evaluate(
    actualOutput: string,
    expectedOutput: string
): EvaluationResult {
    const actual = normalizeOutput(actualOutput);
    const expected = normalizeOutput(expectedOutput);

    console.log("\n========== CHECKING ==========");

    if (actual === expected) {
        console.log("\n🎉 ALL TEST CASES PASSED");

        return {
            status: EvaluationStatus.ACCEPTED,
        };
    }

    console.log("\n❌ WRONG ANSWER");

    findFirstDifference(actualOutput, expectedOutput);

    return {
        status: EvaluationStatus.WRONG_ANSWER,
    };
}
/** Finds the first difference between two strings. */
function findFirstDifference(
    actualOutput: string,
    expectedOutput: string
): void {
    const actualTokens = normalizeOutput(actualOutput).split(" ");
    const expectedTokens = normalizeOutput(expectedOutput).split(" ");

    const maxTokens = Math.max(
        actualTokens.length,
        expectedTokens.length
    );

    for (let i = 0; i < maxTokens; i++) {
        if (actualTokens[i] !== expectedTokens[i]) {
            console.log(
                `\nFirst difference at line ${i + 1}`
            );

            console.log(
                "Expected:",
                expectedTokens[i] ?? "<missing>"
            );

            console.log(
                "Received:",
                actualTokens[i] ?? "<missing>"
            );

            return;
        }
    }
}