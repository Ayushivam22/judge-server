export enum EvaluationStatus {
  ACCEPTED,
  WRONG_ANSWER,
}

export interface EvaluationResult {
  status: EvaluationStatus;
}