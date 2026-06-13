const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const slashDefinitions =
  require('../commands/slashDefinitions');

function getRequiredEnv(
  name
) {
  const value =
    process.env[name];

  if (
    !value
  ) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

function validateSlashDefinitions(
  commands
) {
  if (
    !Array.isArray(commands)
  ) {
    throw new Error(
      'commands/slashDefinitions.js must export an array.'
    );
  }

  commands.forEach((command, index) => {
    if (
      !command ||
      typeof command.toJSON !== 'function'
    ) {
      throw new Error(
        `Slash command at index ${index} does not expose toJSON().`
      );
    }
  });
}

function buildCommandsBody(
  commands
) {
  validateSlashDefinitions(
    commands
  );

  const body =
    commands.map(command =>
      command.toJSON()
    );

  if (
    body.length === 0
  ) {
    throw new Error(
      'No slash commands found to publish.'
    );
  }

  return body;
}

async function publishCommands() {
  const clientId =
    getRequiredEnv(
      'CLIENT_ID'
    );

  const token =
    getRequiredEnv(
      'TOKEN'
    );

  const body =
    buildCommandsBody(
      slashDefinitions
    );

  const url =
    `https://discordbotlist.com/api/v1/bots/${clientId}/commands`;

  try {
    await axios.post(
      url,
      body,
      {
        headers: {
          Authorization:
            `Bot ${token}`,
          'Content-Type':
            'application/json'
        }
      }
    );

    console.log(
      `Published ${body.length} commands to DiscordBotList`
    );
  } catch (err) {
    if (
      err.response
    ) {
      console.error(
        'DiscordBotList API error'
      );
      console.error(
        `Status: ${err.response.status}`
      );
      console.error(
        'Body:',
        err.response.data
      );
      console.error(
        `Message: ${err.message}`
      );
    } else {
      console.error(
        `DiscordBotList publish failed: ${err.message}`
      );
    }

    process.exitCode = 1;
  }
}

publishCommands();
