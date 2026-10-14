export function assertSubmissionWindow(challenge: { status: string; submissionStart: Date; submissionEnd: Date } | null, now = new Date()): asserts challenge is { status: string; submissionStart: Date; submissionEnd: Date } {
  if (!challenge || challenge.status !== "SUBMISSION" || now < challenge.submissionStart || now >= challenge.submissionEnd) throw new Error("SUBMISSIONS_CLOSED");
}
export function assertEligibleGeneration(job: { userId: string; challengeId: string; status: string; moderationStatus: string; asset: { uploadStatus: string; visibility: string } | null } | null, userId: string, challengeId: string): asserts job is { userId: string; challengeId: string; status: string; moderationStatus: string; asset: { uploadStatus: string; visibility: string } } {
  if (!job || job.userId !== userId || job.challengeId !== challengeId || job.status !== "COMPLETED" || job.moderationStatus !== "APPROVED" || !job.asset || job.asset.uploadStatus !== "UPLOADED" || job.asset.visibility !== "PRIVATE") throw new Error("GENERATION_NOT_ELIGIBLE");
}
