import "dotenv/config"
import { connectRedis } from "../queue/redis.js";
import { enqueue } from "../queue/judgeQueue.js";
import { Language, type Submission } from "../types.js";

await connectRedis();

for (let i = 1; i <= 10; i++) {
    await enqueue({
        id: `demo-${i}`,
        problemId: "two-sum",
        language: Language.CPP,
        sourceCode: String.raw`
#include <iostream>

int main() {
    std::cout << "Hello ${i}";
    return 0;
}
`
    });
}

console.log("10 submissions added");

// console.log("Demo submission added to Redis");

process.exit(0);