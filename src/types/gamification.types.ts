// Referral Types
export interface ReferralStats {
  referralCode: string | null;
  referralLink: string | null;
  totalReferrals: number;
  referrals: Array<{
    id: string;
    name: string;
    joinedAt: string;
  }>;
  currentTier: {
    count: number;
    name: string;
    reward: string;
  } | null;
  nextTier: {
    count: number;
    name: string;
    reward: string;
  } | null;
  progress: {
    current: number;
    needed: number;
    remaining: number;
    percentage: number;
  } | null;
}

export interface ReferralLeaderboardEntry {
  rank: number;
  userId: string;
  profileId: string | null;
  username: string | null;
  name: string;
  profileImage: string | null;
  referralCode: string | null;
  totalReferrals: number;
  currentTier: {
    count: number;
    name: string;
    reward: string;
  } | null;
}

// Milestone Types
export interface Milestone {
  id: string;
  type: string;
  threshold: number;
  currentValue: number;
  unlockedAt: string;
  isNotified: boolean;
}

export interface MilestoneProgress {
  totalVotes: number;
  milestones: Array<{
    threshold: number;
    name: string;
    description: string;
    icon: string;
    reward: string;
    isUnlocked: boolean;
    progress: number;
    unlockedAt: string | null;
  }>;
  nextMilestone: {
    threshold: number;
    name: string;
    votesNeeded: number;
    progress: number;
  } | null;
}

// Achievement Types
export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  badgeImage: string | null;
  category: string;
  requirement: number | null;
  tier: string;
  isUnlocked: boolean;
  unlockedAt: string | null;
  progress: number;
}

// Unlock Types
export interface UnlockProgress {
  totalVotes: number;
  unlocks: Array<{
    type: string;
    title: string;
    description: string | null;
    voteThreshold: number;
    isUnlocked: boolean;
    progress: number;
    unlockedAt: string | null;
    contentUrl: string | null;
  }>;
}

export interface UnlockedContent {
  id: string;
  contentType: string;
  title: string;
  description: string | null;
  contentUrl: string | null;
  voteThreshold: number;
  unlockedAt: string;
  isActive: boolean;
}

// Voter Leaderboard Types
export interface VoterLeaderboardEntry {
  rank: number;
  profileId: string;
  username: string;
  name: string;
  profileImage: string | null;
  totalVotesGiven: number;
  freeVotesGiven: number;
  paidVotesGiven: number;
  lastVoteAt: string;
}

