require('dotenv').config({
  quiet: true
});

const axios = require('axios');

const {
  Client,
  GatewayIntentBits,
  PermissionFlagsBits
} = require('discord.js');

const {
  getTrailerUrl
} = require('../utils/trailerNotifications');

const {
  createReleasePayload
} = require('../utils/partnerNotifications');

const BLUE_LOCK_ARENA_CHANNEL_ID =
  '1511527059946471435';

const BLUE_LOCK_SEASON_2_ID =
  163146;

const EPISODE_COUNT =
  14;

const TRAILER_DELAY_MS =
  5000;

const EPISODE_DELAY_MS =
  2000;

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

const client =
  new Client({
    intents: [
      GatewayIntentBits.Guilds
    ]
  });

function delay(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

async function fetchBlueLockSeason2() {
  const query = `
    query {
      Media(id: ${BLUE_LOCK_SEASON_2_ID}, type: ANIME) {
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

  const anime =
    response.data?.data?.Media;

  if (!anime) {
    throw new Error(
      'Nao consegui carregar Blue Lock VS. U-20 JAPAN na AniList.'
    );
  }

  return {
    ...anime,
    title: {
      romaji:
        anime.title?.romaji ||
        'Blue Lock VS. U-20 JAPAN'
    }
  };
}

async function getTargetChannel() {
  const channel =
    await client.channels.fetch(
      BLUE_LOCK_ARENA_CHANNEL_ID
    );

  if (
    !channel ||
    typeof channel.send !== 'function'
  ) {
    throw new Error(
      'Canal Blue Lock Arena nao encontrado ou nao aceita mensagens.'
    );
  }

  const permissions =
    channel.permissionsFor(
      client.user
    );

  if (
    !permissions?.has(
      PermissionFlagsBits.ViewChannel
    ) ||
    !permissions?.has(
      PermissionFlagsBits.SendMessages
    )
  ) {
    throw new Error(
      'O bot nao possui permissao para ver/enviar mensagens no canal Blue Lock Arena.'
    );
  }

  if (
    !permissions.has(
      PermissionFlagsBits.EmbedLinks
    )
  ) {
    throw new Error(
      'O bot nao possui permissao Embed Links no canal Blue Lock Arena.'
    );
  }

  return channel;
}

async function sendTrailerIfAvailable(
  channel,
  anime
) {
  const trailerUrl =
    getTrailerUrl(anime);

  if (!trailerUrl) {
    console.log(
      'Trailer da 2 temporada nao encontrado na AniList.'
    );
    return false;
  }

  await channel.send(
    `🎬 O trailer da nova temporada de ${anime.title.romaji} acabou de ser lançado!\n\n${trailerUrl}`
  );

  console.log(
    `Trailer enviado: ${trailerUrl}`
  );

  await delay(
    TRAILER_DELAY_MS
  );

  return true;
}

function createEpisodeAnime(
  anime,
  episode
) {
  return {
    ...anime,
    nextAiringEpisode: {
      episode,
      airingAt:
        Math.floor(Date.now() / 1000)
    }
  };
}

async function sendEpisodes(
  channel,
  anime
) {
  for (
    let episode = 1;
    episode <= EPISODE_COUNT;
    episode++
  ) {
    await channel.send(
      createReleasePayload(
        createEpisodeAnime(
          anime,
          episode
        )
      )
    );

    console.log(
      `Episodio ${episode} enviado.`
    );

    if (
      episode < EPISODE_COUNT
    ) {
      await delay(
        EPISODE_DELAY_MS
      );
    }
  }
}

async function main() {
  try {
    await client.login(token);

    await new Promise(resolve =>
      client.once(
        'ready',
        resolve
      )
    );

    console.log(
      `Bot conectado como ${client.user.tag}`
    );

    const channel =
      await getTargetChannel();

    console.log(
      `Canal validado: ${channel.id}`
    );

    const anime =
      await fetchBlueLockSeason2();

    console.log(
      `Anime carregado: ${anime.title.romaji} (${anime.id})`
    );

    await sendTrailerIfAvailable(
      channel,
      anime
    );

    await sendEpisodes(
      channel,
      anime
    );

    console.log(
      'Sequencia concluida.'
    );
  } catch (err) {
    console.error(
      'Falha ao executar simulacao:',
      err.message || err
    );

    process.exitCode = 1;
  } finally {
    client.destroy();
  }
}

main();
