# Judge Server Architecture Documentation

## Overview

The Judge Server is responsible for securely compiling and executing user submissions inside isolated Docker containers.

Unlike traditional online judges where the **judge compares outputs after every testcase**, this architecture delegates all **problem-specific logic** to a driver file (`main.cpp`).

The Judge Server only performs generic operations:

- Prepare workspace
- Compile
- Execute
- Interpret result
- Cleanup

This makes the Judge completely independent of problem statements, function signatures, parameter types, and expected outputs.

---

# High Level Architecture

```text
                 Submission
                      │
                      ▼
                Judge Server
                      │
      ┌───────────────┴───────────────┐
      │                               │
Download Driver                 Download Testcases
(main.cpp)                     (testcases.txt)
      │                               │
      └───────────────┬───────────────┘
                      │
              Create Workspace
                      │
        ┌─────────────┴──────────────┐
        │                            │
        ▼                            ▼
    code.cpp                    main.cpp
(User Submission)           (Problem Driver)
        │                            │
        └─────────────┬──────────────┘
                      │
              testcases.txt
                      │
                      ▼
             Mount into Docker
                      │
                      ▼
          Compile and Execute Once
                      │
                      ▼
              Read Exit Status
                      │
                      ▼
             Generate Final Verdict
                      │
                      ▼
             Delete Workspace
```

---

# Design Philosophy

The Judge Server should never know

- Function name
- Class name
- Parameters
- Return type
- Number of testcases
- Expected outputs

Everything related to evaluating a problem is encapsulated inside the driver's `main.cpp`.

This allows the Judge Server to remain completely generic.

---

# Folder Structure

```text
judge-server/

│
├── cpp/
│   │
│   ├── docker/
│   │      ├── Dockerfile
│   │      └── run.sh
│   │
│   ├── workspace/
│   │
│   ├── runner/
│   │      ├── judge.ts
│   │      ├── problem-loader.ts
│   │      ├── workspace-manager.ts
│   │      ├── compiler.ts
│   │      ├── executor.ts
│   │      └── cleanup.ts
│   │
│   └── config/
│
├── shared/
│
└── package.json
```

---

# Components

---

## docker/

Contains everything related to the Docker image.

Example

```
docker/

Dockerfile

run.sh
```

Responsibilities

- Build Docker image
- Execute compiler
- Execute binary

Nothing else.

---

## workspace/

Temporary execution directory.

A new workspace is created for every submission.

Example

```
workspace/

submission-1023/

│
├── code.cpp
├── main.cpp
├── testcases.txt
├── main
├── compile_error.txt
└── runtime_error.txt
```

Workspace exists only while judging.

After the verdict is produced, the workspace is deleted.

---

## runner/

Contains the complete judging pipeline.

---

### judge.ts

Main orchestrator.

Responsible for executing the complete judging flow.

Flow

```
Receive Submission

↓

Load Problem Files

↓

Create Workspace

↓

Compile

↓

Execute

↓

Interpret Result

↓

Cleanup
```

---

### problem-loader.ts

Responsible for downloading all problem assets.

Input

```
Problem ID
```

Downloads

```
main.cpp

testcases.txt
```

Returns

```
Driver

Testcase File

Limits
```

The rest of the Judge does not care where these files came from.

Today

```
Object Storage
```

Tomorrow

```
Local Cache
```

Only this module changes.

---

### workspace-manager.ts

Responsible for creating the temporary workspace.

Creates

```
workspace/submission-id/
```

Writes

```
code.cpp
```

Copies

```
main.cpp
```

Copies

```
testcases.txt
```

Returns workspace path.

---

### compiler.ts

Compiles the submission.

Runs

```bash
g++ main.cpp -std=c++20 -O2 -o main
```

Returns

```
Compilation Success
```

or

```
Compilation Error
```

---

### executor.ts

Executes the compiled binary.

Runs

```bash
./main
```

Returns

- Exit Code
- Execution Time
- Memory Usage
- Runtime Errors

---

### cleanup.ts

Deletes

```
workspace/submission-id/
```

Removes temporary files after judging.

---

# Problem Assets

Every problem stores only two files required for judging.

```
Problem

│

├── main.cpp

└── testcases.txt
```

---

## main.cpp

Driver responsible for evaluating the user's solution.

Responsibilities

- Read testcases
- Call Solution method
- Compare outputs
- Return verdict

Example

```cpp
#include <bits/stdc++.h>
using namespace std;

#include "code.cpp"

int main(){

    freopen("testcases.txt","r",stdin);

    int t;

    cin>>t;

    Solution obj;

    while(t--){

        int a,b;

        cin>>a>>b;

        int expected;

        cin>>expected;

        int ans=obj.sum(a,b);

        if(ans!=expected){

            return 1;
        }

    }

    return 0;
}
```

The Judge never knows what function is being called.

---

## code.cpp

Contains only the user's implementation.

Example

```cpp
class Solution{

public:

    int sum(int a,int b){

        return a+b;

    }

};
```

---

## testcases.txt

Contains every hidden testcase.

Example

```
3

2 5
7

10 20
30

100 200
300
```

Format

```
Number of Testcases

↓

Input

↓

Expected Output

↓

Input

↓

Expected Output
```

The driver is responsible for parsing this file.

---

# Workspace Lifecycle

When judging begins

```
workspace/

submission-100/

│
├── code.cpp
├── main.cpp
├── testcases.txt
```

Compile

↓

```
main
```

Execute

↓

Workspace deleted.

---

# Docker Execution

Workspace is mounted

```bash
docker run \
--rm \
--network none \
--memory=256m \
--cpus=1 \
--cap-drop ALL \
--pids-limit=64 \
-v <workspace>:/home/judge/workspace \
-w /home/judge/workspace \
light-weight-gcc
```

Compile

```bash
g++ main.cpp -std=c++20 -O2 -o main
```

Run

```bash
./main
```

---

# Verdict Generation

The driver determines correctness.

Suggested protocol

Exit Code

```
0
```

Accepted

```
1
```

Wrong Answer

The Judge interprets only the exit code.

Special cases

Compilation fails

↓

Compilation Error

Execution exceeds time limit

↓

Time Limit Exceeded

Process crashes

↓

Runtime Error

---

# Judging Flow

```text
Receive Submission
        │
        ▼
Download main.cpp
        │
        ▼
Download testcases.txt
        │
        ▼
Create Workspace
        │
        ▼
Write code.cpp
        │
        ▼
Compile
        │
        ├───────────────┐
        │               │
        ▼               ▼
Compile OK      Compilation Error
        │
        ▼
Execute Program
        │
        ├───────────────┐
        │               │
        ▼               ▼
Runtime Error      Time Limit
        │
        ▼
Read Exit Code
        │
        ├───────────────┐
        │               │
        ▼               ▼
0               Non-Zero
        │               │
        ▼               ▼
Accepted      Wrong Answer
        │
        ▼
Cleanup Workspace
```

---

# Advantages of this Architecture

## Generic Judge

The Judge never needs to understand the problem.

---

## One Execution

The program executes exactly once.

No repeated

```
Run

↓

Compare

↓

Run

↓

Compare
```

---

## Single Testcase File

Every hidden testcase is stored in

```
testcases.txt
```

No need for

```
input1.txt

output1.txt

input2.txt

output2.txt
```

---

## Driver Encapsulation

Every problem owns its own judging logic.

The Judge remains completely independent of problem implementation.

---

## Easy Multi-language Support

Each language only needs its own

- Docker image
- Compiler
- Executor

The overall judging pipeline remains identical.

---

# Future Improvements

- Local driver cache
- Parallel judge workers
- Distributed judging
- Memory usage tracking
- Interactive problem support
- Custom checker support
- Floating point checker
- Plagiarism detection
- Sandbox hardening (seccomp/AppArmor)
