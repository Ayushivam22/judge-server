# Judge Module Design

## Overview

The **Judge Module** is the core of the Judge Server. Its responsibility is to **judge exactly one submission** from start to finish.

The scheduler, workers, Redis queue, and API server **do not know how judging works**. They simply invoke the Judge Module and receive a verdict.

The Judge Module is completely independent of scheduling, concurrency, databases, and networking.

---

# Responsibility

The Judge Module is responsible for:

1. Downloading problem assets
2. Creating an isolated workspace
3. Writing the user's submission
4. Compiling the submission
5. Executing the compiled program
6. Interpreting execution results
7. Returning the final verdict
8. Cleaning up temporary resources

The Judge Module is **not** responsible for:

- Receiving submissions from Redis
- Worker management
- Queue scheduling
- Database updates
- Sending callbacks/SSE/WebSocket events
- Authentication
- Object storage implementation

---

# Public API

The Judge Module exposes exactly one public function.

```ts
judgeSubmission(submission: Submission): Promise<Verdict>
```

No external module should directly call the compiler, executor, workspace, or problem loader.

Everything flows through `judgeSubmission()`.

---

# Folder Structure

```
judge/

│── judge.ts
│── workspace.ts
│── problem-loader.ts
│── types.ts
│
└── languages/
    ├── cpp/
    │   ├── compiler.ts
    │   └── executor.ts
    │
    ├── java/
    │   ├── compiler.ts
    │   └── executor.ts
    │
    └── python/
        ├── compiler.ts
        └── executor.ts
```

Initially, only the `cpp` directory will be implemented.

The architecture is designed so new languages can be added without modifying the Judge pipeline.

---

# Module Responsibilities

## judge.ts

The orchestration layer.

Responsible only for coordinating the complete judging pipeline.

Workflow:

```
Load Problem Assets

↓

Create Workspace

↓

Populate Workspace

↓

Compile

↓

Execute

↓

Interpret Result

↓

Cleanup

↓

Return Verdict
```

`judge.ts` contains:

- no Docker logic
- no filesystem logic
- no object storage logic
- no compilation logic
- no execution logic

It simply coordinates the pipeline.

---

## workspace.ts

Responsible for all filesystem operations.

Functions:

```ts
createWorkspace();

populateWorkspace();

deleteWorkspace();
```

Responsibilities:

- Create temporary workspace
- Write user's source code
- Copy downloaded problem assets
- Remove workspace after judging

Example:

```
workspace/

submission-123/

    code.cpp
    main.cpp
    testcases.txt
```

All workspace lifecycle management belongs here.

---

## problem-loader.ts

Responsible for downloading problem assets from object storage.

Downloads:

```
main.cpp

testcases.txt
```

Returns:

```ts
interface ProblemAssets {
    driverPath: string;
    testcasePath: string;
}
```

The loader does **not** know where the workspace is located.

It simply provides the required assets.

---

# Language Modules

Each supported language provides two components:

```
compiler.ts

executor.ts
```

The Judge Module selects the correct implementation based on the submission language.

Example:

```ts
const language = languages[submission.language];

const compileResult = await language.compile(...);

const executionResult = await language.execute(...);
```

No language-specific `if` statements are required inside the Judge pipeline.

---

## compiler.ts

Responsible only for compilation.

Example command (C++):

```bash
g++ main.cpp -std=c++20 -O2 -o main
```

Returns:

```ts
interface CompileResult {
    success: boolean;

    executable?: string;

    stdout: string;

    stderr: string;

    compileTimeMs: number;
}
```

The compiler never executes the program.

It only produces an executable.

---

## executor.ts

Responsible only for execution.

Input:

```ts
execute({
    executable,
    workspace,
    limits,
});
```

The executor knows nothing about:

- source files
- compilation
- verdicts
- problem logic

It simply executes the compiled binary inside Docker.

Returns:

```ts
interface ExecutionResult {
    exitCode: number;

    signal?: string;

    timedOut: boolean;

    executionTimeMs: number;

    memoryUsedMb: number;

    stdout: string;

    stderr: string;
}
```

---

# Shared Types

## Verdict

```ts
enum Verdict {
    ACCEPTED,

    WRONG_ANSWER,

    COMPILATION_ERROR,

    RUNTIME_ERROR,

    TIME_LIMIT_EXCEEDED,

    MEMORY_LIMIT_EXCEEDED,

    INTERNAL_ERROR,
}
```

---

## CompileResult

```ts
interface CompileResult {
    success: boolean;

    executable?: string;

    stdout: string;

    stderr: string;

    compileTimeMs: number;
}
```

---

## ExecutionResult

```ts
interface ExecutionResult {
    exitCode: number;

    signal?: string;

    timedOut: boolean;

    executionTimeMs: number;

    memoryUsedMb: number;

    stdout: string;

    stderr: string;
}
```

---

# Dependency Graph

```
                 judge.ts
                     │
     ┌───────────────┼────────────────┐
     │               │                │
     ▼               ▼                ▼
workspace      problem-loader     languages
                                        │
                     ┌──────────────────┴───────────────┐
                     ▼                                  ▼
                 compiler.ts                      executor.ts
```

Dependencies always point downward.

No circular dependencies.

---

# Judging Pipeline

```
Submission

↓

Load Problem Assets

↓

Create Workspace

↓

Populate Workspace

↓

Compile

↓

Compilation Failed?

├── Yes

│

└── Compilation Error

↓

Execute

↓

Timed Out?

├── Yes

│

└── Time Limit Exceeded

↓

Memory Limit Exceeded?

├── Yes

│

└── Memory Limit Exceeded

↓

Runtime Signal?

├── Yes

│

└── Runtime Error

↓

Interpret Exit Code

↓

Accepted / Wrong Answer / Other Verdict

↓

Delete Workspace

↓

Return Verdict
```

---

# Driver Philosophy

The Judge Module knows **nothing** about:

- function names
- class names
- return types
- testcase formats
- output formats
- expected answers

Every problem encapsulates its judging logic inside `main.cpp`.

Example:

```cpp
#include "code.cpp"

int main() {

    freopen("testcases.txt","r",stdin);

    Solution obj;

    ...

    if(answer != expected)
        return 1;

    return 0;
}
```

The Judge simply executes the compiled program.

The driver determines correctness.

---

# Exit Code Interpretation

The Judge interprets execution results instead of assuming every non-zero exit code is a Wrong Answer.

Example mapping:

| Condition                    | Verdict                     |
| ---------------------------- | --------------------------- |
| Compilation failed           | Compilation Error           |
| Timed out                    | Time Limit Exceeded         |
| Memory exceeded              | Memory Limit Exceeded       |
| Process terminated by signal | Runtime Error               |
| Exit code = 0                | Accepted                    |
| Exit code = 1                | Wrong Answer                |
| Exit code = 2                | Presentation Error (future) |
| Exit code = 3                | Checker/Internal Error      |

This keeps runtime failures separate from logical failures.

---

# Docker Philosophy

Docker is only an isolated execution environment.

The Docker image contains:

- Debian Slim
- Compiler/runtime
- Bash
- Standard libraries
- Non-root user

Docker does **not** contain:

- Judge logic
- Testcases
- Problem drivers
- Database access
- Redis
- Object storage

The Judge mounts the workspace into Docker.

Docker simply compiles and executes.

---

# Design Principles

## Single Responsibility

| Component         | Responsibility            |
| ----------------- | ------------------------- |
| judge.ts          | Orchestrates judging      |
| workspace.ts      | Workspace lifecycle       |
| problem-loader.ts | Downloads problem assets  |
| compiler.ts       | Compiles source code      |
| executor.ts       | Executes compiled program |

---

## Generic Judge

The Judge never knows:

- Function name
- Class name
- Number of testcases
- Input format
- Output format
- Checker logic

Everything is encapsulated inside the problem driver.

---

## Language Agnostic

Adding a new language only requires implementing:

```
languages/<language>/

    compiler.ts

    executor.ts
```

No changes are required to `judge.ts`.

---

## Extensible

Future features can be added without changing the overall architecture.

Examples:

- Compilation cache
- Pre-warmed Docker containers
- Resource monitoring
- Interactive problems
- Custom checkers
- Special judges
- Parallel testcase execution
- Multiple Docker images
- Sandbox hardening (seccomp, namespaces, cgroups)

The Judge pipeline remains unchanged while individual components evolve independently.
