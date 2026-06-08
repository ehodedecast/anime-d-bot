const LEVEL_CAP =
  100;

const XP_ANCHORS = [
  { level: 1, xp: 0 },
  { level: 2, xp: 50 },
  { level: 3, xp: 300 },
  { level: 10, xp: 1120 },
  { level: 20, xp: 2540 },
  { level: 30, xp: 4250 },
  { level: 40, xp: 6260 },
  { level: 50, xp: 8570 },
  { level: 60, xp: 11180 },
  { level: 70, xp: 14090 },
  { level: 80, xp: 17300 },
  { level: 90, xp: 20810 },
  { level: 100, xp: 24060 }
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

function findAnchorRange(
  level
) {
  const normalizedLevel =
    normalizeLevel(
      level
    );

  for (let i = 0; i < XP_ANCHORS.length - 1; i += 1) {
    const start =
      XP_ANCHORS[i];
    const end =
      XP_ANCHORS[i + 1];

    if (
      normalizedLevel >= start.level &&
      normalizedLevel <= end.level
    ) {
      return {
        start,
        end
      };
    }
  }

  return {
    start:
      XP_ANCHORS[XP_ANCHORS.length - 2],
    end:
      XP_ANCHORS[XP_ANCHORS.length - 1]
  };
}

function getXpForLevel(
  level
) {
  const normalizedLevel =
    normalizeLevel(
      level
    );

  const anchor =
    XP_ANCHORS.find(item =>
      item.level === normalizedLevel
    );

  if (
    anchor
  ) {
    return anchor.xp;
  }

  const {
    start,
    end
  } = findAnchorRange(
    normalizedLevel
  );

  const rangeLevels =
    end.level - start.level;

  const progress =
    (normalizedLevel - start.level) /
    rangeLevels;

  return Math.round(
    start.xp +
    (end.xp - start.xp) * progress
  );
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
  XP_ANCHORS,
  getCurrentLevelProgress,
  getLevelFromXp,
  getXpForLevel
};
