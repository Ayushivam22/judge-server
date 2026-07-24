import { loadProblem } from "../problem-loader/index.js";

async function main() {
    const assets = await loadProblem("two-sum");

    console.log(assets);
}

main().catch(console.error);