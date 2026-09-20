import "dotenv/config";
import { connectRedis, default as redis } from "../queue/redis.js";
import { enqueue } from "../queue/judgeQueue.js";
import { startScheduler } from "../scheduler/scheduler.js";
import { Language, type Submission } from "../types.js";

const QUEUE_NAME = "judge:submissions";

await connectRedis();

// Clear old jobs
await redis.del(QUEUE_NAME);

const submissions: Submission[] = [];

for (let i = 1; i <= 10; i++) {
    submissions.push({
        id: `test-${i}`,
        problemId: "two-sum",
        language: Language.CPP,
        sourceCode: String.raw`
        class Solution
        {
        public:
            int two_sum(int a, int b)
            {
                return a + b;
            }
        };
        `
    });
}

// Add 10 jobs to Redis
for (const submission of submissions) {
    await enqueue(submission);
}

console.log("10 submissions added to Redis");

// Start scheduler
await startScheduler();