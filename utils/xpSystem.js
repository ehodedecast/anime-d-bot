const LEVEL_CAP =
  100;

const LEVEL_XP_TOTALS = [
  0, 50, 300, 800, 1050, 1300, 1550, 1800, 2050, 2300,
  2550, 2800, 3050, 3300, 3550, 3800, 4050, 4300, 4550, 4800,
  5050, 5300, 5550, 5800, 6050, 6300, 6550, 6800, 7050, 7300,
  7550, 7800, 8050, 8300, 8550, 8800, 9050, 9300, 9550, 9800,
  10050, 10300, 10550, 10800, 11050, 11300, 11550, 11800, 12050, 12300,
  12550, 12800, 13050, 13300, 13550, 13800, 14050, 14300, 14550, 14800,
  15050, 15300, 15550, 15800, 16050, 16300, 16550, 16800, 17050, 17300,
  17550, 17800, 18050, 18300, 18550, 18800, 19050, 19300, 19550, 19800,
  20050, 20300, 20550, 20800, 21050, 21300, 21550, 21800, 22050, 22300,
  22550, 22800, 23050, 23300, 23550, 23800, 24050, 24300, 24550, 24800
];

const XP_REWARDS = {
  episodeWatched: 25,
  topggVote: 25,
  achievements: {
    bronze: 50,
    silver: 150,
    gold: 300,
    platinum: 1000
  }
};

function normalizeXp(
  totalXp
) {
  return Math.max(
    0,
    Math.floor(
      Number(totalXp) || 0
    )
  );
}

function normalizeLevel(
  level
) {
  return Math.min(
    LEVEL_CAP,
    Math.max(
      1,
      Math.floor(
        Number(level) || 1
      )
    )
  );
}

function getXpForLevel(
  level
) {
  const normalizedLevel =
    normalizeLevel(
      level
    );

  return LEVEL_XP_TOTALS[
    normalizedLevel - 1
  ];
}

function getLevelFromXp(
  totalXp
) {
  const xp =
    normalizeXp(
      totalXp
    );

  for (let level = LEVEL_CAP; level >= 1; level -= 1) {
    if (
      xp >= getXpForLevel(level)
    ) {
      return level;
    }
  }

  return 1;
}

function getCurrentLevelProgress(
  totalXp
) {
  const xp =
    normalizeXp(
      totalXp
    );

  const level =
    getLevelFromXp(
      xp
    );

  const levelStartXp =
    getXpForLevel(
      level
    );

  const nextLevelXp =
    level >= LEVEL_CAP
      ? levelStartXp
      : getXpForLevel(
          level + 1
        );

  return {
    level,
    currentXp:
      xp - levelStartXp,
    requiredXp:
      level >= LEVEL_CAP
        ? 0
        : nextLevelXp - levelStartXp,
    totalXp:
      xp
  };
}

module.exports = {
  LEVEL_CAP,
  XP_REWARDS,
  LEVEL_XP_TOTALS,
  getCurrentLevelProgress,
  getLevelFromXp,
  getXpForLevel
};
