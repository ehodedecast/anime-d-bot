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

      FINISHED: "Finalizado",

      RELEASING: "Em exibição",

      NOT_YET_RELEASED:
        "Ainda não lançado",

      CANCELLED: "Cancelado",

      HIATUS: "Em hiato"
    };

    const status =
      statusMap[data.status] ||
      data.status;

    const studio =
      data.studios?.nodes?.[0]?.name ||
      "Desconhecido";

    const embed = new EmbedBuilder()

      .setColor(0x9933ff)

      .setTitle(
        `📺 ${data.title.romaji}`
      )

      .setDescription(
        description ||
        "Sem descrição disponível."
      )

      .addFields(

        {
          name: '⭐ Nota',
          value:
            `${data.averageScore || "N/A"}`,
          inline: true
        },

        {
          name: '🎬 Episódios',
          value:
            `${data.episodes || "?"}`,
          inline: true
        },

        {
          name: '📊 Status',
          value: status,
          inline: true
        },

        {
          name: '🎥 Estúdio',
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
        'api_problem'
      )
    );
  }
}

module.exports = info;