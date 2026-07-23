// src/judge/container/types.ts

import type { Workspace } from "../workspace/types.js";

/**
 * Result of executing a command inside a container.
 */
export interface ExecResult {
  /**
   * Exit code returned by the executed process.
   */
  exitCode: number;

  /**
   * Standard output produced by the process.
   */
  stdout: string;

  /**
   * Standard error produced by the process.
   */
  stderr: string;

  /**
   * Time taken to execute the command (milliseconds).
   */
  durationMs: number;
}

/**
 * Public interface representing a running container.
 */
export interface Container {
  /**
   * Docker container ID.
   */
  readonly id: string;

  /**
   * Executes a command inside the container.
   */
  exec(command: string[]): Promise<ExecResult>;

  /**
   * Stops the running container.
   *
   * Safe to call multiple times.
   */
  stop(): Promise<void>;

  /**
   * Removes the container.
   *
   * Safe to call multiple times.
   */
  remove(): Promise<void>;
}

/**
 * Options required to create a container.
 */
export interface CreateContainerOptions {
  /**
   * Workspace to mount inside the container.
   */
  workspace: Workspace;

  /**
   * Docker image to use.
   *
   * Defaults to DEFAULT_IMAGE.
   */
  image?: string;
}