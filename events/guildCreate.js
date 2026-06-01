const {
  t
} = require(
  '../utils/language'
);

const {

  EmbedBuilder

} = require(
  'discord.js'
);

const {

  loadGuildHistory,

  saveGuildHistory

} = require(

  '../utils/guildHistoryStorage'
);



const GUILD_EVENT_CHANNEL_ID =
  '1511057069166559263';

function getCurrentServerCount(
  guild
) {

  return guild.client.guilds.cache.size;
}

async function guildCreate(
  guild
) {

  try {

    const owner =

      await guild.fetchOwner();

const history =

  loadGuildHistory();

if (
  !history[guild.id]
) {

  history[guild.id] = {

    guildName:
      guild.name,

    joinCount: 0,

    currentlyInServer: false,

    firstJoinedAt: null,

    lastJoinedAt: null,

    lastLeftAt: null,

    totalTimeMs: 0,

    history: []
  };
}

const guildData =
  history[guild.id];

guildData.guildName =
  guild.name;

guildData.joinCount++;

guildData.currentlyInServer =
  true;

const now =
  new Date().toISOString();

if (
  !guildData.firstJoinedAt
) {

  guildData.firstJoinedAt =
    now;
}

guildData.lastJoinedAt =
  now;

guildData.history.push({

  joinedAt: now,

  leftAt: null
});

saveGuildHistory(
  history
);

    const embed =
      new EmbedBuilder()

        .setColor(0x57F287)

        .setTitle(
          '🚀 AnimeDBot Added'
        )

        .setDescription(

          `📚 **Server:** ${guild.name}\n` +

          `🆔 **Server ID:** ${guild.id}\n` +

          `👑 **Owner:** ${owner.user.tag}\n` +

          `👥 **Members:** ${guild.memberCount}`
        )

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

        .setFooter({

          text:
            'AnimeDBot • Growth Tracker'
        })

        .setTimestamp();

    const notificationChannel =
      await guild.client.channels.fetch(
        GUILD_EVENT_CHANNEL_ID
      );

    await notificationChannel.send({
      embeds: [embed]
    });
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

if (channel) {

  await channel.send(

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
}
    console.log(

      `🚀 Joined server: ${guild.name}`
    );

  } catch (err) {

    console.log(
      `💥 GuildCreate Error: ${err.message}`
    );
  }
}

module.exports =
  guildCreate;
