const REQUIRED_DATA_FILES = {
  'animes.json': {},

  'animeMappings.json': [],

  'animeCache.json': {
    animes: {},
    lastGlobalUpdate: null,
    stats: {
      totalCached: 0,
      cacheHits: 0,
      cacheMisses: 0
    }
  },

  'votes.json': {},

  'sentEpisodes.json': {},

  'analytics.json': {},

  'config.json': {},

  'guildHistory.json': {}
};

function cloneDefaultData(
  fileName
) {

  return JSON.parse(
    JSON.stringify(
      REQUIRED_DATA_FILES[fileName]
    )
  );
}

module.exports = {
  REQUIRED_DATA_FILES,
  cloneDefaultData
};
