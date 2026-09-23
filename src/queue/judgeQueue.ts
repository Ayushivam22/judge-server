import redis from "./redis.js";
import type { Submission } from "../types.js";

const QUEUE_NAME = "judge:submissions";

export async function enqueue(submission: Submission) {
    await redis.rPush(
        QUEUE_NAME,
        JSON.stringify(submission)
    );
}

export async function dequeue(): Promise<Submission> {
    const result = await redis.blPop(
        QUEUE_NAME,
        0
    );

    if (!result) {
        throw new Error("Failed to dequeue submission");
    }

    return JSON.parse(result.element) as Submission;
}