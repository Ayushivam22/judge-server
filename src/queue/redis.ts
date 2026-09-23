import { createClient } from "redis";

if(process.env.REDIS_URL === undefined) {
    throw new Error("REDIS_URL is not defined in the environment variables");
}

const redis = createClient({
    url: process.env.REDIS_URL
});

redis.on("error", (error) => {
    console.error("Redis error:", error);
});

export async function connectRedis() {
    if (!redis.isOpen) {
        await redis.connect();
    }
}

export default redis;