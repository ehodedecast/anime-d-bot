const fs =
  require('fs');

const PATH =
  './data/userProfiles.json';

const {
  getLevelFromXp
} = require('./xpSystem');

function ensureFile() {

  if (
    !fs.existsSync(
      './data'
    )
  ) {

    fs.mkdirSync(
      './data'
    );
  }

  if (
    !fs.existsSync(
      PATH
    )
  ) {

    fs.writeFileSync(
      PATH,
      '{}'
    );
  }
}

function isValidSchema(
  data
) {

  return (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data)
  );
}

function healFile() {

  fs.writeFileSync(
    PATH,
    JSON.stringify(
      {},
      null,
      2
    )
  );
}

function loadUserProfiles() {

  ensureFile();

  try {

    const data =
      JSON.parse(
        fs.readFileSync(
          PATH,
          'utf8'
        )
      );

    if (
      !isValidSchema(
        data
      )
    ) {

      healFile();

      return {};
    }

    return data;

  } catch {

    healFile();

    return {};
  }
}

function saveUserProfiles(
  data
) {

  ensureFile();

  if (
    !isValidSchema(
      data
    )
  ) {

    data = {};
  }

  fs.writeFileSync(
    PATH,
    JSON.stringify(
      data,
      null,
      2
    )
  );
}

function ensureUserProfile(
  userId,
  username = 'Unknown User'
) {

  const data =
    loadUserProfiles();

  if (
    !data[userId]
  ) {

    data[userId] = {
      username
    };

    saveUserProfiles(
      data
    );
  }

  data[userId].username =
    username ||
    data[userId].username ||
    'Unknown User';

  data[userId].profile =
    data[userId].profile || {
      level: 1,
      xp: 0,
      totalXp: 0
    };

  const storedTotalXp =
    Math.max(
      0,
      Math.floor(
        Number(
          data[userId].totalXp ??
          data[userId].xp ??
          data[userId].profile.totalXp ??
          data[userId].profile.xp
        ) || 0
      )
    );

  const level =
    getLevelFromXp(
      storedTotalXp
    );

  data[userId].xp =
    storedTotalXp;

  data[userId].totalXp =
    storedTotalXp;

  data[userId].level =
    level;

  data[userId].profile.level =
    level;

  data[userId].profile.xp =
    storedTotalXp;

  data[userId].profile.totalXp =
    storedTotalXp;

  data[userId].trailers =
    data[userId].trailers || {};

  data[userId].preferences =
    data[userId].preferences || {};

  saveUserProfiles(
    data
  );

  return data[userId];
}

function addXp(
  userId,
  amount,
  username = 'Unknown User'
) {

  const profiles =
    loadUserProfiles();

  profiles[userId] =
    profiles[userId] || {
      username
    };

  profiles[userId].username =
    username ||
    profiles[userId].username ||
    'Unknown User';

  profiles[userId].profile =
    profiles[userId].profile || {};

  const currentTotalXp =
    Math.max(
      0,
      Math.floor(
        Number(
          profiles[userId].totalXp ??
          profiles[userId].xp ??
          profiles[userId].profile.totalXp ??
          profiles[userId].profile.xp
        ) || 0
      )
    );

  const addedXp =
    Math.max(
      0,
      Math.floor(
        Number(amount) || 0
      )
    );

  const totalXp =
    currentTotalXp + addedXp;

  const level =
    getLevelFromXp(
      totalXp
    );

  profiles[userId].xp =
    totalXp;

  profiles[userId].totalXp =
    totalXp;

  profiles[userId].level =
    level;

  profiles[userId].profile.xp =
    totalXp;

  profiles[userId].profile.totalXp =
    totalXp;

  profiles[userId].profile.level =
    level;

  profiles[userId].preferences =
    profiles[userId].preferences || {};

  profiles[userId].trailers =
    profiles[userId].trailers || {};

  saveUserProfiles(
    profiles
  );

  return profiles[userId];
}

function setUserLanguage(
  userId,
  username,
  language
) {

  const profiles =
    loadUserProfiles();

  profiles[userId] =
    profiles[userId] || {
      username
    };

  profiles[userId].username =
    username ||
    profiles[userId].username ||
    'Unknown User';

  profiles[userId].preferences =
    profiles[userId].preferences || {};

  profiles[userId].preferences.language =
    language;

  saveUserProfiles(
    profiles
  );

  return profiles[userId];
}

function getUserPreferences(
  userId
) {

  const profiles =
    loadUserProfiles();

  return profiles[userId]
    ?.preferences || {};
}

function getTrailerEntry(
  profiles,
  userId,
  animeId,
  username = 'Unknown User'
) {

  profiles[userId] =
    profiles[userId] || {
      username
    };

  profiles[userId].username =
    username ||
    profiles[userId].username ||
    'Unknown User';

  profiles[userId].trailers =
    profiles[userId].trailers || {};

  const animeKey =
    String(animeId);

  profiles[userId].trailers[animeKey] =
    profiles[userId].trailers[animeKey] || {
      waiting: false,
      sent: false,
      trailerUrl: null,
      addedAt:
        new Date().toISOString(),
      sentAt: null
    };

  return profiles[userId].trailers[animeKey];
}

function markTrailerWaiting({
  userId,
  username,
  animeId,
  animeTitle,
  trailerUrl = null
}) {

  const profiles =
    loadUserProfiles();

  const entry =
    getTrailerEntry(
      profiles,
      userId,
      animeId,
      username
    );

  entry.waiting = true;
  entry.sent =
    Boolean(entry.sent);
  entry.animeTitle =
    animeTitle ||
    entry.animeTitle ||
    'Unknown';
  entry.trailerUrl =
    trailerUrl ||
    entry.trailerUrl ||
    null;
  entry.addedAt =
    entry.addedAt ||
    new Date().toISOString();

  saveUserProfiles(
    profiles
  );

  return entry;
}

function markTrailerSent({
  userId,
  username,
  animeId,
  animeTitle,
  trailerUrl
}) {

  const profiles =
    loadUserProfiles();

  const entry =
    getTrailerEntry(
      profiles,
      userId,
      animeId,
      username
    );

  entry.waiting = false;
  entry.sent = true;
  entry.animeTitle =
    animeTitle ||
    entry.animeTitle ||
    'Unknown';
  entry.trailerUrl =
    trailerUrl;
  entry.sentAt =
    entry.sentAt ||
    new Date().toISOString();

  saveUserProfiles(
    profiles
  );

  return entry;
}

function getPendingTrailerEntries() {

  const profiles =
    loadUserProfiles();

  const entries = [];

  for (
    const [userId, profile] of
    Object.entries(profiles)
  ) {

    const trailers =
      profile?.trailers || {};

    for (
      const [animeId, trailer] of
      Object.entries(trailers)
    ) {

      if (
        trailer?.waiting &&
        !trailer?.sent
      ) {
        entries.push({
          userId,
          username:
            profile.username ||
            'Unknown User',
          animeId,
          animeTitle:
            trailer.animeTitle ||
            'Unknown',
          trailer
        });
      }
    }
  }

  return entries;
}

function getTrailerProgress({
  userId,
  animeId
}) {

  const profiles =
    loadUserProfiles();

  return profiles[userId]
    ?.trailers
    ?.[String(animeId)] ||
    null;
}

function getEpisodeHistoryEntry(
  profiles,
  userId,
  animeId,
  episode,
  username = 'Unknown User'
) {

  profiles[userId] =
    profiles[userId] || {
      username
    };

  profiles[userId].username =
    username ||
    profiles[userId].username ||
    'Unknown User';

  profiles[userId].episodeHistory =
    profiles[userId].episodeHistory || {};

  const animeKey =
    String(animeId);

  const episodeKey =
    String(episode);

  profiles[userId].episodeHistory[animeKey] =
    profiles[userId].episodeHistory[animeKey] || {};

  profiles[userId].episodeHistory[animeKey][episodeKey] =
    profiles[userId].episodeHistory[animeKey][episodeKey] || {};

  return profiles[userId]
    .episodeHistory[animeKey][episodeKey];
}

function markEpisodeNotified({
  userId,
  username,
  animeId,
  episode,
  watchUrl = null,
  watchLabel = null,
  watchIsStreaming = false,
  streamingProvider = null,
  officialSiteUrl = null
}) {

  const profiles =
    loadUserProfiles();

  const entry =
    getEpisodeHistoryEntry(
      profiles,
      userId,
      animeId,
      episode,
      username
    );

  entry.notifiedAt =
    entry.notifiedAt ||
    new Date().toISOString();

  if (
    watchUrl
  ) {
    entry.watchUrl =
      watchUrl;
  }

  if (
    watchLabel
  ) {
    entry.watchLabel =
      watchLabel;
  }

  entry.watchIsStreaming =
    Boolean(watchIsStreaming);

  if (
    streamingProvider
  ) {
    entry.streamingProvider =
      streamingProvider;
  }

  if (
    officialSiteUrl
  ) {
    entry.officialSiteUrl =
      officialSiteUrl;
  }

  saveUserProfiles(
    profiles
  );

  return entry;
}

function markEpisodeOpened({
  userId,
  username,
  animeId,
  episode
}) {

  const profiles =
    loadUserProfiles();

  const entry =
    getEpisodeHistoryEntry(
      profiles,
      userId,
      animeId,
      episode,
      username
    );

  entry.openedAt =
    entry.openedAt ||
    new Date().toISOString();

  saveUserProfiles(
    profiles
  );

  return entry;
}

function markEpisodeWatched({
  userId,
  username,
  animeId,
  episode
}) {

  const profiles =
    loadUserProfiles();

  const entry =
    getEpisodeHistoryEntry(
      profiles,
      userId,
      animeId,
      episode,
      username
    );

  entry.openedAt =
    entry.openedAt ||
    new Date().toISOString();

  entry.watchedAt =
    entry.watchedAt ||
    new Date().toISOString();

  saveUserProfiles(
    profiles
  );

  return entry;
}

function getEpisodeProgress({
  userId,
  animeId,
  episode
}) {

  const profiles =
    loadUserProfiles();

  return profiles[userId]
    ?.episodeHistory
    ?.[String(animeId)]
    ?.[String(episode)] ||
    null;
}

module.exports = {
  loadUserProfiles,
  saveUserProfiles,
  ensureUserProfile,
  addXp,
  setUserLanguage,
  getUserPreferences,
  markTrailerWaiting,
  markTrailerSent,
  getPendingTrailerEntries,
  getTrailerProgress,
  markEpisodeNotified,
  markEpisodeOpened,
  markEpisodeWatched,
  getEpisodeProgress
};
