import "dotenv/config"

import assert from "node:assert";
import redis from "../queue/redis.js";

async function testRedis() {
    console.log("Starting Redis tests...\n");

    // Connect
    await redis.connect();
    assert.strictEqual(redis.isOpen, true);
    console.log("✅ Connect");

    // Set data
    await redis.set("test:key", "hello");

    // Get data
    const value = await redis.get("test:key");
    assert.strictEqual(value, "hello");
    console.log("✅ Set and Get");

    // Update data
    await redis.set("test:key", "world");

    const updatedValue = await redis.get("test:key");
    assert.strictEqual(updatedValue, "world");
    console.log("✅ Update");

    // Check key exists
    const exists = await redis.exists("test:key");
    assert.strictEqual(exists, 1);
    console.log("✅ Exists");

    // Delete data
    await redis.del("test:key");

    const deletedValue = await redis.get("test:key");
    assert.strictEqual(deletedValue, null);
    console.log("✅ Delete");

    // Test JSON
    const submission = {
        id: "123",
        problemId: "two-sum",
        language: "cpp"
    };

    await redis.set(
        "submission:123",
        JSON.stringify(submission)
    );

    const submissionData = await redis.get("submission:123");

    assert.deepStrictEqual(
        JSON.parse(submissionData!),
        submission
    );

    console.log("✅ JSON data");

    // Test queue
    await redis.rPush("submission:queue", "submission-1");
    await redis.rPush("submission:queue", "submission-2");

    const first = await redis.lPop("submission:queue");
    const second = await redis.lPop("submission:queue");

    assert.strictEqual(first, "submission-1");
    assert.strictEqual(second, "submission-2");

    console.log("✅ Queue FIFO");

    // Cleanup
    await redis.del("submission:123");

    // Disconnect
    await redis.quit();
    assert.strictEqual(redis.isOpen, false);

    console.log("✅ Disconnect");

    console.log("\n🎉 All Redis tests passed!");
}

testRedis().catch((error) => {
    console.error("\n❌ Redis test failed:");
    console.error(error);
    process.exit(1);
});