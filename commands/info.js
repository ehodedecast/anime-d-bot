const { EmbedBuilder } = require('discord.js');
const { t } = require('../utils/language');

async function info(message, animeName) {

  try {

    console.log("ANIME NAME:", animeName);

    const query = `
    query ($search: String) {

      Page(perPage: 1) {

        media(
  search: $search,
  type: ANIME,
  sort: SEARCH_MATCH
) {
        isAdult

          id

          title {
            romaji
          }

          description

          averageScore

          episodes

          status

          studios {
            nodes {
              name
            }
          }

          coverImage {
            large
          }
        }
      }
    }
    `;

    const variables = {
      search: animeName
    };

    const response = await fetch(
      'https://graphql.anilist.co/graphql',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },

        body: JSON.stringify({
          query,
          variables
        })
      }
    );

    const json = await response.json();

    console.log(json);

    const data =
      json.data?.Page?.media?.[0];
      
      if (data.isAdult) {

  return message.reply(
    t(
      message.guild.id,
      'adult_content_warning'
    )
  );
}

    if (!data) {
  return message.reply(
    t(
      message.guild.id,
      'search_temporarily_disabled'
    )
  );
}

    // limpa HTML
    let description = data.description
      ?.replace(/<[^>]*>/g, '')
      .slice(0, 300);

    if (
      data.description &&
      data.description.length > 300
    ) {
      description += '...';
    }

    // status traduzido
    const statusMap = {

      FINISHED: t(message.guild.id, "finished"),

      RELEASING: t(message.guild.id, "releasing"),

      NOT_YET_RELEASED:
        t(message.guild.id, "not_yet_released"),

      CANCELLED: t(message.guild.id, "cancelled"),

      HIATUS: t(message.guild.id, "hiatus")
    };

    const status =
      statusMap[data.status] ||
      data.status;

    const studio =
      data.studios?.nodes?.[0]?.name ||
      t(message.guild.id, "studio_unknown");

    const embed = new EmbedBuilder()

      .setColor(0x9933ff)

      .setTitle(
        `📺 ${data.title.romaji}`
      )

      .setDescription(
        description ||
        t(message.guild.id, "no_description_available")
      )

      .addFields(

        {
          name: t(message.guild.id, "average_score"),
          value:
            `${data.averageScore || "N/A"}`,
          inline: true
        },

        {
          name: t(message.guild.id, "episodes"),
          value:
            `${data.episodes || "?"}`,
          inline: true
        },

        {
          name: t(message.guild.id, "status"),
          value: status,
          inline: true
        },

        {
          name: t(message.guild.id, "studio"),
          value: studio,
          inline: true
        }
      )

      .setImage(
        data.coverImage?.large || null
      )

      .setFooter({
        text: 'AnimeDBot • DBOTs'
      })

      .setTimestamp();

    return message.reply({
      embeds: [embed]
    });

  } catch (err) {

    console.log(
      "💥 [INFO ERROR]"
    );

    console.log(err);

    return message.reply(
      t(
        message.guild.id,
        'error_occurred'
      )
    );
  }
}

module.exports = info;