const {
  Client,
  GatewayIntentBits,
  MessageFlags
} = require('discord.js');

require('dotenv').config();

const notifier =
  require('node-notifier');

const guildCreate =
  require('./events/guildCreate');

const guildDelete =
  require('./events/guildDelete');

const startVoteServer =
  require('./topgg/server');

const checkAnime =
  require('./utils/checkAnime');

const validateStorage =
  require('./utils/storageValidator');

const {
  getGuildAnimeList
} = require('./utils/animeStorage');

const {
  shouldIgnoreForLocalTest
} = require('./utils/localMode');

const {
  registerSlashCommands
} = require('./utils/slashRegistry');

const handleButtons =
  require('./interactions/buttons');

const handleSlashCommand =
  require('./interactions/slashCommands');

const TOKEN =
  process.env.TOKEN;

const client =
  new Client({
    intents: [
      GatewayIntentBits.Guilds
    ]
  });

startVoteServer(client);

process.on(
  'uncaughtException',
  async (err) => {

    console.error(err);

    notifier.notify({
      title: 'Erro no Bot',
      message: err.message
    });
  }
);

process.on(
  'unhandledRejection',
  async (err) => {

    console.error(err);

    notifier.notify({
      title: 'Erro Async',
      message:
        err?.message ||
        'Erro desconhecido'
    });
  }
);

client.once(
  'clientReady',
  async () => {

    console.log('Bot online!');

    await registerSlashCommands(
      client
    );

    setInterval(() => {
      checkAnime(client);
    }, 60000);
  }
);

client.on(
  'guildCreate',
  guildCreate
);

client.on(
  'guildDelete',
  guildDelete
);

client.on(
  'interactionCreate',
  async (interaction) => {

    if (
      shouldIgnoreForLocalTest(interaction)
    ) {
      return;
    }

    try {

      if (
        interaction.isChatInputCommand()
      ) {

        return handleSlashCommand(
          interaction,
          client
        );
      }

      if (
        interaction.isButton() ||
        interaction.isStringSelectMenu() ||
        interaction.isModalSubmit()
      ) {

        const animeList =
          interaction.guild
            ? getGuildAnimeList(
                interaction.guild.id
              )
            : [];

        return handleButtons(
          interaction,
          animeList,
          client
        );
      }

    } catch (err) {

      console.error(err);

      const payload = {
        content:
          'Erro ao processar a interação.',
        flags: MessageFlags.Ephemeral
      };

      if (
        interaction.deferred ||
        interaction.replied
      ) {
        return interaction.editReply(payload);
      }

      return interaction.reply(payload);
    }
  }
);

validateStorage();

client.login(TOKEN);
