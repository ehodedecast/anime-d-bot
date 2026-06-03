const fs = require('fs');

const CHANNELS_PATH =
  './data/partnerChannels.json';

const SENT_PATH =
  './data/partnerSentEpisodes.json';

const {
  cloneDefaultData
} = require('./dataSchemas');

const DEFAULT_PARTNER_CHANNELS =
  cloneDefaultData(
    'partnerChannels.json'
  );

function ensureDataDir() {
  if (!fs.existsSync('./data')) {
    fs.mkdirSync('./data');
  }
}

function ensureJsonFile(path, defaultData) {
  ensureDataDir();

  if (!fs.existsSync(path)) {
    fs.writeFileSync(
      path,
      JSON.stringify(defaultData, null, 2)
    );
    return;
  }

  try {
    JSON.parse(
      fs.readFileSync(path, 'utf8')
    );
  } catch {
    fs.writeFileSync(
      path,
      JSON.stringify(defaultData, null, 2)
    );
  }
}

function loadPartnerChannels() {
  ensureJsonFile(
    CHANNELS_PATH,
    DEFAULT_PARTNER_CHANNELS
  );

  return JSON.parse(
    fs.readFileSync(
      CHANNELS_PATH,
      'utf8'
    )
  );
}

function savePartnerChannels(data) {
  ensureJsonFile(
    CHANNELS_PATH,
    DEFAULT_PARTNER_CHANNELS
  );

  fs.writeFileSync(
    CHANNELS_PATH,
    JSON.stringify(data, null, 2)
  );
}

function loadPartnerSentEpisodes() {
  ensureJsonFile(
    SENT_PATH,
    {}
  );

  return JSON.parse(
    fs.readFileSync(
      SENT_PATH,
      'utf8'
    )
  );
}

function savePartnerSentEpisodes(data) {
  ensureJsonFile(
    SENT_PATH,
    {}
  );

  fs.writeFileSync(
    SENT_PATH,
    JSON.stringify(data, null, 2)
  );
}

module.exports = {
  DEFAULT_PARTNER_CHANNELS,
  loadPartnerChannels,
  loadPartnerSentEpisodes,
  savePartnerChannels,
  savePartnerSentEpisodes
};
