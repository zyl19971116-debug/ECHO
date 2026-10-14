export function assertVotingOpen(challenge: { status: string; votingStart: Date | null; submissionEnd: Date; votingEnd: Date } | null, now = new Date()) {
  const start = challenge?.votingStart || challenge?.submissionEnd;
  if (!challenge || challenge.status !== "VOTING" || !start || now < start || now >= challenge.votingEnd) throw new Error("VOTING_NOT_OPEN");
}
export function assertVoteTarget(submission: { challengeId: string; creatorUserId: string; status: string; asset: { visibility: string } | null } | null, challengeId: string, voterUserId: string) {
  if (!submission || submission.challengeId !== challengeId || submission.creatorUserId === voterUserId || submission.status !== "SUBMITTED" || submission.asset?.visibility !== "PUBLIC") throw new Error("VOTE_NOT_ALLOWED");
}
