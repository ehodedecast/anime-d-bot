const chalk = require('chalk').default;

const list =
  require('../commands/list');

const next =
  require('../commands/next');

const clear =
  require('../commands/clear');

const help =
  require('../commands/help');

const sendMenu =
  require('./menu');

const add =
  require('../commands/add');

const info =
  require('../commands/info');

const remove =
  require('../commands/remove');

const {
  t,
  tUser,
  normalizeLanguage
} = require('../utils/language');

const {
  loadConfig,
  saveConfig
} = require('../utils/config');

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits
} = require('discord.js');

const state =
  require('../state/state');

const {
  createAnimeNameModal
} = require('../utils/modals');

const {
  createInteractionMessage
} = require('../utils/interactionAdapter');

const {
  getUserAnimeList
} = require('../utils/userAnimeStorage');

const {
  applyRepair,
  rejectRepair
} = require('../utils/repairInvalidAnime');

const {
  createWatchReadyRow,
  createWatchedRow,
  parseWatchCustomId
} = require('../utils/episodeActionButtons');

const {
  setUserLanguage,
  getEpisodeProgress,
  markEpisodeOpened,
  markEpisodeWatched
} = require('../utils/userProfileStorage');

function getOwnerId() {

  return (
    process.env.OWNER_ID ||
    process.env.BOT_OWNER_ID
  );
}

function isBotOwner(
  interaction
) {

  const ownerId =
    getOwnerId();

  return Boolean(
    ownerId &&
    interaction.user.id === ownerId
  );
}

function getWatchTarget(
  parsed
) {

  const progress =
    getEpisodeProgress({
      userId:
        parsed.userId,
      animeId:
        parsed.animeId,
      episode:
        parsed.episode
    });

  const url =
    progress?.watchIsStreaming
      ? progress?.watchUrl || null
      : null;

  return {
    url,
    label:
      progress?.watchLabel ||
      t(
        null,
        'watch_again_button'
      ),
    isStreaming:
      Boolean(
        progress?.watchIsStreaming &&
        progress?.watchUrl
      ),
    officialSiteUrl:
      progress?.officialSiteUrl ||
      null
  };
}

function validateWatchButtonOwner(
  interaction,
  parsed
) {

  if (
    parsed.userId !==
    interaction.user.id
  ) {

    return interaction.reply({
      content:
        'Este botao pertence a outro usuario.',
      flags: MessageFlags.Ephemeral
    });
  }

  return null;
}

function clearUserStates(
  userId
) {

  delete state.waitingForAdd?.[
    userId
  ];

  delete state.waitingForNext?.[
    userId
  ];

  delete state.waitingForInfo?.[
    userId
  ];

  delete state.waitingForRemove?.[
    userId
  ];

  delete state.waitingForAddSelection?.[
    userId
  ];

  delete state.waitingForAnimeSelection?.[
    userId
  ];

  delete state.nextPagination?.[
    userId
  ];
}

function createReplyAdapter(
  interaction
) {

  return {
    reply: (msg) =>
      interaction.editReply(msg),

    guild:
      interaction.guild,

    author:
      interaction.user
  };
}

function createSelectionReplyAdapter(
  interaction
) {

  return {
    ...createInteractionMessage(
      interaction
    ),

    reply: (msg) => {

      if (
        typeof msg === 'string'
      ) {

        return interaction.editReply({
          content: msg,
          embeds: [],
          components: []
        });
      }

      return interaction.editReply({
        embeds: [],
        components: [],
        ...msg
      });
    }
  };
}

function beginAddFlow(
  interaction,
  guildId
) {

  clearUserStates(
    interaction.user.id
  );

  return interaction.showModal(
    createAnimeNameModal(
      'modal_add_anime',
      'Adicionar Anime',
      t(guildId, 'prompt_type_anime_name')
    )
  );
}

function beginInfoFlow(
  interaction,
  guildId
) {

  clearUserStates(
    interaction.user.id
  );

  return interaction.showModal(
    createAnimeNameModal(
      'modal_info_anime',
      'Pesquisar Anime',
      t(guildId, 'prompt_type_anime_name')
    )
  );
}

function beginRemoveFlow(
  interaction,
  guildId
) {

  clearUserStates(
    interaction.user.id
  );

  return interaction.showModal(
    createAnimeNameModal(
      'modal_remove_anime',
      'Remover Anime',
      t(guildId, 'prompt_type_anime_name')
    )
  );
}

async function handleAnimeModal(
  interaction,
  client
) {

  const animeName =
    interaction.fields.getTextInputValue(
      'anime_name'
    );

  const message =
    createInteractionMessage(
      interaction
    );

  if (
    interaction.customId === 'modal_add_anime'
  ) {

    await interaction.deferReply();

    return add(
      message,
      getUserAnimeList(
        interaction.user.id,
        interaction.user.username
      ),
      animeName
    );
  }

  if (
    interaction.customId === 'modal_info_anime'
  ) {

    await interaction.deferReply();

    return info(
      message,
      animeName
    );
  }

  if (
    interaction.customId === 'modal_remove_anime'
  ) {

    return remove(
      message,
      animeName
    );
  }
}

module.exports = async (
  interaction,
  animeList,
  client
) => {

  if (
    interaction.isModalSubmit?.()
  ) {

    return handleAnimeModal(
      interaction,
      client
    );
  }

  if (
    interaction.customId?.startsWith(
      'repair_apply_'
    )
  ) {

    if (
      !isBotOwner(
        interaction
      )
    ) {

      return interaction.reply({
        content:
          'Você não tem permissão para utilizar este botão.',
        flags: MessageFlags.Ephemeral
      });
    }

    const parts =
      interaction.customId.split('_');

    const brokenId =
      parts[2];

    const candidateId =
      parts[3];

    await interaction.deferUpdate();

    const result =
      await applyRepair(
        brokenId,
        candidateId
      );

    return interaction.editReply({
      content:
        `Repair approved.\n\nApplied to ${result.applied} user lists.\nNew anime: ${result.title || candidateId}`,
      components: []
    });
  }

  if (
    interaction.customId?.startsWith(
      'repair_reject_'
    )
  ) {

    if (
      !isBotOwner(
        interaction
      )
    ) {

      return interaction.reply({
        content:
          'Você não tem permissão para utilizar este botão.',
        flags: MessageFlags.Ephemeral
      });
    }

    const brokenId =
      interaction.customId
        .split('_')[2];

    await interaction.deferUpdate();

    const rejected =
      rejectRepair(
        brokenId
      );

    return interaction.editReply({
      content:
        `Repair rejected.\n\nKept ${rejected} quarantined entries unchanged.`,
      components: []
    });
  }

  if (
    interaction.customId?.startsWith(
      'watch_open:'
    )
  ) {

    const parsed =
      parseWatchCustomId(
        interaction.customId
      );

    const blocked =
      validateWatchButtonOwner(
        interaction,
        parsed
      );

    if (blocked) {
      return blocked;
    }

    const watchTarget =
      getWatchTarget(
        parsed
      );

    if (
      !watchTarget.isStreaming
    ) {
      return interaction.reply({
        content:
          tUser(
            interaction.user.id,
            'watch_link_not_found_notice'
          ),
        flags: MessageFlags.Ephemeral
      });
    }

    markEpisodeOpened({
      userId:
        parsed.userId,
      username:
        interaction.user.username,
      animeId:
        parsed.animeId,
      episode:
        parsed.episode
    });

    return interaction.update({
      components: [
        createWatchReadyRow({
          userId:
            parsed.userId,
          animeId:
            parsed.animeId,
          episode:
            parsed.episode,
          url:
            watchTarget.url,
          officialSiteUrl:
            watchTarget.officialSiteUrl,
          guildId:
            interaction.guild?.id ||
            null,
          userIdForLanguage:
            interaction.user.id
        })
      ]
    });
  }

  if (
    interaction.customId?.startsWith(
      'watch_done:'
    )
  ) {

    const parsed =
      parseWatchCustomId(
        interaction.customId
      );

    const blocked =
      validateWatchButtonOwner(
        interaction,
        parsed
      );

    if (blocked) {
      return blocked;
    }

    const progress =
      getEpisodeProgress({
        userId:
          parsed.userId,
        animeId:
          parsed.animeId,
        episode:
          parsed.episode
      });

    if (
      !progress?.openedAt
    ) {

      return interaction.reply({
        content:
          tUser(
            interaction.user.id,
            'watch_first_required'
          ),
        flags: MessageFlags.Ephemeral
      });
    }

    markEpisodeWatched({
      userId:
        parsed.userId,
      username:
        interaction.user.username,
      animeId:
        parsed.animeId,
      episode:
        parsed.episode
    });

    const watchTarget =
      getWatchTarget(
        parsed
      );

    const watchedRow =
      createWatchedRow({
        url:
          watchTarget.url,
        officialSiteUrl:
          watchTarget.officialSiteUrl,
        guildId:
          interaction.guild?.id ||
          null,
        userIdForLanguage:
          interaction.user.id
      });

    return interaction.update({
      content:
        `✅ ${tUser(
          interaction.user.id,
          'watch_marked'
        )}`,
      components:
        watchedRow
          ? [watchedRow]
          : []
    });
  }

  const guildId =
    interaction.guild.id;

  console.log(
    chalk.cyan(
      `[${interaction.guild.name}]`
    ) +
    chalk.gray(
      ` (${interaction.guild.id})`
    ) +
    chalk.yellow(
      ` ${interaction.user.username}`
    ) +
    ` clicou ${interaction.customId}`
  );

  if (
    interaction.customId.startsWith(
      'anime_select_'
    )
  ) {

    const selectionState =
      state.waitingForAnimeSelection?.[
        interaction.user.id
      ];

    if (
      !selectionState
    ) {

      return interaction.reply({
        content:
          t(
            guildId,
            'selection_expired'
          ),
        flags: MessageFlags.Ephemeral
      });
    }

    const selectedIndex =
      Number(
        interaction.customId
          .split('_')[2]
      );

    const selectedAnime =
      selectionState.results?.[
        selectedIndex
      ];

    if (
      !selectedAnime
    ) {

      return interaction.reply({
        content:
          t(
            guildId,
            'selection_invalid'
          ),
        flags: MessageFlags.Ephemeral
      });
    }

    clearUserStates(
      interaction.user.id
    );

    await interaction.deferUpdate();

    const message =
      createSelectionReplyAdapter(
        interaction
      );

    if (
      selectionState.action === 'add'
    ) {

      return add(
        message,
        getUserAnimeList(
          interaction.user.id,
          interaction.user.username
        ),
        selectedAnime.title,
        true,
        selectedAnime
      );
    }

    if (
      selectionState.action === 'info'
    ) {

      return info(
        message,
        selectedAnime.title,
        selectedAnime
      );
    }

    if (
      selectionState.action === 'remove'
    ) {

      return remove(
        message,
        selectedAnime.title,
        selectedAnime
      );
    }
  }

  if (
    interaction.customId.startsWith(
      'remove_confirm_'
    )
  ) {

    const selectionIndex =
      Number(
        interaction.customId
          .split('_')[2]
      );

    const selectionState =
      state.waitingForAnimeSelection?.[
        interaction.user.id
      ];

    const selectedAnime =
      selectionState?.results?.[
        selectionIndex
      ];

    if (
      !selectedAnime
    ) {

      return interaction.reply({
        content:
          'Anime nao encontrado na lista atual.',
        flags: MessageFlags.Ephemeral
      });
    }

    clearUserStates(
      interaction.user.id
    );

    await interaction.deferUpdate();

    return remove(
      createSelectionReplyAdapter(
        interaction
      ),
      selectedAnime.title,
      selectedAnime
    );
  }

  if (
    interaction.customId === 'remove_cancel'
  ) {

    clearUserStates(
      interaction.user.id
    );

    return interaction.update({
      content:
        'Remocao cancelada.',
      embeds: [],
      components: []
    });
  }

  if (
    interaction.customId === 'menu_back'
  ) {

    clearUserStates(
      interaction.user.id
    );

    return sendMenu(
      interaction
    );
  }

  if (
    [
      'profile_achievements',
      'profile_titles',
      'profile_history'
    ].includes(
      interaction.customId
    )
  ) {

    return interaction.reply({
      content:
        tUser(
          interaction.user.id,
          'profile_coming_soon'
        ),
      flags: MessageFlags.Ephemeral
    });
  }

  if (
    interaction.customId === 'menu_add' ||
    interaction.customId === 'add_again'
  ) {

    return beginAddFlow(
      interaction,
      guildId
    );
  }

  if (
    interaction.customId === 'menu_info' ||
    interaction.customId === 'info_again'
  ) {

    return beginInfoFlow(
      interaction,
      guildId
    );
  }

  if (
    interaction.customId === 'menu_remove' ||
    interaction.customId === 'remove_again'
  ) {

    return beginRemoveFlow(
      interaction,
      guildId
    );
  }

  if (
    interaction.customId.startsWith(
      'next_'
    )
  ) {

    let page = 0;

    if (
      interaction.customId.startsWith(
        'next_next_'
      )
    ) {

      page = Number(
        interaction.customId
          .split('_')[2]
      );
    }

    if (
      interaction.customId.startsWith(
        'next_prev_'
      )
    ) {

      page = Number(
        interaction.customId
          .split('_')[2]
      );
    }

    await interaction.deferUpdate();

    return next(
      createReplyAdapter(
        interaction
      ),
      getUserAnimeList(
        interaction.user.id,
        interaction.user.username
      ),
      page,
      {
        useStored: true
      }
    );
  }

  if (
    interaction.customId === 'menu_next'
  ) {

    clearUserStates(
      interaction.user.id
    );

    await interaction.deferReply();

    return next(
      createReplyAdapter(
        interaction
      ),
      getUserAnimeList(
        interaction.user.id,
        interaction.user.username
      )
    );
  }

  if (
    interaction.customId === 'menu_list'
  ) {

    clearUserStates(
      interaction.user.id
    );

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });

    return list(
      createReplyAdapter(
        interaction
      ),
      animeList
    );
  }

  if (
    interaction.customId === 'menu_clear'
  ) {

    const row =
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(
              'confirm_clear'
            )
            .setLabel(
              t(
                guildId,
                'clear_confirm_button'
              )
            )
            .setStyle(
              ButtonStyle.Danger
            ),
          new ButtonBuilder()
            .setCustomId(
              'cancel_clear'
            )
            .setLabel(
              t(
                guildId,
                'clear_cancel_button'
              )
            )
            .setStyle(
              ButtonStyle.Secondary
            )
        );

    return interaction.reply({
      content:
        t(
          guildId,
          'clear_warning'
        ),
      components: [row],
      flags: MessageFlags.Ephemeral
    });
  }

  if (
    interaction.customId === 'menu_help'
  ) {

    return help({
      reply: (msg) =>
        interaction.reply(msg),
      guild:
        interaction.guild
    });
  }

  if (
    interaction.customId === 'confirm_clear'
  ) {

    return clear(
      {
        reply: (msg) =>
          interaction.update({
            content: msg,
            components: []
          }),
        guild:
          interaction.guild,
        author:
          interaction.user
      },
      animeList
    );
  }

  if (
    interaction.customId === 'cancel_clear'
  ) {

    return interaction.update({
      content:
        t(
          guildId,
          'clear_cancelled'
        ),
      components: []
    });
  }

  if (
    interaction.customId === 'lang_pt' ||
    interaction.customId === 'lang_en' ||
    interaction.customId === 'lang_es'
  ) {

    if (
      !interaction.memberPermissions?.has(
        PermissionFlagsBits.ManageGuild
      )
    ) {
      return interaction.reply({
        content:
          t(
            guildId,
            'no_permission'
          ),
        flags: MessageFlags.Ephemeral
      });
    }

    const config =
      loadConfig();

    config[
      interaction.guild.id
    ] = config[
      interaction.guild.id
    ] || {};

    const language =
      interaction.customId.replace(
        'lang_',
        ''
      );

    config[
      interaction.guild.id
    ].language = language;

    saveConfig(config);

    return interaction.reply({
      content:
        t(
          guildId,
          'language.updated'
        ),
      flags: MessageFlags.Ephemeral
    });
  }

  if (
    interaction.customId === 'user_lang_pt' ||
    interaction.customId === 'user_lang_en' ||
    interaction.customId === 'user_lang_es'
  ) {

    const language =
      normalizeLanguage(
        interaction.customId.replace(
          'user_lang_',
          ''
        )
      );

    if (
      !language
    ) {
      return interaction.reply({
        content:
          tUser(
            interaction.user.id,
            'language.invalid',
            guildId
          ),
        flags: MessageFlags.Ephemeral
      });
    }

    setUserLanguage(
      interaction.user.id,
      interaction.user.username,
      language
    );

    return interaction.reply({
      content:
        tUser(
          interaction.user.id,
          'user_language.updated',
          guildId
        ),
      flags: MessageFlags.Ephemeral
    });
  }
};
