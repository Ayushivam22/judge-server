import { promises as fs } from "fs";

import type {
  Submission,
  Workspace,
  Container,
} from "../types.js";

import { Verdict, ExecutionStatus, EvaluationStatus } from "../types.js";

import {
  loadProblem,
} from "../problem-loader/index.js";

import {
  createWorkspace,
  populateWorkspace,
  removeWorkspace,
} from "../workspace/index.js";

import {
  createContainer,
} from "../container/index.js";

import {
  compile,
} from "../compiler/index.js";

import {
  execute,
} from "../executor/index.js";

import {
  evaluate,
} from "../evaluation/index.js";
import type { JudgeResult } from "./types.js";


export async function judgeSubmission(
  submission: Submission
): Promise<JudgeResult> {

  let workspace: Workspace | undefined;
  let container: Container | undefined;

  try {

    // -----------------------------------------
    // 1. Load problem
    // -----------------------------------------

    const problem = await loadProblem(
      submission.problemId
    );
    // console.log("Problem Loaded:",problem)
    
    
    // -----------------------------------------
    // 2. Create workspace
    // -----------------------------------------
    
    workspace = await createWorkspace(
      submission.id
    );
    // console.log("Workspace Created:",workspace)
    
    
    // -----------------------------------------
    // 3. Populate workspace
    // -----------------------------------------
    
    await populateWorkspace(
      workspace,
      problem,
      submission.sourceCode
    );
      // console.log("Workspace Populated:",workspace)
      
      
    // -----------------------------------------
    // 4. Create container
    // -----------------------------------------
    
    container = await createContainer({
      workspace,
    });
    // console.log("Container Created:",container)
    
    
    // -----------------------------------------
    // 5. Compile
    // -----------------------------------------
    
    const compileResult = await compile(container.id);
    // console.log("CompileResult: ",compileResult)
    
    if (!compileResult.success) {
      return {
        verdict: Verdict.COMPILATION_ERROR,
        compileOutput: compileResult.stderr
      };
    }


    // -----------------------------------------
    // 6. Execute
    // -----------------------------------------
    //
    // The executor runs the program ONCE.
    // All test cases are supplied together.
    //

    const executionResult = await execute(container.id, "testcases.txt");
    // TODO : remove this console
    // console.log(executionResult)


    // -----------------------------------------
    // 7. Handle execution result
    // -----------------------------------------

    switch (executionResult.status) {

      case ExecutionStatus.RUNTIME_ERROR:
        return {
          verdict: Verdict.RUNTIME_ERROR,
          runtimeOutput: executionResult.stderr
        };

      case ExecutionStatus.TIME_LIMIT_EXCEEDED:
        return {
          verdict: Verdict.TIME_LIMIT_EXCEEDED,
          executionTimeMs: executionResult.durationMs
        };

      case ExecutionStatus.SUCCESS:
        break;

      default:
        return {
          verdict: Verdict.INTERNAL_ERROR
        };
    }


    // -----------------------------------------
    // 8. Evaluate output
    // -----------------------------------------

    const expectedOutput = await fs.readFile(
      problem.expectedOutputPath,
      "utf8"
    );

    const evaluationResult = evaluate(
      executionResult.stdout,
      expectedOutput
    );

    if (evaluationResult.status === EvaluationStatus.ACCEPTED) {
      return {
        verdict: Verdict.ACCEPTED
      };
    }

    return {
      verdict: Verdict.WRONG_ANSWER
    }

  } catch (error) {

    console.error(
      "[Judge] Unexpected error:",
      error
    );

    return {
      verdict: Verdict.INTERNAL_ERROR
    };

  } finally {

    // -----------------------------------------
    // 9. Remove container
    // -----------------------------------------

    if (container) {
      try {
        await container.remove();
      } catch (error) {
        console.error(
          "[Judge] Failed to remove container:",
          error
        );
      }
    }


    // // -----------------------------------------
    // // 10. Remove workspace
    // // -----------------------------------------

    if (workspace) {
      try {
        await removeWorkspace(workspace);
      } catch (error) {
        console.error(
          "[Judge] Failed to remove workspace:",
          error
        );
      }
    }
  }
}