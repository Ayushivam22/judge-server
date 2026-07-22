# Container Module

## Overview

The **Container Module** is responsible for creating and managing isolated Docker containers used during the judging process. It provides a thin abstraction over Docker so that the rest of the judge system does not need to interact with Docker commands directly.

This module **does not know anything about submissions, problems, verdicts, or programming languages**. Its sole responsibility is to provide a secure execution environment and expose a simple API for executing commands inside that environment.

---

# Position in Judge Pipeline

```text
                Judge
                  │
        ┌─────────┴─────────┐
        │                   │
 Problem Loader       Workspace Creator
        │                   │
        └─────────┬─────────┘
                  │
          Container Module
                  │
        ┌─────────┴─────────┐
        │                   │
     Compiler          Executor
        │                   │
        └─────────┬─────────┘
                  │
             Verdict Engine
                  │
               Cleanup
```

The Container Module sits between workspace creation and the compiler/executor.

---

# Responsibilities

The module is responsible for:

- Creating an isolated Docker container.
- Mounting the prepared workspace inside the container.
- Starting the container.
- Executing arbitrary commands inside the container.
- Stopping the container.
- Removing the container after execution.

It is **not responsible for**:

- Compilation logic
- Program execution logic
- Output comparison
- Verdict generation
- Test case management
- Language-specific behavior

---

# Design Philosophy

The Container Module should behave like a lightweight Docker wrapper.

Instead of exposing Docker CLI commands to the rest of the system, it exposes a simple interface:

```text
create()

exec()

stop()

remove()
```

Everything else remains outside this module.

---

# Lifecycle

```
Workspace Created
        │
        ▼
Create Docker Container
        │
        ▼
Start Container
        │
        ▼
Compiler executes commands
        │
        ▼
Executor executes commands
        │
        ▼
Stop Container
        │
        ▼
Remove Container
```

The **same container** is reused throughout the entire judging process.

---

# Why Reuse a Single Container?

Compilation generates executable files.

Example:

```
main.cpp
      │
      ▼
g++
      │
      ▼
main.out
```

If the container is destroyed immediately after compilation:

```
Compile
    │
Destroy Container
    │
Create New Container
```

the generated executable disappears, requiring recompilation.

Instead, the same container should remain alive:

```
Create Container

↓

Compile

↓

Run Testcase 1

↓

Run Testcase 2

↓

Run Testcase N

↓

Destroy Container
```

This avoids unnecessary recompilation and simplifies execution.

---

# Workspace Mount

The workspace prepared by the Workspace Module is mounted inside the container.

Host:

```
/tmp/judge/<submission-id>
```

Container:

```
/workspace
```

Example:

```
Host
└── /tmp/judge/abc123
    ├── main.cpp
    ├── input.txt
    ├── expected.txt

↓

Container

/workspace
├── main.cpp
├── input.txt
├── expected.txt
```

The container operates directly on the mounted workspace.

No file copying is required.

---

# Working Directory

The container always uses

```
/workspace
```

as its working directory.

Therefore commands become simple.

Instead of

```bash
g++ /workspace/main.cpp -o /workspace/main.out
```

the compiler simply executes

```bash
g++ main.cpp -o main.out
```

Similarly,

```bash
./main.out
```

instead of

```bash
/workspace/main.out
```

---

# Public API

## Container Interface

```ts
export interface Container {
    id: string;

    exec(command: string[]): Promise<ExecResult>;

    stop(): Promise<void>;

    remove(): Promise<void>;
}
```

---

## Factory

```ts
export async function createContainer(workspace: Workspace): Promise<Container>;
```

---

# Execution API

The Container Module exposes a generic command execution interface.

Example:

```ts
await container.exec(["g++", "main.cpp", "-O2", "-o", "main.out"]);
```

Running the executable:

```ts
await container.exec(["./main.out"]);
```

Running Python:

```ts
await container.exec(["python3", "main.py"]);
```

The Container Module remains completely language independent.

---

# Exec Result

```ts
export interface ExecResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
}
```

The module simply returns process information.

It does **not** interpret the result.

For example,

Compiler:

```
exitCode != 0

↓

Compilation Error
```

Executor:

```
exitCode == 137

↓

Killed

↓

Memory Limit Exceeded
```

These decisions belong to higher-level modules.

---

# Internal Docker Operations

The implementation internally maps its API to Docker commands.

| Container API | Docker Command |
| ------------- | -------------- |
| create()      | docker create  |
| start()       | docker start   |
| exec()        | docker exec    |
| stop()        | docker stop    |
| remove()      | docker rm -f   |

The rest of the judge system never interacts with Docker directly.

---

# Security Configuration

Each container should be started with strict security settings.

## Disable Network

```
--network none
```

Programs cannot access the internet.

---

## Run as Non-root User

```
-u judge
```

Programs execute with minimal privileges.

---

## Read-only Root Filesystem

```
--read-only
```

Only the mounted workspace remains writable.

---

## Memory Limit

```
--memory 512m
```

Prevents excessive memory usage.

---

## CPU Limit

```
--cpus=1
```

Limits CPU consumption.

---

## PID Limit

```
--pids-limit=128
```

Prevents process-fork attacks.

---

## Drop Linux Capabilities

```
--cap-drop ALL
```

Removes unnecessary Linux capabilities.

---

## Disable Privilege Escalation

```
--security-opt no-new-privileges
```

Prevents gaining additional privileges inside the container.

---

# Suggested Directory Structure

```
container/
│
├── container.ts
├── docker.ts
├── types.ts
└── index.ts
```

---

## container.ts

High-level API exposed to the Judge module.

Responsibilities:

- createContainer()
- lifecycle management

---

## docker.ts

Low-level Docker implementation.

Responsible for:

- docker create
- docker start
- docker exec
- docker stop
- docker rm

---

## types.ts

Shared interfaces.

Contains:

- Container
- ExecResult
- ContainerOptions

---

## index.ts

Exports the public API of the module.

---

# Interaction with Other Modules

```
Judge
 │
 ▼
createContainer()
 │
 ▼
Compiler
 │
 ▼
container.exec(...)
 │
 ▼
Executor
 │
 ▼
container.exec(...)
 │
 ▼
container.remove()
```

The Compiler and Executor depend on the Container Module only through its public interface.

Neither module knows anything about Docker.

---

# Key Design Principles

- Single Responsibility Principle
- Language Agnostic
- Docker Abstraction
- Secure by Default
- Reusable Across Languages
- Minimal Public API
- No Business Logic
- Reuse the Same Container Throughout the Judging Lifecycle

---

# Summary

The Container Module is a thin abstraction over Docker responsible for creating secure execution environments for code submissions. It manages the lifecycle of Docker containers, exposes a simple command execution interface, and isolates the rest of the judge system from Docker-specific implementation details. By keeping this module focused solely on container management, the compiler, executor, and verdict engine remain clean, modular, and independent of the underlying container runtime.
