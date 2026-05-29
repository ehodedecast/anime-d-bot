const {
  REST,
  Routes
} = require('discord.js');

const slashDefinitions =
  require('../commands/slashDefinitions');

async function registerSlashCommands(
  client
) {

  const token =
    process.env.TOKEN;

  if (!token) {
    throw new Error('TOKEN missing');
  }

  const rest =
    new REST({
      version: '10'
    }).setToken(token);

  const body =
    slashDefinitions.map(command =>
      command.toJSON()
    );

  const route =
    process.env.SLASH_GUILD_ID
      ? Routes.applicationGuildCommands(
          client.user.id,
          process.env.SLASH_GUILD_ID
        )
      : Routes.applicationCommands(
          client.user.id
        );

  await rest.put(
    route,
    {
      body
    }
  );

  console.log(
    `Registered ${body.length} slash commands`
  );
}

module.exports = {
  registerSlashCommands
};
