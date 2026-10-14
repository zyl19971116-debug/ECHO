export const publicSubmissionSelect = {
  id: true,
  challengeId: true,
  anonymousNumber: true,
  title: true,
  description: true,
  imageUrl: true,
  imageHash: true,
  createdAt: true,
  status: true,
  _count: { select: { votes: true } },
} as const;
