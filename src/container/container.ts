import type { Container, CreateContainerOptions } from "./types.js";

import * as docker from "./docker.js";

import { DEFAULT_IMAGE } from "./constants.js";

/**
 * Creates and starts a Docker container.
 *
 * The returned container provides a minimal interface for
 * executing commands and managing its lifecycle without exposing
 * Docker-specific details to the rest of the judge.
 */
export async function createContainer({
  workspace,
  image = DEFAULT_IMAGE,
}: CreateContainerOptions): Promise<Container> {
  const containerId = await docker.createContainer({
    workspace,
    image,
  });

  try {
    await docker.startContainer(containerId);
  } catch (error) {
    // Best-effort cleanup.
    await docker.removeContainer(containerId).catch(() => {});
    throw error;
  }

  return {
    id: containerId,

    exec(command: string[]) {
      return docker.execInContainer(containerId, command);
    },

    stop() {
      return docker.stopContainer(containerId);
    },

    remove() {
      return docker.removeContainer(containerId);
    },
  };
}