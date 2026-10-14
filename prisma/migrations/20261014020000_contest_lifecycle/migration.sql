ALTER TABLE "Challenge" ADD COLUMN "votingStart" TIMESTAMP(3), ADD COLUMN "publishedAt" TIMESTAMP(3);
UPDATE "Challenge" SET "votingStart" = "submissionEnd" WHERE "votingStart" IS NULL;
UPDATE "Challenge" SET "publishedAt" = "createdAt" WHERE "status" <> 'DRAFT';
ALTER TABLE "ChallengeResult" ADD COLUMN "totalVotes" INTEGER NOT NULL DEFAULT 0, ADD COLUMN "settlementVersion" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "EchoChainNode" ADD COLUMN "nextChallengeId" TEXT;
CREATE TABLE "VoteNonce" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "submissionId" TEXT NOT NULL, "nonceHash" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL, "consumedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "VoteNonce_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ChallengeResultEntry" ("id" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "resultId" TEXT NOT NULL, "submissionId" TEXT NOT NULL, "rank" INTEGER NOT NULL, "voteCount" INTEGER NOT NULL, CONSTRAINT "ChallengeResultEntry_pkey" PRIMARY KEY ("id"));
CREATE TABLE "SettlementJob" ("id" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "status" TEXT NOT NULL, "attempts" INTEGER NOT NULL DEFAULT 0, "errorCode" TEXT, "settledAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "SettlementJob_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ChallengeTransitionLog" ("id" TEXT NOT NULL, "challengeId" TEXT NOT NULL, "fromStatus" "ChallengeStatus" NOT NULL, "toStatus" "ChallengeStatus" NOT NULL, "transitionedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ChallengeTransitionLog_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "VoteNonce_nonceHash_key" ON "VoteNonce"("nonceHash");
CREATE INDEX "VoteNonce_userId_challengeId_expiresAt_idx" ON "VoteNonce"("userId", "challengeId", "expiresAt");
CREATE UNIQUE INDEX "ChallengeResultEntry_challengeId_rank_key" ON "ChallengeResultEntry"("challengeId", "rank");
CREATE UNIQUE INDEX "ChallengeResultEntry_challengeId_submissionId_key" ON "ChallengeResultEntry"("challengeId", "submissionId");
CREATE UNIQUE INDEX "SettlementJob_challengeId_key" ON "SettlementJob"("challengeId");
CREATE UNIQUE INDEX "ChallengeTransitionLog_challengeId_fromStatus_toStatus_key" ON "ChallengeTransitionLog"("challengeId", "fromStatus", "toStatus");
CREATE UNIQUE INDEX "EchoChainNode_nextChallengeId_key" ON "EchoChainNode"("nextChallengeId");
WITH ranked AS (
  SELECT s."challengeId", r."id" AS "resultId", s."id" AS "submissionId",
    ROW_NUMBER() OVER (PARTITION BY s."challengeId" ORDER BY COUNT(v."id") DESC, s."createdAt" ASC, s."id" ASC)::INTEGER AS rank,
    COUNT(v."id")::INTEGER AS votes
  FROM "Submission" s JOIN "ChallengeResult" r ON r."challengeId" = s."challengeId"
  LEFT JOIN "Vote" v ON v."submissionId" = s."id"
  WHERE s."status" = 'SUBMITTED'
  GROUP BY s."challengeId", r."id", s."id", s."createdAt"
)
INSERT INTO "ChallengeResultEntry" ("id", "challengeId", "resultId", "submissionId", "rank", "voteCount")
SELECT 'legacy_' || md5("challengeId" || ':' || "submissionId"), "challengeId", "resultId", "submissionId", rank, votes FROM ranked;
UPDATE "ChallengeResult" r SET "totalVotes" = COALESCE((SELECT SUM(e."voteCount") FROM "ChallengeResultEntry" e WHERE e."resultId" = r."id"), 0);
ALTER TABLE "VoteNonce" ADD CONSTRAINT "VoteNonce_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoteNonce" ADD CONSTRAINT "VoteNonce_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VoteNonce" ADD CONSTRAINT "VoteNonce_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeResultEntry" ADD CONSTRAINT "ChallengeResultEntry_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeResultEntry" ADD CONSTRAINT "ChallengeResultEntry_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ChallengeResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeResultEntry" ADD CONSTRAINT "ChallengeResultEntry_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SettlementJob" ADD CONSTRAINT "SettlementJob_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChallengeTransitionLog" ADD CONSTRAINT "ChallengeTransitionLog_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "Challenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EchoChainNode" ADD CONSTRAINT "EchoChainNode_nextChallengeId_fkey" FOREIGN KEY ("nextChallengeId") REFERENCES "Challenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;
