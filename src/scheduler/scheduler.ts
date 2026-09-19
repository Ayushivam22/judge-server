import type { Submission } from "../types.js";
import { judgeSubmission } from "../judge/judge.js";
import { dequeue } from "../queue/judgeQueue.js";
import { Semaphore } from "./semaphore.js";

const MAX_CONCURRENT_JOBS = 4;

const semaphore = new Semaphore(MAX_CONCURRENT_JOBS);

export async function startScheduler() {
    while (true) {
        // Wait until a slot is available
        await semaphore.acquire();

        // Only remove from Redis when we have capacity
        const submission = await dequeue();

        // Run without blocking the scheduler
        run(submission);
    }
}

async function run(submission: Submission) {
    try {
        const result = await judgeSubmission(submission);

        console.log(
            `Submission ${submission.id}:`,
            result
        );
    } catch (error) {
        console.error(
            `Submission ${submission.id} failed:`,
            error
        );
    } finally {
        // Free the slot
        semaphore.release();
    }
}