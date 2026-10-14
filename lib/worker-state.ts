export function failedAttemptStatus(attemptsMade: number, attempts: number) {
  return attemptsMade >= attempts ? "FAILED" as const : "RETRYING" as const;
}
