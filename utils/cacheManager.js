const fs = require('fs');

const PATH =
  './cache/animeCache.json';

function ensureFile() {

  if (!fs.existsSync('./cache')) {

    fs.mkdirSync('./cache');
  }

  if (!fs.existsSync(PATH)) {

    fs.writeFileSync(
      PATH,
      JSON.stringify({

        animes: {},

        lastGlobalUpdate: null,

        stats: {
          totalCached: 0,
          cacheHits: 0,
          cacheMisses: 0
        }

      }, null, 2)
    );
  }
}

function loadCache() {

  try {

    ensureFile();

    const data =
      JSON.parse(
        fs.readFileSync(PATH)
      );

    if (!data.animes) {
      data.animes = {};
    }

    if (!data.stats) {

      data.stats = {
        totalCached: 0,
        cacheHits: 0,
        cacheMisses: 0
      };
    }

    return data;

  } catch {

    return {

      animes: {},

      lastGlobalUpdate: null,

      stats: {
        totalCached: 0,
        cacheHits: 0,
        cacheMisses: 0
      }
    };
  }
}

function saveCache(data) {

  ensureFile();

  fs.writeFileSync(
    PATH,
    JSON.stringify(data, null, 2)
  );
}

module.exports = {
  loadCache,
  saveCache
};