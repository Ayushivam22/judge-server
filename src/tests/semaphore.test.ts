import { Semaphore } from "../scheduler/semaphore.js";

const semaphore = new Semaphore(4);

let running = 0;
let maxRunning = 0;

async function task(id: number) {
    await semaphore.acquire();

    running++;
    maxRunning = Math.max(maxRunning, running);

    console.log(`Started ${id}, running = ${running}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    running--;

    semaphore.release();

    console.log(`Finished ${id}, running = ${running}`);
}

const tasks = [];

for (let i = 1; i <= 10; i++) {
    tasks.push(task(i));
}

await Promise.all(tasks);

console.log("Maximum concurrent:", maxRunning);