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

  'guildHistory.json': {},

  'userAnimes.json': {},

  'userProfiles.json': {},

  'partnerChannels.json': {
    blueLockArena: {
      enabled: true,
      channelId: '1511527059946471435',
      animeIds: [
        137822,
        163146,
        199404
      ],
      titleIncludes: [
        'blue lock'
      ],
      send24h: true,
      sendRelease: true
    }
  },

  'partnerSentEpisodes.json': {}
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
