const {

  loadGuildHistory,

  saveGuildHistory

} = require(

  '../utils/guildHistoryStorage'
);

const {
  EmbedBuilder
} = require('discord.js');

const GUILD_EVENT_CHANNEL_ID =
  '1511057069166559263';

function getCurrentServerCount(
  guild
) {

  return guild.client.guilds.cache.size;
}

async function guildDelete(
  guild
) {

  try {

    const history =

      loadGuildHistory();

    const guildData =
      history[guild.id];

    const now =
      new Date();

    let sessionTimeMs = 0;

    if (!guildData) {

        const embed =
          new EmbedBuilder()
            .setColor(0xED4245)
            .setTitle(
              '📤 AnimeDBot Removed'
            )
            .setDescription(
              `📚 **Server:** ${guild.name}\n` +
              `🆔 **Server ID:** ${guild.id}\n` +
              `👥 **Members:** ${guild.memberCount || 'Unknown'}\n\n` +
              'No previous guild history was found for this server.'
            )
            .setFooter({
              text:
                'AnimeDBot • Growth Tracker'
            })
            .addFields({
              name:
                '🌍 Current servers',
              value:
                String(
                  getCurrentServerCount(
                    guild
                  )
                ),
              inline:
                true
            })
            .setTimestamp();

        const notificationChannel =
          await guild.client.channels.fetch(
            GUILD_EVENT_CHANNEL_ID
          );

        await notificationChannel.send({
          embeds: [embed]
        });

      return;
    }

    guildData.currentlyInServer =
      false;

    guildData.lastLeftAt =
      now.toISOString();

    // ⏳ LAST SESSION

    const lastSession =

      guildData.history[
        guildData.history.length - 1
      ];

    if (
      lastSession &&
      !lastSession.leftAt
    ) {

      lastSession.leftAt =
        now.toISOString();

      const joinedAt =
        new Date(
          lastSession.joinedAt
        );

      sessionTimeMs =
        now - joinedAt;

      guildData.totalTimeMs +=
        sessionTimeMs;
    }

    saveGuildHistory(
      history
    );

      const embed =
        new EmbedBuilder()
          .setColor(0xED4245)
          .setTitle(
            '📤 AnimeDBot Removed'
          )
          .setDescription(
            `📚 **Server:** ${guild.name}\n` +
            `🆔 **Server ID:** ${guild.id}\n` +
            `👥 **Members:** ${guild.memberCount || 'Unknown'}\n` +
            `🔁 **Join count:** ${guildData.joinCount || 0}\n` +
            `⏱️ **This session:** ${formatDuration(sessionTimeMs)}\n` +
            `📊 **Total time:** ${formatDuration(guildData.totalTimeMs || 0)}`
          )
          .setFooter({
            text:
              'AnimeDBot • Growth Tracker'
          })
          .addFields({
            name:
              '🌍 Current servers',
            value:
              String(
                getCurrentServerCount(
                  guild
                )
              ),
            inline:
              true
          })
          .setTimestamp();

      const notificationChannel =
        await guild.client.channels.fetch(
          GUILD_EVENT_CHANNEL_ID
        );

      await notificationChannel.send({
        embeds: [embed]
      });

    console.log(

      `📤 Left server: ${guild.name}`
    );

  } catch (err) {

    console.log(

      `💥 guildDelete error: ${err.message}`
    );
  }
}

function formatDuration(
  ms
) {

  if (
    !ms ||
    ms < 0
  ) {
    return 'Unknown';
  }

  const totalMinutes =
    Math.floor(ms / 60000);

  const days =
    Math.floor(totalMinutes / 1440);

  const hours =
    Math.floor((totalMinutes % 1440) / 60);

  const minutes =
    totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  return `${minutes}m`;
}

module.exports =
  guildDelete;
