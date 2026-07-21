import { execFile } from "child_process";
import { promisify } from "util";

import type { Container } from "./types.js";

const execFileAsync = promisify(execFile);
const DOCKER_IMAGE = "judge-cpp-image";

function containerName(containerId: string): string {
    return `submission-${containerId}`;
}

/**
 * Creates and starts the Docker container for a submission workspace.
 */
export async function createContainer(
    containerId: string,
    workspacePath: string
): Promise<Container> {
    const name = containerName(containerId);

    await execFileAsync("docker", [
        "create",
        "--name",
        name,
        "-v",
        `${workspacePath}:/workspace`,
        DOCKER_IMAGE,
        "sleep",
        "infinity",
    ]);

    await execFileAsync("docker", ["start", name]);

    return {
        id: name,
    };
}

/**
 * Executes a command inside a running container.
 */
export async function exec(
    container: Container,
    command: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number; signal?: NodeJS.Signals }> {
    try {
        const { stdout, stderr } = await execFileAsync(
            "docker",
            ["exec", container.id, ...command],
            {
                maxBuffer: 1024 * 1024 * 16,
            }
        );

        return {
            stdout: stdout.toString(),
            stderr: stderr.toString(),
            exitCode: 0,
        };
    } catch (error) {
        if (error && typeof error === "object") {
            const maybeError = error as {
                stdout?: Buffer | string;
                stderr?: Buffer | string;
                code?: number;
                signal?: NodeJS.Signals;
            };

            return {
                stdout: maybeError.stdout ? maybeError.stdout.toString() : "",
                stderr: maybeError.stderr ? maybeError.stderr.toString() : "",
                exitCode: typeof maybeError.code === "number" ? maybeError.code : 1,
                ...(maybeError.signal ? { signal: maybeError.signal } : {}),
            };
        }

        return {
            stdout: "",
            stderr: error instanceof Error ? error.message : "Container exec failed",
            exitCode: 1,
        };
    }
}

/**
 * Stops and removes the Docker container.
 */
export async function destroyContainer(
    container: Container
): Promise<void> {
    await execFileAsync("docker", ["rm", "-f", container.id]);
}