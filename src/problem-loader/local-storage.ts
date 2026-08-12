import { promises as fs } from "fs";
import path from "path";
import type { StorageProvider } from "./types.js";

const PROBLEMS_ROOT = path.join(process.cwd(), "assets", "problems");

export const localStorage: StorageProvider = {

    async downloadDriver(problemId, destination) {
        await fs.copyFile(
            path.join(PROBLEMS_ROOT, problemId, "main.cpp"),
            destination
        );
    },

    async downloadTestcases(problemId, destination) {
        await fs.copyFile(
            path.join(PROBLEMS_ROOT, problemId, "testcases.txt"),
            destination
        );
    }

};