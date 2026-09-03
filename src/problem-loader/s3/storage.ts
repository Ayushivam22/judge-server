import S3 from "./connect_s3.js";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";

import { type StorageProvider } from "../types.js";

async function downloadFile(
    key: string,
    destination: string
) {
    let response;

    try {
        response = await S3.send(
            new GetObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET,
                Key: key
            })
        );
    } catch (error) {

        if (
            error instanceof Error &&
            (
                error.name === "NoSuchKey" ||
                error.name === "NotFound"
            )
        ) {
            throw new Error(
                `S3 object not found: ${key}`,
                { cause: error }
            );
        }

        throw new Error(
            `S3 request failed for: ${key}`,
            { cause: error }
        );
    }

    if (!response.Body) {
        throw new Error(`Empty S3 object: ${key}`);
    }

    const data = await response.Body.transformToByteArray();

    try {
        await fs.writeFile(destination, data);
    } catch (error) {
        throw new Error(
            `Failed to write downloaded file to: ${destination}`,
            { cause: error }
        );
    }
}

export const S3Storage: StorageProvider = {

    async downloadDriver(problemId, destination) {
        await downloadFile(
            `problems/${problemId}/main.cpp`,
            destination
        );
    },

    async downloadTestcases(problemId, destination) {
        await downloadFile(
            `problems/${problemId}/testcases.txt`,
            destination
        );
    },

    async downloadExpectedOutput(problemId, destination) {
        await downloadFile(
            `problems/${problemId}/output.txt`,
            destination
        );
    }

};