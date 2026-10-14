export type VoteIntent = { domain: string; challengeId: string; submissionId: string; wallet: string; nonce: string; deadline: number; chainId: number };
export function buildVoteMessage(x: VoteIntent) {
  return `ECHO MARKET OFF-CHAIN VOTE\nDomain: ${x.domain}\nChallenge: ${x.challengeId}\nSubmission: ${x.submissionId}\nWallet: ${x.wallet.toLowerCase()}\nNonce: ${x.nonce}\nDeadline: ${x.deadline}\nChain ID: ${x.chainId}`;
}
