/**
 * Default Docker image used when no language-specific image is provided.
 */
export const DEFAULT_IMAGE = "judge-cpp";

/**
 * Directory inside the container where the workspace is mounted.
 */
export const DEFAULT_WORKDIR = "/workspace";

/**
 * Default resource limits.
 */
export const DEFAULT_CPU_LIMIT = 1;
export const DEFAULT_MEMORY_LIMIT = "512m";

/**
 * Security configuration.
 */
export const DEFAULT_NETWORK = "none";
export const DEFAULT_USER = "judge";

export const DEFAULT_PID_LIMIT = 128;

export const DEFAULT_CAP_DROP = "ALL";

export const DEFAULT_SECURITY_OPT = "no-new-privileges";