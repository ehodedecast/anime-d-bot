require('dotenv').config({
  quiet: true
});

const fs = require('fs');

const axios = require('axios');

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require('discord.js');

const {
  notifyPartnerChannels
} = require('../utils/partnerNotifications');

const {
  getTrailerUrl
} = require('../utils/trailerNotifications');

const BLUE_LOCK_ARENA_CHANNEL_ID =
  '1511527059946471435';

const token =
  process.env.DISCORD_TOKEN ||
  process.env.TOKEN ||
  process.env.BOT_TOKEN;

if (!token) {
  console.error(
    'Token do Discord nao encontrado no .env.'
  );
  process.exit(1);
}

const sentPath =
  './data/partnerSentEpisodes.json';

const previousSentData =
  fs.existsSync(sentPath)
    ? fs.readFileSync(sentPath, 'utf8')
    : '{}';

const client =
  new Client({
    intents: [
      GatewayIntentBits.Guilds
    ]
  });

async function getBlueLockTestAnime() {
  const query = `
    query {
      Media(id: 137822, type: ANIME) {
        id
        siteUrl
        title {
          romaji
        }
        coverImage {
          extraLarge
          large
          medium
        }
        externalLinks {
          site
          url
        }
      }
    }`;

  const response =
    await axios.post(
      'https://graphql.anilist.co/graphql',
      {
        query
      }
    );

  const data =
    response.data?.data?.Media;

  if (!data) {
    throw new Error(
      'Nao consegui carregar Blue Lock na AniList.'
    );
  }

  return {
    ...data,
    title: {
      romaji:
        `[TESTE] ${data.title?.romaji || 'Blue Lock Arena'}`
    },
    nextAiringEpisode: {
      episode: 9999,
      airingAt:
        Math.floor(Date.now() / 1000) +
        23 * 60 * 60
    },
    externalLinks: [
      ...(data.externalLinks || []),
      {
        site: 'Crunchyroll',
        url:
          'https://www.crunchyroll.com/series/G4PH0WEKE/blue-lock'
      },
      {
        site: 'Official Site',
        url:
          'https://bluelock-pr.com/'
      }
    ]
  };
}

async function getBlueLockSecondSeasonTrailerAnime() {
  const query = `
    query {
      Media(id: 163146, type: ANIME) {
        id
        siteUrl
        title {
          romaji
        }
        coverImage {
          extraLarge
          large
          medium
        }
        trailer {
          id
          site
          thumbnail
        }
        externalLinks {
          site
          url
        }
      }
    }`;

  const response =
    await axios.post(
      'https://graphql.anilist.co/graphql',
      {
        query
      }
    );

  const data =
    response.data?.data?.Media;

  if (!data) {
    throw new Error(
      'Nao consegui carregar Blue Lock 2 temporada na AniList.'
    );
  }

  return {
    ...data,
    title: {
      romaji:
        `[TESTE TRAILER] ${data.title?.romaji || 'Blue Lock 2 temporada'}`
    }
  };
}

function getCoverImageUrl(anime) {
  return (
    anime.coverImage?.extraLarge ||
    anime.coverImage?.large ||
    anime.coverImage?.medium ||
    null
  );
}

async function sendBlueLockSecondSeasonTrailer() {
  const anime =
    await getBlueLockSecondSeasonTrailerAnime();

  const trailerUrl =
    getTrailerUrl(anime);

  if (!trailerUrl) {
    console.log(
      'Trailer da 2 temporada nao encontrado na AniList.'
    );
    return false;
  }

  const channel =
    await client.channels.fetch(
      BLUE_LOCK_ARENA_CHANNEL_ID
    );

  const embed =
    new EmbedBuilder()
      .setColor(0xff6600)
      .setTitle(
        'Trailer disponivel'
      )
      .setDescription(
        `O trailer de **${anime.title.romaji}** ja esta disponivel!`
      )
      .setTimestamp();

  const coverImage =
    getCoverImageUrl(anime);

  if (coverImage) {
    embed.setImage(
      coverImage
    );
  }

  await channel.send({
    embeds: [
      embed
    ],
    components: [
      new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel(
              'Assistir trailer'
            )
            .setStyle(ButtonStyle.Link)
            .setURL(
              trailerUrl
            )
        )
    ]
  });

  console.log(
    `Trailer enviado: ${trailerUrl}`
  );

  return true;
}

async function main() {
  try {
    await client.login(token);

    await new Promise(resolve =>
      client.once('ready', resolve)
    );

    console.log(
      `Bot conectado como ${client.user.tag}`
    );

    const testAnime =
      await getBlueLockTestAnime();

    console.log(
      `Capa usada: ${
        testAnime.coverImage?.extraLarge ||
        testAnime.coverImage?.large ||
        testAnime.coverImage?.medium ||
        'nenhuma'
      }`
    );

    await notifyPartnerChannels({
      client,
      anime:
        testAnime,
      notificationType:
        '24h',
      warningMessage:
        '[TESTE] episodio em menos de 24 horas.'
    });

    await notifyPartnerChannels({
      client,
      anime:
        testAnime,
      notificationType:
        'release'
    });

    await sendBlueLockSecondSeasonTrailer();

    fs.writeFileSync(
      sentPath,
      previousSentData
    );

    console.log(
      'Teste enviado: 24h, lancamento e trailer.'
    );
    console.log(
      'partnerSentEpisodes.json restaurado.'
    );
  } catch (err) {
    fs.writeFileSync(
      sentPath,
      previousSentData
    );

    console.error(
      'Falha ao enviar teste:',
      err.message || err
    );

    process.exitCode = 1;
  } finally {
    client.destroy();
  }
}

main();
