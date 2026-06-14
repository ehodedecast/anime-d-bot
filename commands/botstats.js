const fs = require('fs');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  version: discordVersion,
  MessageFlags
} = require('discord.js');

const {
  loadUserAnimes
} = require('../utils/userAnimeStorage');

const {
  loadConfig
} = require('../utils/config');

const {
  loadCache
} = require('../utils/cacheManager');

const {
  loadVotes
} = require('../utils/voteStorage');

const runtimeStatus =
  require('../state/runtimeStatus');

const BOTSTATS_CHANNEL_ID =
  '1511002770532995112';

const BOTSTATS_REFRESH_CUSTOM_ID =
  'botstats_refresh';

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

function getUserAnimeEntries(
  userAnimeData
) {

  const entries = [];

  Object.entries(userAnimeData || {})
    .forEach(([userId, userData]) => {

      const animeList =
        Array.isArray(userData)
          ? userData
          : userData?.anime || [];

      animeList
        .forEach(anime => {
          entries.push({
            userId,
            username:
              userData?.username ||
              'Unknown User',
            anime
          });
        });
    });

  return entries;
}

function getAnimeStats(userAnimeData) {

  const entries =
    getUserAnimeEntries(
      userAnimeData
    );

  const allAnime =
    entries.map(entry =>
      entry.anime
    );

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

function getTopUsers(userAnimeData) {

  return Object.entries(userAnimeData || {})
    .map(([userId, userData]) => {

      const animeList =
        Array.isArray(userData)
          ? userData
          : userData?.anime || [];

      return {
        userId,
        username:
          userData?.username ||
          'Unknown User',
        count:
          animeList.length
      };
    })
    .filter(user =>
      user.count > 0
    )
    .sort((a, b) =>
      b.count - a.count
    )
    .slice(0, 10);
}

function getUserStats(userAnimeData) {

  const users =
    Object.entries(userAnimeData || {});

  const usersWithAnime =
    users.filter(([, userData]) => {

      const animeList =
        Array.isArray(userData)
          ? userData
          : userData?.anime || [];

      return animeList.length > 0;
    });

  return {
    total:
      users.length,
    withAnime:
      usersWithAnime.length
  };
}

function formatTopAnime(items) {

  if (!items.length) {
    return 'none';
  }

  return items
    .map((item, index) =>
      `${index + 1}. ${item.title} (${item.count})`
    )
    .join('\n');
}

function formatTopUsers(items) {

  if (!items.length) {
    return 'none';
  }

  return items
    .map((item, index) => (
      `${index + 1}. ${item.username} ` +
      `(${item.userId}) - ${item.count}`
    ))
    .join('\n');
}

function safeLoadVotes() {

  try {
    return loadVotes();
  } catch {
    return {};
  }
}

function getValidVoteEntries(
  votes
) {

  return Object.entries(votes || {})
    .map(([userId, data]) => ({
      userId,
      totalVotes:
        Number(data?.totalVotes)
    }))
    .filter(entry =>
      entry.userId &&
      Number.isFinite(entry.totalVotes) &&
      entry.totalVotes > 0
    )
    .sort((a, b) =>
      b.totalVotes - a.totalVotes
    );
}

async function fetchVoteUsername(
  client,
  userId
) {

  try {
    if (
      !client?.users?.fetch
    ) {
      return 'Unknown User';
    }

    const user =
      await client.users.fetch(
        userId
      );

    return (
      user?.username ||
      user?.tag ||
      'Unknown User'
    );
  } catch {
    return 'Unknown User';
  }
}

async function getTopVotersStats(
  client,
  votes
) {

  const entries =
    getValidVoteEntries(
      votes
    );

  const topEntries =
    entries.slice(
      0,
      10
    );

  const topVoters =
    await Promise.all(
      topEntries.map(async entry => ({
        ...entry,
        username:
          await fetchVoteUsername(
            client,
            entry.userId
          )
      }))
    );

  return {
    topVoters,
    totalVoters:
      entries.length,
    totalVotes:
      entries.reduce(
        (sum, entry) =>
          sum + entry.totalVotes,
        0
      )
  };
}

function formatTopVoters(
  items
) {

  if (
    !items.length
  ) {
    return 'No votes registered yet.';
  }

  return items
    .map((item, index) =>
      `${index + 1}. ${item.username} ` +
      `(${item.userId}) \u2014 ${item.totalVotes} votes`
    )
    .join('\n');
}

function createBotStatsRefreshRow() {

  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          BOTSTATS_REFRESH_CUSTOM_ID
        )
        .setLabel(
          'Refresh'
        )
        .setStyle(
          ButtonStyle.Primary
        )
    );
}

async function botstats(
  message,
  client
) {

  const userAnimeData =
    loadUserAnimes();

  const config =
    loadConfig();

  const cache =
    loadCache();

  const votes =
    safeLoadVotes();

  const voterStats =
    await getTopVotersStats(
      client,
      votes
    );

  const animeStats =
    getAnimeStats(userAnimeData);

  const userStats =
    getUserStats(userAnimeData);

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
    '',
    `Total voters: ${voterStats.totalVoters}`,
    `Total votes: ${voterStats.totalVotes}`,
    '',
    'Top 10 Voters',
    '',
    formatTopVoters(
      voterStats.topVoters
    ),
    '',
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
    formatTopAnime(animeStats.topAnime),
    '',
    `AnimeDBot users: ${userStats.total}`,
    `Users with anime: ${userStats.withAnime}`,
    '',
    'Top users:',
    formatTopUsers(
      getTopUsers(userAnimeData)
    ),
    '',
    `Top.gg server: ${topgg.started ? `online on port ${topgg.port}` : 'offline'}${topgg.error ? ` (${topgg.error})` : ''}`,
    `Storage: ${getStorageStatus()}`,
    `Tracker: ${tracker.lastError ? `error (${tracker.lastError})` : 'ok'}`
  ].join('\n');

  try {

  const channel =
    await client.channels.fetch(
      BOTSTATS_CHANNEL_ID
    );

  await channel.send({
    content:
      `\`\`\`\n${statusText.slice(0, 1900)}\n\`\`\``,
    components: [
      createBotStatsRefreshRow()
    ]
  });

  return message.reply({
    content:
      `Status enviado em botstats.`,
    flags: MessageFlags.Ephemeral
  });

} catch {

  return message.reply({
    content:
      `Não consegui enviar o status no canal botstats.`,
    flags: MessageFlags.Ephemeral
  });
}
}

module.exports =
  botstats;
module.exports.BOTSTATS_REFRESH_CUSTOM_ID =
  BOTSTATS_REFRESH_CUSTOM_ID;
