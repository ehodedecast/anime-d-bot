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



const OWNER_ID =
  process.env.OWNER_ID;

async function guildCreate(
  guild
) {

  try {

    const owner =

      await guild.fetchOwner();

    const user =

      await guild.client.users.fetch(
        OWNER_ID
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

        .setFooter({

          text:
            'AnimeDBot • Growth Tracker'
        })

        .setTimestamp();

    await user.send({
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