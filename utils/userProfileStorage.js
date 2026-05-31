const fs =
  require('fs');

const PATH =
  './data/userProfiles.json';

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

  saveUserProfiles(
    data
  );

  return data[userId];
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
  watchUrl = null
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
  markEpisodeNotified,
  markEpisodeOpened,
  markEpisodeWatched,
  getEpisodeProgress
};
