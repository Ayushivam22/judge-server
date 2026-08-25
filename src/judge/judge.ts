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


export async function judgeSubmission(
  submission: Submission
): Promise<Verdict> {

  let workspace: Workspace | undefined;
  let container: Container | undefined;

  try {

    // -----------------------------------------
    // 1. Load problem
    // -----------------------------------------

    const problem = await loadProblem(
      submission.problemId
    );
    //console.log("Problem Loaded")
    
    
    // -----------------------------------------
    // 2. Create workspace
    // -----------------------------------------
    
    workspace = await createWorkspace(
      submission.id
    );
    //console.log("Workspace Created")
    
    
    // -----------------------------------------
    // 3. Populate workspace
    // -----------------------------------------
    
    await populateWorkspace(
      workspace,
      problem,
      submission.sourceCode
    );
      //console.log("Workspace Populated")
      
      
    // -----------------------------------------
    // 4. Create container
    // -----------------------------------------
    
    container = await createContainer({
      workspace,
    });
    ////console.log("Container Created")
    
    
    // -----------------------------------------
    // 5. Compile
    // -----------------------------------------
    
    const compileResult = await compile(container.id);
    //console.log("CompileResult: ",compileResult)
    
    if (!compileResult.success) {
      return Verdict.COMPILATION_ERROR;
    }


    // -----------------------------------------
    // 6. Execute
    // -----------------------------------------
    //
    // The executor runs the program ONCE.
    // All test cases are supplied together.
    //

    const executionResult = await execute(container.id, problem.testcasePath);


    // -----------------------------------------
    // 7. Handle execution result
    // -----------------------------------------

    switch (executionResult.status) {

      case ExecutionStatus.RUNTIME_ERROR:
        return Verdict.RUNTIME_ERROR;

      case ExecutionStatus.TIME_LIMIT_EXCEEDED:
        return Verdict.TIME_LIMIT_EXCEEDED;

      case ExecutionStatus.SUCCESS:
        break;

      default:
        return Verdict.INTERNAL_ERROR;
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
      return Verdict.ACCEPTED;
    }

    return Verdict.WRONG_ANSWER;

  } catch (error) {

    console.error(
      "[Judge] Unexpected error:",
      error
    );

    return Verdict.INTERNAL_ERROR;

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


    // -----------------------------------------
    // 10. Remove workspace
    // -----------------------------------------

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