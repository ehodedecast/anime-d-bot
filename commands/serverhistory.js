const OWNER_ID =
  process.env.OWNER_ID;

const {

  loadGuildHistory

} = require(

  '../utils/guildHistoryStorage'
);

function formatDuration(
  ms
) {

  const days =

    Math.floor(
      ms / 86400000
    );

  const hours =

    Math.floor(
      (ms % 86400000) /
      3600000
    );

  return `${days}d ${hours}h`;
}

async function serverhistory(
  message
) {

  if (
    String(message.author.id) !==
    String(OWNER_ID)
  ) {

    return;
  }

  try {

    await message.delete();

  } catch {}

  const history =

    loadGuildHistory();

  const guilds =

    Object.entries(history);

  if (!guilds.length) {

    return message.author.send(

      '📭 No guild history found.'
    );
  }

  let text =
    '📚 AnimeDBot Server History\n\n';

  for (
    const [
      guildId,
      data
    ] of guilds
  ) {

    const status =

      data.currentlyInServer

        ? '🟢 ACTIVE'

        : '🔴 LEFT';

    text +=

      `${status} ${data.guildName}\n` +

      `🆔 ${guildId}\n` +

      `🔁 Joins: ${data.joinCount}\n` +

      `⏳ Total Time: ${formatDuration(data.totalTimeMs)}\n`;

    if (
      data.firstJoinedAt
    ) {

      text +=

        `📅 First Join: ${data.firstJoinedAt}\n`;
    }

    if (
      data.lastLeftAt
    ) {

      text +=

        `📤 Last Left: ${data.lastLeftAt}\n`;
    }

    text += '\n';
  }

  await message.author.send(
    text
  );

  console.log(
    '📚 serverhistory executed'
  );
}

module.exports =
  serverhistory;