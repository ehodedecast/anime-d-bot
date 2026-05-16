const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const fs = require('fs');
const notifier = require('node-notifier');
const chalk = require('chalk').default;

const handleCommands = require('./commands');
const handleButtons = require('./interactions/buttons');
const sendMenu = require('./interactions/menu');

const checkAnime = require('./utils/checkAnime');

const {
  getGuildAnimeList
} = require('./utils/animeStorage');

const {
  loadConfig
} = require('./utils/config');

const {
  t
} = require('./utils/language');

const state =
  require('./state/state');

const TOKEN =
  process.env.TOKEN;

// 🤖 CLIENT

const client =
  new Client({

    intents: [

      GatewayIntentBits.Guilds,

      GatewayIntentBits.GuildMessages,

      GatewayIntentBits.MessageContent
    ]
  });

// 🚨 ERRORS

process.on(
  'uncaughtException',

  async (err) => {

    console.error(err);

    notifier.notify({

      title:
        'Erro no Bot',

      message:
        err.message
    });
  }
);

process.on(
  'unhandledRejection',

  async (err) => {

    console.error(err);

    notifier.notify({

      title:
        'Erro Async',

      message:
        err?.message ||
        'Erro desconhecido'
    });
  }
);

// ✅ BOT READY

client.once(
  'clientReady',

  async () => {

    console.log(
      'Bot online!'
    );

    setInterval(() => {

      checkAnime(client);

    }, 30000);
  }
);

// 🌍 BOT JOINED SERVER

client.on(
  'guildCreate',

  async (guild) => {

    try {

      const channel =
        guild.channels.cache.find(

          c =>

            c.isTextBased() &&

            c.permissionsFor(
              guild.members.me
            ).has(
              'SendMessages'
            )
        );

      if (!channel) return;

      channel.send(

        t(
          guild.id,
          'welcome_message'
        ) +

        `\n\n` +

        t(
          guild.id,
          'setup_instructions'
        )
      );

    } catch (err) {

      console.log(
        'Erro guildCreate:',
        err
      );
    }
  }
);

// 💬 MESSAGE CREATE

client.on(
  'messageCreate',

  async (message) => {

    // 🤖 IGNORE BOTS

    if (
      message.author.bot
    ) {
      return;
    }

    // 📺 GUILD ANIME LIST

    const animeList =
      getGuildAnimeList(
        message.guild.id
      );

    // ⚙️ CONFIG

    const config =
      loadConfig();

    const guildConfig =
      config[
        message.guild?.id
      ];

    // ⚠️ NO CHANNEL CONFIGURED

    if (

      !guildConfig &&

      message.content !==
      '!setchannel'

    ) {

      return message.reply(
    t(message.guild.id, 'no_channel_set') + '\n\n' +
    t(message.guild.id, 'setchannel_instructions')
  );
    }

    // 🚫 WRONG CHANNEL

    if (

      guildConfig &&

      message.channel.id !==
      guildConfig.channelId &&

      message.content !==
      '!setchannel'

    ) {
      return;
    }

    // 🎯 ADD SELECTION

    if (

      state
        .waitingForAddSelection[
          message.author.id
        ]

    ) {

      const choice =
        parseInt(
          message.content
        );

      // ❌ INVALID CHOICE

      if (

        isNaN(choice) ||

        choice < 1 ||

        choice > 5

      ) {

        delete state
          .waitingForAddSelection[
            message.author.id
          ];

        return message.reply(

          t(
            message.guild.id,
            'selection_invalid'
          )
        );
      }

      // ✅ SELECTED ANIME

      const selectedAnime =

        state
          .waitingForAddSelection[
            message.author.id
          ]
          .results[
            choice - 1
          ];

      console.log(

        selectedAnime
          .title
      );

      // 🧹 CLEAR STATE

      delete state
        .waitingForAddSelection[
          message.author.id
        ];

      // ➕ EXECUTE ADD

      const add =
        require('./commands/add');

      return add(

  message,

  animeList,

  selectedAnime.title,

  true,

  selectedAnime
);
    }

    // 📋 MENU

    if (
      message.content ===
      '!menu'
    ) {

      console.log(

        chalk.cyan(
          `[${message.guild.name}]`
        ) +

        chalk.green(
          ` ${message.author.username}`
        ) +

        ' abriu o menu'
      );

      return sendMenu(
        message
      );
    }

    // 🎮 COMMANDS

    console.log(
      animeList
    );

    handleCommands(

      message,

      animeList,

      client
    );
  }
);

// 🔘 BUTTON INTERACTIONS

client.on(
  'interactionCreate',

  async (interaction) => {

    if (
      !interaction.isButton()
    ) {
      return;
    }

    const animeList =
      getGuildAnimeList(
        interaction.guild.id
      );

    handleButtons(
      interaction,
      animeList
    );
  }
);

// 🔑 LOGIN

client.login(TOKEN);