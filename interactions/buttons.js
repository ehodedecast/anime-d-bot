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
  t
} = require('../utils/language');

const {
  loadConfig,
  saveConfig
} = require('../utils/config');

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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
    progress?.watchUrl ||
    `https://anilist.co/anime/${parsed.animeId}`;

  return {
    url,
    label:
      progress?.watchLabel ||
      'Ver pagina do anime'
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
      ephemeral: true
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
        ephemeral: true
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
        ephemeral: true
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

    const watchTarget =
      getWatchTarget(
        parsed
      );

    return interaction.update({
      content:
        'Episodio aberto.',
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
          label:
            watchTarget.label
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
          'Clique em Assistir antes de marcar como assistido.',
        ephemeral: true
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
        label:
          watchTarget.label
      });

    return interaction.update({
      content:
        '✅ Episodio marcado como assistido.',
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
          'Esta selecao expirou. Execute o comando novamente.',
        ephemeral: true
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
          'Selecao invalida. Execute o comando novamente.',
        ephemeral: true
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
        ephemeral: true
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
        t(
          guildId,
          'profile_coming_soon'
        ),
      ephemeral: true
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

    await interaction.deferReply({
      ephemeral: true
    });

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
      ephemeral: true
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
      ephemeral: true
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

    const messages = {
      pt: 'Idioma alterado para Portugues.',
      en: 'Language changed to English.',
      es: 'Idioma cambiado a Espanol.'
    };

    return interaction.reply({
      content:
        messages[language],
      ephemeral: true
    });
  }
};
