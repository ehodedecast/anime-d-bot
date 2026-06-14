const fs = require('fs');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  version: discordVersion,
  MessageFlags,
  SeparatorBuilder,
  TextDisplayBuilder
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

function createTextDisplay(
  content
) {

  return new TextDisplayBuilder()
    .setContent(
      content
    );
}

function formatHealthStatus(
  label,
  value
) {

  return `**${label}:** ${value}`;
}

function createBotStatsPanel({
  client,
  totalMembers,
  voterStats,
  animeStats,
  userStats,
  currentGuildConfig,
  cache,
  topgg,
  tracker,
  topUsers
}) {

  const systemLines = [
    '## AnimeDBot Control Center',
    '',
    `\u{1F7E2} **System**`,
    formatHealthStatus(
      'Bot',
      client.isReady() ? 'Online' : 'Offline'
    ),
    formatHealthStatus(
      'Uptime',
      formatDuration(client.uptime)
    ),
    formatHealthStatus(
      'Ping',
      `${client.ws.ping}ms`
    ),
    formatHealthStatus(
      'Node.js',
      process.version
    ),
    formatHealthStatus(
      'discord.js',
      discordVersion
    ),
    formatHealthStatus(
      'Environment',
      getEnvironment()
    ),
    formatHealthStatus(
      'Railway volume',
      getRailwayVolumeStatus()
    ),
    '',
    `\u{1F4C8} **Growth**`,
    formatHealthStatus(
      'Servers',
      client.guilds.cache.size
    ),
    formatHealthStatus(
      'Approx users',
      totalMembers
    ),
    formatHealthStatus(
      'AnimeDBot users',
      userStats.total
    ),
    formatHealthStatus(
      'Users with anime',
      userStats.withAnime
    )
  ].join('\n');

  const votesLines = [
    `\u{1F5F3}\uFE0F **Votes**`,
    formatHealthStatus(
      'Total voters',
      voterStats.totalVoters
    ),
    formatHealthStatus(
      'Total votes',
      voterStats.totalVotes
    ),
    '',
    `\u{1F3C6} **Top 10 Voters**`,
    formatTopVoters(
      voterStats.topVoters
    )
  ].join('\n');

  const animeLines = [
    `\u{1F4FA} **Anime Tracking**`,
    formatHealthStatus(
      'Global anime',
      animeStats.total
    ),
    formatHealthStatus(
      'Unique anime',
      animeStats.unique
    ),
    formatHealthStatus(
      'Tracking',
      animeStats.tracking
    ),
    formatHealthStatus(
      'Library',
      animeStats.library
    ),
    formatHealthStatus(
      'Invalid/quarantined',
      animeStats.invalid
    ),
    formatHealthStatus(
      'Current server channel',
      currentGuildConfig?.channelId || 'not configured'
    ),
    '',
    `\u{1F525} **Top Anime**`,
    formatTopAnime(
      animeStats.topAnime
    )
  ].join('\n');

  const userLines = [
    `\u{1F465} **Top Users**`,
    formatTopUsers(
      topUsers
    )
  ].join('\n');

  const cacheLines = [
    `\u26A1 **Cache**`,
    formatHealthStatus(
      'Last tracker check',
      tracker.lastFinishedAt || 'not available'
    ),
    formatHealthStatus(
      'Cache updated',
      cache.lastGlobalUpdate || 'not available'
    ),
    formatHealthStatus(
      'Cache total',
      Object.keys(cache.animes || {}).length
    ),
    formatHealthStatus(
      'Cache hits',
      cache.stats?.cacheHits || 0
    ),
    formatHealthStatus(
      'Cache misses',
      cache.stats?.cacheMisses || 0
    )
  ].join('\n');

  const healthLines = [
    `\u{1FA7A} **Health**`,
    formatHealthStatus(
      'Top.gg server',
      `${topgg.started ? `online on port ${topgg.port}` : 'offline'}${topgg.error ? ` (${topgg.error})` : ''}`
    ),
    formatHealthStatus(
      'Storage',
      getStorageStatus()
    ),
    formatHealthStatus(
      'Tracker',
      tracker.lastError ? `error (${tracker.lastError})` : 'ok'
    )
  ].join('\n');

  const container =
    new ContainerBuilder()
      .setAccentColor(0xff6600)
      .addTextDisplayComponents(
        createTextDisplay(
          systemLines
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
      )
      .addTextDisplayComponents(
        createTextDisplay(
          votesLines
        ),
        createTextDisplay(
          animeLines
        ),
        createTextDisplay(
          userLines
        ),
        createTextDisplay(
          cacheLines
        ),
        createTextDisplay(
          healthLines
        )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
      )
      .addActionRowComponents(
        createBotStatsRefreshRow()
      );

  return {
    flags:
      MessageFlags.IsComponentsV2,
    components: [
      container
    ]
  };
}

async function botstats(
  message,
  client,
  options = {}
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

  const topUsers =
    getTopUsers(
      userAnimeData
    );

  const payload =
    createBotStatsPanel({
      client,
      totalMembers,
      voterStats,
      animeStats,
      userStats,
      currentGuildConfig,
      cache,
      topgg,
      tracker,
      topUsers
    });

  try {

  const channel =
    await client.channels.fetch(
      BOTSTATS_CHANNEL_ID
    );

  await channel.send(
    payload
  );

  return {
    sent: true
  };

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
