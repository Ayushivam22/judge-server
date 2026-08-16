# Evaluation Module

## Overview

The **Evaluation Module** determines whether the output produced by a submitted program is correct.

It receives:

- Actual output from the **Executor**
- Expected output from the problem

and returns a verdict.

It does **not** compile code, execute code, create Docker containers, or manage workspaces.

## Why "Evaluation Module"?

`Checker` is technically correct, but **Evaluation Module** better describes the responsibility and avoids confusion with the top-level **Judge** module.

The architecture is:

```text
Judge
 ├── Workspace
 ├── Problem Loader
 ├── Container
 ├── Compiler
 ├── Executor
 └── Evaluation
```

The **Judge** orchestrates the complete process. **Evaluation** only determines whether program output is correct.

---

## Responsibilities

```text
Actual Output
      |
      v
+------------------+
| Normalize Output |
+--------+---------+
         |
         v
Expected Output
      |
      v
+------------------+
| Compare Outputs  |
+--------+---------+
         |
         v
      Verdict
```

The initial implementation uses whitespace-insensitive token comparison.

For example, these are considered equivalent:

```text
1 4
3 7
5 8
```

and:

```text
1    4
3 7

5 8
```

---

## Module Structure

```text
evaluation/
├── evaluation.ts
├── types.ts
└── index.ts
```

---

## Types

### `types.ts`

```ts
export enum EvaluationStatus {
  ACCEPTED,
  WRONG_ANSWER,
}

export interface EvaluationResult {
  status: EvaluationStatus;
}
```

This can later be extended with diagnostic information if required.

---

## Public API

```ts
export function evaluate(
  actualOutput: string,
  expectedOutput: string
): EvaluationResult;
```

Example:

```ts
const result = evaluate(
  executionResult.stdout,
  expectedOutput
);

if (result.status === EvaluationStatus.ACCEPTED) {
  console.log("Accepted");
}
```

---

## Output Normalization

The first implementation normalizes output before comparison:

```ts
function normalizeOutput(output: string): string {
  return output
    .trim()
    .split(/\s+/)
    .join(" ");
}
```

The evaluator then compares the normalized strings:

```ts
export function evaluate(
  actualOutput: string,
  expectedOutput: string
): EvaluationResult {
  const actual = normalizeOutput(actualOutput);
  const expected = normalizeOutput(expectedOutput);

  if (actual === expected) {
    return {
      status: EvaluationStatus.ACCEPTED,
    };
  }

  return {
    status: EvaluationStatus.WRONG_ANSWER,
  };
}
```

### Why normalization belongs here

The Executor should return the program's output exactly as produced.

```text
Executor
    |
    | exact stdout
    v
Evaluation
    |
    | normalize
    v
Compare with expected output
```

The Executor should not modify output because output evaluation is the Evaluation Module's responsibility.

---

## Complete Judging Pipeline

```text
                    Submission
                        |
                        v
                 +-------------+
                 |    Judge    |
                 +------+------+
                        |
                +-------+--------+
                v                v
          Problem Loader     Workspace
                |                |
                +-------+--------+
                        |
                        v
                   Container
                        |
                        v
                    Compiler
                        |
                        v
                   Executable
                        |
                        v
                    Executor
                        |
                        | stdout
                        v
                  Evaluation
                        |
                        | expected output
                        v
                     Verdict
```

---

## Relationship with Executor

The Executor returns something like:

```ts
export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}
```

The Evaluation Module only needs:

```ts
executionResult.stdout
```

and the expected output.

Example:

```ts
const executionResult = await execute(
  containerId,
  "testcases/input.txt"
);

if (executionResult.status !== ExecutionStatus.SUCCESS) {
  return executionResult.status;
}

const expectedOutput = await fs.readFile(
  "testcases/output.txt",
  "utf8"
);

const evaluation = evaluate(
  executionResult.stdout,
  expectedOutput
);
```

No output file needs to be created for the user's actual output. The Executor already has it in `stdout`.

---

## Handling Execution Failures

The Evaluation Module should **not** classify runtime failures.

The stages are:

```text
Compile
  |
  +-- failure --> COMPILATION_ERROR
  |
  v
Execute
  |
  +-- timeout --> TIME_LIMIT_EXCEEDED
  +-- crash   --> RUNTIME_ERROR
  |
  v
Evaluate
  |
  +-- mismatch --> WRONG_ANSWER
  |
  v
ACCEPTED
```

Evaluation only runs when program execution succeeds.

---

## Future Evaluation Strategies

### 1. Standard Token Checker

Useful for most competitive-programming problems.

### 2. Floating-Point Checker

For outputs where a tolerance is required:

```ts
Math.abs(actual - expected) <= epsilon
```

### 3. Custom Checker

Useful when multiple outputs can be valid, such as:

- graph constructions
- permutations
- optimization problems

### 4. Special Judge

A separate validation program can receive the input and user's output and determine validity.

These can be added later without changing the Executor.

---

## Security

Program output is **untrusted data**.

The Evaluation Module must never:

- execute output as a command
- evaluate output as JavaScript
- interpolate output into shell commands
- assume output has a safe size

For example, do not do:

```ts
exec(`check ${actualOutput}`);
```

Keep output as a string and compare it directly.

Output-size limits should be enforced by the Executor/Container layer before evaluation.

---

## Testing

The Evaluation Module can be tested without Docker.

### Accepted

```ts
const result = evaluate(
  "1 4\n3 7\n",
  "1 4\n3 7"
);

console.assert(
  result.status === EvaluationStatus.ACCEPTED
);
```

### Whitespace differences

```ts
const result = evaluate(
  "  1   4\n\n3\t7\n",
  "1 4\n3 7\n"
);

console.assert(
  result.status === EvaluationStatus.ACCEPTED
);
```

### Wrong answer

```ts
const result = evaluate(
  "1 4\n3 8\n",
  "1 4\n3 7\n"
);

console.assert(
  result.status === EvaluationStatus.WRONG_ANSWER
);
```

---

## Current Scope

The first version supports:

- Standard output comparison
- Whitespace normalization
- Accepted / Wrong Answer verdicts

It does not yet support:

- Floating-point tolerance
- Custom checkers
- Special judges
- Interactive problems
- Optimization scoring

---

## Design Principle

> **The Executor executes. The Evaluation Module evaluates. The Judge orchestrates.**

```text
Executor
    |
    | "Here is exactly what the program produced."
    v
Evaluation
    |
    | "This output is / is not correct."
    v
Judge
    |
    | "Therefore the submission receives this verdict."
    v
Final Verdict
```
