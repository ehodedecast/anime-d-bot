const fs = require('fs');
const chalk = require('chalk').default;

const add =
  require('../commands/add');

const list =
  require('../commands/list');

const next =
  require('../commands/next');

const info =
  require('../commands/info');

const clear =
  require('../commands/clear');

const remove =
  require('../commands/remove');

const help =
  require('../commands/help');

const sendMenu =
  require('./menu');

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
}

module.exports = async (
  interaction,
  animeList,
  waitingForAdd
) => {

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

  console.log(
    'BOTÃO CLICADO:',
    interaction.customId
  );

  console.log(
    interaction.replied
  );

  console.log(
    interaction.deferred
  );

  /* =========================================
     🎛️ MENU BUTTONS
  ========================================= */

  // 🔹 BOTAO ADD

  if (
    interaction.customId ===
    'menu_add'
  ) {

    clearUserStates(
      interaction.user.id
    );

    state.waitingForAdd[
      interaction.user.id
    ] = true;

    return interaction.reply({

      content:

        t(
          guildId,
          'prompt_type_anime_name'
        ),

      flags: 64
    });
  }

  // 🔹 BOTAO REMOVE

  if (
    interaction.customId ===
    'menu_remove'
  ) {

    clearUserStates(
      interaction.user.id
    );

    state.waitingForRemove =
      state.waitingForRemove || {};

    state.waitingForRemove[
      interaction.user.id
    ] = true;

    return interaction.reply({

      content:

        t(
          guildId,
          'prompt_type_anime_name'
        ),

      flags: 64
    });
  }

  // 🔹 BOTAO NEXT

  if (
    interaction.customId ===
    'menu_next'
  ) {

    clearUserStates(
      interaction.user.id
    );

    state.waitingForNext =
      state.waitingForNext || {};

    state.waitingForNext[
      interaction.user.id
    ] = true;

    return interaction.reply({

      content:

        t(
          guildId,
          'prompt_type_anime_name'
        ),

      flags: 64
    });
  }

  // 🔹 BOTAO LISTA

  if (
    interaction.customId ===
    'menu_list'
  ) {

    clearUserStates(
      interaction.user.id
    );

    return list(

      {
        reply: (msg) =>
          interaction.reply(msg),

        guild:
          interaction.guild
      },

      animeList
    );
  }

  // 🔹 BOTAO INFO

  if (
    interaction.customId ===
    'menu_info'
  ) {

    clearUserStates(
      interaction.user.id
    );

    state.waitingForInfo =
      state.waitingForInfo || {};

    state.waitingForInfo[
      interaction.user.id
    ] = true;

    return interaction.reply({

      content:

        t(
          guildId,
          'prompt_type_anime_name'
        ),

      flags: 64
    });
  }

  // 🔹 BOTAO LIMPAR

  if (
    interaction.customId ===
    'menu_clear'
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

            .setEmoji('✅')

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

            .setEmoji('❌')

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

      flags: 64
    });
  }

  // 🔹 BOTAO HELP
  if (
    interaction.customId ===
    'menu_help'
  ) {
    
    return help({

    reply: (msg) =>
      interaction.reply(msg),

    guild:
      interaction.guild
  });
}


  /* =========================================
     ⚙️ SYSTEM / COMMAND BUTTONS
  ========================================= */

  // 🔹 BOTAO LANGUAGE PT

  if (
    interaction.customId ===
    'lang_pt'
  ) {

    const config =
      loadConfig();

    if (
      !config[
        interaction.guild.id
      ]
    ) {

      config[
        interaction.guild.id
      ] = {};
    }

    config[
      interaction.guild.id
    ].language = 'pt';

    saveConfig(config);

    return interaction.reply({

      content:
        '🇧🇷 Idioma alterado para Português.',

      flags: 64
    });
  }

  // 🔹 BOTAO LANGUAGE EN

  if (
    interaction.customId ===
    'lang_en'
  ) {

    const config =
      loadConfig();

    if (
      !config[
        interaction.guild.id
      ]
    ) {

      config[
        interaction.guild.id
      ] = {};
    }

    config[
      interaction.guild.id
    ].language = 'en';

    saveConfig(config);

    return interaction.reply({

      content:
        '🇺🇸 Language changed to English.',

      flags: 64
    });
  }

  /* =========================================
     🧹 CLEAR CONFIRMATION
  ========================================= */

  // 🔹 CONFIRMAR LIMPEZA

  if (
    interaction.customId ===
    'confirm_clear'
  ) {

    return clear(

      {
        reply: (msg) =>

          interaction.update({

            content: msg,

            components: []
          }),

        guild:
          interaction.guild
      },

      animeList
    );
  }

  // 🔹 CANCELAR LIMPEZA

  if (
    interaction.customId ===
    'cancel_clear'
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
};