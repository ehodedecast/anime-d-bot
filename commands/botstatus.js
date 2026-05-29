const fs = require('fs');
const {
  version: discordVersion
} = require('discord.js');

const {
  loadAnimeData
} = require('../utils/animeStorage');

const {
  loadConfig
} = require('../utils/config');

const {
  loadCache
} = require('../utils/cacheManager');

const runtimeStatus =
  require('../state/runtimeStatus');

function formatDuration(ms) {

  if (!ms) {
    return '0s';
  }

  const totalSeconds =
    Math.floor(ms / 1000);

  const days =
    Math.floor(totalSeconds / 86400);

  const hours =
    Math.floor((totalSeconds % 86400) / 3600);

  const minutes =
    Math.floor((totalSeconds % 3600) / 60);

  return [
    days ? `${days}d` : null,
    hours ? `${hours}h` : null,
    minutes ? `${minutes}m` : null
  ].filter(Boolean).join(' ') || `${totalSeconds}s`;
}

function getEnvironment() {

  if (
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID
  ) {
    return 'Railway';
  }

  return 'local';
}

function getRailwayVolumeStatus() {

  const volumePath =
    process.env.RAILWAY_VOLUME_MOUNT_PATH;

  if (!volumePath) {
    return 'not configured';
  }

  return fs.existsSync(volumePath)
    ? `detected (${volumePath})`
    : `configured but missing (${volumePath})`;
}

function getStorageStatus() {

  const files = [
    './data/animes.json',
    './data/config.json',
    './data/animeCache.json',
    './data/sentEpisodes.json',
    './data/analytics.json',
    './data/votes.json'
  ];

  const missing = [];
  const invalid = [];

  files.forEach(file => {

    if (!fs.existsSync(file)) {
      missing.push(file);
      return;
    }

    try {
      JSON.parse(
        fs.readFileSync(file, 'utf8')
      );
    } catch {
      invalid.push(file);
    }
  });

  if (invalid.length) {
    return `invalid JSON: ${invalid.length}`;
  }

  if (missing.length) {
    return `missing files: ${missing.length}`;
  }

  return 'ok';
}

function getAnimeStats(animeData) {

  const allAnime = [];

  Object.values(animeData)
    .forEach(guild => {

      (guild.anime || [])
        .forEach(anime => {
          allAnime.push(anime);
        });
    });

  const uniqueIds =
    new Set(
      allAnime
        .map(anime => anime.id)
        .filter(Boolean)
    );

  const followed = {};

  allAnime.forEach(anime => {

    const key =
      anime.id || anime.title;

    if (!followed[key]) {
      followed[key] = {
        title: anime.title || 'Unknown',
        count: 0
      };
    }

    followed[key].count++;
  });

  return {
    total: allAnime.length,
    unique: uniqueIds.size,
    tracking:
      allAnime.filter(anime => anime.mode === 'tracking').length,
    library:
      allAnime.filter(anime => anime.mode !== 'tracking').length,
    invalid:
      allAnime.filter(anime => anime.invalid).length,
    topAnime:
      Object.values(followed)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
  };
}

function getTopServers(animeData) {

  return Object.entries(animeData)
    .map(([guildId, guild]) => ({
      name: guild.guildName || guildId,
      count: (guild.anime || []).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

function formatTop(items) {

  if (!items.length) {
    return 'none';
  }

  return items
    .map((item, index) =>
      `${index + 1}. ${item.title || item.name} (${item.count})`
    )
    .join('\n');
}

async function botstatus(
  message,
  client
) {

  const animeData =
    loadAnimeData();

  const config =
    loadConfig();

  const cache =
    loadCache();

  const animeStats =
    getAnimeStats(animeData);

  const currentGuildConfig =
    config[message.guild?.id];

  const totalMembers =
    client.guilds.cache.reduce(
      (total, guild) =>
        total + (guild.memberCount || 0),
      0
    );

  const topgg =
    runtimeStatus.topggServer;

  const tracker =
    runtimeStatus.tracker;

  const statusText = [
    'BOT STATUS',
    '',
    `Bot: ${client.isReady() ? 'online' : 'offline'}`,
    `Uptime: ${formatDuration(client.uptime)}`,
    `Ping: ${client.ws.ping}ms`,
    `Node.js: ${process.version}`,
    `discord.js: ${discordVersion}`,
    `Environment: ${getEnvironment()}`,
    `Railway volume: ${getRailwayVolumeStatus()}`,
    '',
    `Servers: ${client.guilds.cache.size}`,
    `Approx users: ${totalMembers}`,
    `Global anime: ${animeStats.total}`,
    `Unique anime: ${animeStats.unique}`,
    `Tracking: ${animeStats.tracking}`,
    `Library: ${animeStats.library}`,
    `Invalid/quarantined: ${animeStats.invalid}`,
    `Current server channel: ${currentGuildConfig?.channelId || 'not configured'}`,
    '',
    `Last tracker check: ${tracker.lastFinishedAt || 'not available'}`,
    `Cache updated: ${cache.lastGlobalUpdate || 'not available'}`,
    `Cache total: ${Object.keys(cache.animes || {}).length}`,
    `Cache hits: ${cache.stats?.cacheHits || 0}`,
    `Cache misses: ${cache.stats?.cacheMisses || 0}`,
    '',
    'Top anime:',
    formatTop(animeStats.topAnime),
    '',
    'Top servers:',
    formatTop(getTopServers(animeData)),
    '',
    `Top.gg server: ${topgg.started ? `online on port ${topgg.port}` : 'offline'}${topgg.error ? ` (${topgg.error})` : ''}`,
    `Storage: ${getStorageStatus()}`,
    `Tracker: ${tracker.lastError ? `error (${tracker.lastError})` : 'ok'}`
  ].join('\n');

  await message.author.send(
    `\`\`\`\n${statusText.slice(0, 1900)}\n\`\`\``
  );

  return message.reply(
    'Status enviado no seu PV.'
  );
}

module.exports =
  botstatus;
