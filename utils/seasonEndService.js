const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags
} = require('discord.js');

const {
  tUser
} = require('./language');

const {
  loadUserAnimes,
  saveUserAnimes,
  userAnimeAlreadyExists
} = require('./userAnimeStorage');

const {
  loadUserProfiles,
  saveUserProfiles
} = require('./userProfileStorage');

const {
  saveAnimeToCache
} = require('./animeCacheService');

const {
  createNotificationSettingsRow
} = require('./notificationSettings');

const SEASON_SEQUEL_ADD_PREFIX =
  'season_sequel_add';

const SEASON_SEQUEL_DECLINE_PREFIX =
  'season_sequel_decline';

const SUPPORTED_SEQUEL_FORMATS =
  new Set([
    'TV',
    'TV_SHORT',
    'ONA',
    'OVA',
    'MOVIE',
    'SPECIAL'
  ]);

function getAnimeTitle(
  anime
) {

  return (
    anime?.title?.romaji ||
    anime?.title ||
    'Unknown'
  );
}

function isFinalEpisode(
  anime
) {

  const episode =
    Number(
      anime?.nextAiringEpisode?.episode
    );

  const totalEpisodes =
    Number(
      anime?.episodes
    );

  return (
    Number.isFinite(episode) &&
    Number.isFinite(totalEpisodes) &&
    totalEpisodes > 0 &&
    episode === totalEpisodes
  );
}

function isSupportedSequelNode(
  node
) {

  return (
    node?.type === 'ANIME' &&
    SUPPORTED_SEQUEL_FORMATS.has(
      node?.format
    ) &&
    node?.id &&
    getAnimeTitle(node) !== 'Unknown'
  );
}

function getSequelCandidate(
  anime
) {

  const edges =
    anime?.relations?.edges;

  if (
    !Array.isArray(edges)
  ) {
    return null;
  }

  const edge =
    edges.find(item =>
      item?.relationType === 'SEQUEL' &&
      isSupportedSequelNode(
        item?.node
      )
    );

  if (
    !edge
  ) {
    return null;
  }

  return {
    id:
      edge.node.id,
    title:
      getAnimeTitle(edge.node),
    coverImage:
      edge.node.coverImage?.large ||
      edge.node.coverImage?.medium ||
      null,
    mode:
      edge.node.nextAiringEpisode
        ? 'tracking'
        : 'library',
    raw:
      edge.node
  };
}

function getPromptKey({
  animeId,
  episode
}) {

  return `${animeId}:${episode}`;
}

function getSeasonEndPrompt(
  profiles,
  userId,
  animeId,
  episode
) {

  profiles[userId] =
    profiles[userId] || {};

  profiles[userId].seasonEndPrompts =
    profiles[userId].seasonEndPrompts || {};

  const promptKey =
    getPromptKey({
      animeId,
      episode
    });

  return {
    promptKey,
    entry:
      profiles[userId].seasonEndPrompts[promptKey]
  };
}

function markSeasonEndPrompt({
  userId,
  username,
  anime,
  episode,
  sequel,
  decision = 'pending'
}) {

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

  profiles[userId].seasonEndPrompts =
    profiles[userId].seasonEndPrompts || {};

  const promptKey =
    getPromptKey({
      animeId:
        anime.id,
      episode
    });

  profiles[userId]
    .seasonEndPrompts[promptKey] = {
      animeId:
        anime.id,
      animeTitle:
        getAnimeTitle(anime),
      episode,
      sequelId:
        sequel?.id || null,
      sequelTitle:
        sequel?.title || null,
      sequelCoverImage:
        sequel?.coverImage || null,
      sequelMode:
        sequel?.mode || 'tracking',
      promptedAt:
        new Date().toISOString(),
      decision
    };

  saveUserProfiles(
    profiles
  );
}

function createSeasonEndButtons({
  userId,
  animeId,
  episode,
  sequelId,
  guildId = null
}) {

  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          `${SEASON_SEQUEL_ADD_PREFIX}:${userId}:${animeId}:${episode}:${sequelId}`
        )
        .setLabel(
          tUser(
            userId,
            'season_end_add_sequel',
            guildId
          )
        )
        .setStyle(
          ButtonStyle.Success
        ),
      new ButtonBuilder()
        .setCustomId(
          `${SEASON_SEQUEL_DECLINE_PREFIX}:${userId}:${animeId}:${episode}:${sequelId}`
        )
        .setLabel(
          tUser(
            userId,
            'season_end_not_now',
            guildId
          )
        )
        .setStyle(
          ButtonStyle.Secondary
        )
    );
}

async function sendSeasonEndPrompt({
  client,
  userId,
  username,
  anime,
  sequel,
  guildId = null,
  options = {}
}) {

  if (
    !isFinalEpisode(anime)
  ) {
    return false;
  }

  const episode =
    anime.nextAiringEpisode.episode;

  const profiles =
    loadUserProfiles();

  const {
    entry
  } = getSeasonEndPrompt(
    profiles,
    userId,
    anime.id,
    episode
  );

  if (
    entry
  ) {
    return false;
  }

  const userData =
    loadUserAnimes()[userId];

  const animeList =
    userData?.anime || [];

  if (
    sequel &&
    userAnimeAlreadyExists(
      animeList,
      sequel.id
    )
  ) {
    markSeasonEndPrompt({
      userId,
      username,
      anime,
      episode,
      sequel,
      decision:
        'already_added'
    });

    return false;
  }

  const user =
    await client.users.fetch(
      userId
    );

  if (
    sequel
  ) {
    await user.send({
      content:
        [
          tUser(
            userId,
            'season_end_finished',
            guildId
          ).replace(
            '{anime}',
            getAnimeTitle(anime)
          ),
          '',
          tUser(
            userId,
            'season_end_found_sequel',
            guildId
          ).replace(
            '{sequel}',
            sequel.title
          ),
          '',
          tUser(
            userId,
            'season_end_ask_add',
            guildId
          )
        ].join('\n'),
      components: [
        createSeasonEndButtons({
          userId,
          animeId:
            anime.id,
          episode,
          sequelId:
            sequel.id,
          guildId
        }),
        createNotificationSettingsRow({
          userId,
          guildId
        })
      ]
    });

    if (
      !options.testUserId
    ) {
      markSeasonEndPrompt({
        userId,
        username,
        anime,
        episode,
        sequel,
        decision:
          'pending'
      });
    }

    return true;
  }

  await user.send({
    content:
      [
        tUser(
          userId,
          'season_end_finished',
          guildId
        ).replace(
          '{anime}',
          getAnimeTitle(anime)
        ),
        '',
        tUser(
          userId,
          'season_end_no_sequel',
          guildId
        )
      ].join('\n'),
    components: [
      createNotificationSettingsRow({
        userId,
        guildId
      })
    ]
  });

  if (
    !options.testUserId
  ) {
    markSeasonEndPrompt({
      userId,
      username,
      anime,
      episode,
      sequel: null,
      decision:
        'no_sequel'
    });
  }

  return true;
}

function parseSeasonEndCustomId(
  customId
) {

  const [
    action,
    userId,
    animeId,
    episode,
    sequelId
  ] = String(customId || '')
    .split(':');

  return {
    action,
    userId,
    animeId,
    episode,
    sequelId
  };
}

function findSequelInProfile(
  userId,
  animeId,
  episode,
  sequelId
) {

  const profiles =
    loadUserProfiles();

  const {
    entry
  } = getSeasonEndPrompt(
    profiles,
    userId,
    animeId,
    episode
  );

  if (
    !entry ||
    String(entry.sequelId) !== String(sequelId)
  ) {
    return null;
  }

  return entry;
}

function updateSeasonEndDecision({
  userId,
  animeId,
  episode,
  decision
}) {

  const profiles =
    loadUserProfiles();

  const {
    promptKey,
    entry
  } = getSeasonEndPrompt(
    profiles,
    userId,
    animeId,
    episode
  );

  if (
    !entry
  ) {
    return null;
  }

  profiles[userId]
    .seasonEndPrompts[promptKey] = {
      ...entry,
      decision,
      decidedAt:
        new Date().toISOString()
    };

  saveUserProfiles(
    profiles
  );

  return profiles[userId]
    .seasonEndPrompts[promptKey];
}

function addSequelToUserList({
  userId,
  username,
  sequel
}) {

  const data =
    loadUserAnimes();

  data[userId] =
    data[userId] || {
      username,
      anime: []
    };

  data[userId].username =
    username ||
    data[userId].username ||
    'Unknown User';

  data[userId].anime =
    Array.isArray(data[userId].anime)
      ? data[userId].anime
      : [];

  if (
    userAnimeAlreadyExists(
      data[userId].anime,
      sequel.id
    )
  ) {
    return {
      added: false,
      alreadyExists: true
    };
  }

  data[userId].anime.push({
    id:
      sequel.id,
    title:
      sequel.title,
    coverImage:
      sequel.coverImage || null,
    mode:
      sequel.mode || 'tracking'
  });

  saveUserAnimes(
    data
  );

  saveAnimeToCache(
    sequel.raw || sequel
  );

  return {
    added: true,
    alreadyExists: false
  };
}

async function handleSeasonEndButton(
  interaction
) {

  const parsed =
    parseSeasonEndCustomId(
      interaction.customId
    );

  if (
    interaction.user.id !== parsed.userId
  ) {
    return interaction.reply({
      content:
        tUser(
          interaction.user.id,
          'no_permission',
          interaction.guild?.id || null
        ),
      flags:
        MessageFlags.Ephemeral
    });
  }

  const entry =
    findSequelInProfile(
      parsed.userId,
      parsed.animeId,
      parsed.episode,
      parsed.sequelId
    );

  if (
    !entry
  ) {
    return interaction.reply({
      content:
        tUser(
          interaction.user.id,
          'season_end_no_pending_prompt',
          interaction.guild?.id || null
        ),
      flags:
        MessageFlags.Ephemeral
    });
  }

  if (
    parsed.action === SEASON_SEQUEL_DECLINE_PREFIX
  ) {
    updateSeasonEndDecision({
      userId:
        parsed.userId,
      animeId:
        parsed.animeId,
      episode:
        parsed.episode,
      decision:
        'declined'
    });

    return interaction.update({
      content:
        tUser(
          interaction.user.id,
          'season_end_declined',
          interaction.guild?.id || null
        ),
      components: []
    });
  }

  const sequel = {
    id:
      Number(parsed.sequelId),
    title:
      entry.sequelTitle,
    coverImage:
      entry.sequelCoverImage || null,
    mode:
      entry.sequelMode ||
      'tracking'
  };

  const result =
    addSequelToUserList({
      userId:
        parsed.userId,
      username:
        interaction.user.username,
      sequel
    });

  updateSeasonEndDecision({
    userId:
      parsed.userId,
    animeId:
      parsed.animeId,
    episode:
      parsed.episode,
    decision:
      result.alreadyExists
        ? 'already_added'
        : 'accepted'
  });

  return interaction.update({
    content:
      tUser(
        interaction.user.id,
        result.alreadyExists
          ? 'season_end_already_in_list'
          : 'season_end_added',
        interaction.guild?.id || null
      ),
    components: []
  });
}

module.exports = {
  SEASON_SEQUEL_ADD_PREFIX,
  SEASON_SEQUEL_DECLINE_PREFIX,
  addSequelToUserList,
  getSequelCandidate,
  handleSeasonEndButton,
  isFinalEpisode,
  sendSeasonEndPrompt
};
