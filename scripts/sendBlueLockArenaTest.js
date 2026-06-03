require('dotenv').config({
  quiet: true
});

const fs = require('fs');

const {
  Client,
  GatewayIntentBits
} = require('discord.js');

const {
  notifyPartnerChannels
} = require('../utils/partnerNotifications');

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

const testAnime = {
  id: 137822,
  title: {
    romaji:
      '[TESTE] Blue Lock Arena'
  },
  siteUrl:
    'https://anilist.co/anime/137822',
  coverImage: {
    large:
      'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx137822-T4f5XTfW4jsw.jpg'
  },
  nextAiringEpisode: {
    episode: 9999,
    airingAt:
      Math.floor(Date.now() / 1000) +
      23 * 60 * 60
  },
  externalLinks: [
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

async function main() {
  try {
    await client.login(token);

    await new Promise(resolve =>
      client.once('ready', resolve)
    );

    console.log(
      `Bot conectado como ${client.user.tag}`
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

    fs.writeFileSync(
      sentPath,
      previousSentData
    );

    console.log(
      'Teste enviado: 24h e lancamento.'
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
