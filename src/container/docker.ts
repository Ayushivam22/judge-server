import { runProcess } from "../utils/process.js";
import type { Workspace } from "../workspace/types.js";
import type { ExecOptions, ExecResult } from "./types.js";

import {
  DEFAULT_CAP_DROP,
  DEFAULT_CPU_LIMIT,
  DEFAULT_MEMORY_LIMIT,
  DEFAULT_NETWORK,
  DEFAULT_PID_LIMIT,
  DEFAULT_SECURITY_OPT,
  DEFAULT_USER,
  DEFAULT_WORKDIR,
} from "./constants.js";

interface DockerCreateOptions {
  workspace: Workspace;
  image: string;
}

/** 
 * Creates a Docker container.
 *
 * The container is created in the stopped state.
 * The caller must invoke startContainer() before using it.
 */
export async function createContainer(
  options: DockerCreateOptions
): Promise<string> {
  const args = buildCreateArgs(options);

  const result = await runProcess("docker", args);

  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to create Docker container.\n${result.stderr}`
    );
  }

  return result.stdout.trim();
}

/**
 * Starts an existing Docker container.
 */
export async function startContainer(
  containerId: string
): Promise<void> {
  const result = await runProcess("docker", [
    "start",
    containerId,
  ]);

  if (result.exitCode !== 0) {
    throw new Error(
      `Failed to start container '${containerId}'.\n${result.stderr}`
    );
  }
}

/**
 * Executes a command inside a running container.
 */
export async function execInContainer(
  containerId: string,
  command: string[],
  options?: ExecOptions
): Promise<ExecResult> {
  let args: string[];

  if (options?.stdinFile) {
    const commandString = [
      ...command,
      "<",
      options.stdinFile
    ].join(" ");

    args = [
      "exec",
      containerId,
      "sh",
      "-c",
      commandString,
    ];
  } else {
    args = [
      "exec",
      containerId,
      ...command,
    ];
  }
  const result = await runProcess("docker", args);

  return {
    exitCode: result.exitCode,
    stdout: result.stdout,
    stderr: result.stderr,
    durationMs: result.durationMs,
  };
}

/**
 * Stops a running container.
 *
 * Best effort.
 */
export async function stopContainer(
  containerId: string
): Promise<void> {
  await runProcess("docker", [
    "stop",
    containerId,
  ]).catch(() => { });
}

/**
 * Removes a container.
 *
 * Best effort.
 */
export async function removeContainer(
  containerId: string
): Promise<void> {
  await runProcess("docker", [
    "rm",
    "-f",
    containerId,
  ]).catch(() => { });
}

/**
 * Builds docker create command arguments.
 */
function buildCreateArgs(
  options: DockerCreateOptions
): string[] {
  const args: string[] = [
    "create",

    "--network",
    DEFAULT_NETWORK,

    "--memory",
    DEFAULT_MEMORY_LIMIT,

    "--cpus",
    DEFAULT_CPU_LIMIT.toString(),

    "--pids-limit",
    DEFAULT_PID_LIMIT.toString(),

    "--cap-drop",
    DEFAULT_CAP_DROP,

    "--security-opt",
    DEFAULT_SECURITY_OPT,

    "--user",
    DEFAULT_USER,

    "--workdir",
    DEFAULT_WORKDIR,

    // TODO : add this restriction after compiler and executor is working fine
    // "--read-only",

    "-v",
    `${buildVolume(options.workspace)}:${DEFAULT_WORKDIR}`,

    options.image,

    "sleep",
    "infinity",
  ];

  return args;
}

/**
 * Returns the host workspace path to mount.
 */
function buildVolume(workspace: Workspace): string {
  return workspace.path;
}