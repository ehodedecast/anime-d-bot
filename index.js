const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();
const VERSION = "v1.0";

let notifiedEpisodes = {};

try {
  notifiedEpisodes = JSON.parse(fs.readFileSync('notified.json', 'utf8'));
} catch {
  fs.writeFileSync('notified.json', '{}');
}
setInterval(() => {
  notifiedEpisodes = {};
  fs.writeFileSync('notified.json', '{}');
}, 86400000); // limpa a cada 24h

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1382788306529685515';

// carregar lista
let animeList = [];

try {
  const data = fs.readFileSync('animes.json', 'utf8');
  animeList = JSON.parse(data);
} catch {
  fs.writeFileSync('animes.json', '[]');
}

// BOT ONLINE
client.once('clientReady', async () => {
  console.log('Bot online!');

  const channel = await client.channels.fetch(CHANNEL_ID);
  channel.send('✅ Bot funcionando!');

  setInterval(() => checkAnime(), 30000);
});

// FUNÇÃO PRINCIPAL
async function checkAnime(force = false, specificAnime = null) {
  const list = specificAnime ? [specificAnime] : animeList;

  for (const animeName of list) {
    try {
      const query = `
      query {
        Media(search: "${animeName}", type: ANIME) {
          title { romaji }
          coverImage { large }
          nextAiringEpisode {
            episode
            airingAt
          }
        }
      }`;

      const res = await axios.post('https://graphql.anilist.co', { query });
      const data = res.data.data.Media;

     if (!data.nextAiringEpisode) continue;


      const nextEpisode = data.nextAiringEpisode.episode;
      const releasedEpisode = nextEpisode - 1;
      const airingTime = data.nextAiringEpisode.airingAt * 1000;
      const now = Date.now();
// tempo restante em ms
const timeLeft = airingTime - now;

// chave única (anime + episódio)
const key = `${data.title.romaji}-${nextEpisode}`;

// aviso 10 minutos antes (600000 ms)
if (timeLeft <= 600000 && timeLeft > 0 && !notifiedEpisodes[key]) {
  notifiedEpisodes[key] = true;

  // 💾 salva aqui (CORRETO)
  fs.writeFileSync('notified.json', JSON.stringify(notifiedEpisodes, null, 2));

  const channel = await client.channels.fetch(CHANNEL_ID);

  const minutes = Math.floor(timeLeft / 60000);

  const embed = new EmbedBuilder()
    .setColor(0x00ffcc)
    .setTitle(`📺 ${data.title.romaji}`)
    .setDescription(
      `⏰ Episódio **${nextEpisode}** sai em **${minutes} minutos!**`
    )
    .setImage(data.coverImage?.large || null)
    .setFooter({ text: 'Anime Alert' })
    .setTimestamp();

  channel.send({ embeds: [embed] });
}

      if (force || (airingTime <= now && airingTime > now - 120000)) {
        const channel = await client.channels.fetch(CHANNEL_ID);

        const date = new Date(airingTime);
        const formattedTime = date.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });

        const embed = new EmbedBuilder()
          .setColor(0xffcc00)
          .setTitle(`📺 ${data.title.romaji}`)
          .setDescription(
            `✅ Último: Episódio **${releasedEpisode}**\n` +
            `📺 Próximo: ${nextEpisode}\n🕒 ${formattedTime}`
          )
          .setImage(data.coverImage?.large || null)
          .setFooter({ text: 'Anime Alert' })
          .setTimestamp();

        channel.send({ embeds: [embed] });
      }

    } catch (err) {
      console.log("Erro:", err.message);
    }
  }
}

// COMANDOS
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
// NEXT
if (message.content.startsWith('!next ')) {
  const animeName = message.content.replace('!next ', '').trim();

  try {
    const query = `
    query {
      Media(search: "${animeName}", type: ANIME) {
        title { romaji }
        coverImage { large }
        episodes
        status
        endDate {
          day
          month
          year
        }
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }`;

    const res = await axios.post('https://graphql.anilist.co', { query });
    const data = res.data.data.Media;

    if (!data) {
      return message.reply('❌ Anime não encontrado.');
    }

    // 🧠 MAPA DE STATUS
    const statusMap = {
      FINISHED: "Finalizado",
      RELEASING: "Em exibição",
      NOT_YET_RELEASED: "Ainda não lançado",
      CANCELLED: "Cancelado",
      HIATUS: "Em hiato"
    };

    const status = statusMap[data.status] || data.status;

    // ⚠️ SEM EPISÓDIO FUTURO
    if (!data.nextAiringEpisode) {
      const lastEpisode = data.episodes || "Desconhecido";

      let endDateText = "Data desconhecida";
      if (data.endDate && data.endDate.year) {
        const d = data.endDate.day?.toString().padStart(2, '0') || '??';
        const m = data.endDate.month?.toString().padStart(2, '0') || '??';
        const y = data.endDate.year;
        endDateText = `${d}/${m}/${y}`;
      }

      const embed = new EmbedBuilder()
        .setColor(0xff9900)
        .setTitle(`📺 ${data.title.romaji}`)
        .setDescription(
          `⚠️ Nenhum episódio futuro confirmado.\n` +
          `📼 Último episódio: **${lastEpisode}**\n` +
          `📅 Data final: ${endDateText}\n` +
          `📊 Status: ${status}`
        )
        .setImage(data.coverImage?.large || null)
        .setFooter({ text: `Criado por André Castro • Assistido por ChatGPT • ${VERSION}` })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    // ✅ COM EPISÓDIO FUTURO
    const episode = data.nextAiringEpisode.episode;
    const airingTime = data.nextAiringEpisode.airingAt * 1000;

    const date = new Date(airingTime);
    const formattedTime = date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    const embed = new EmbedBuilder()
      .setColor(0x00ccff)
      .setTitle(`📺 ${data.title.romaji}`)
      .setDescription(
        `🎯 Próximo episódio: **${episode}**\n` +
        `⏰ ${formattedTime}\n` +
        `📊 Status: ${status}`
      )
      .setImage(data.coverImage?.large || null)
      .setFooter({ text: `Criado por André Castro • Assistido por ChatGPT • ${VERSION}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });

  } catch (err) {
    console.log(err);
    message.reply('❌ Erro ao buscar anime.');
  }
}  // TEST
  if (message.content.startsWith('!test ')) {
  const animeName = message.content.replace('!test ', '');

  const timeout = setTimeout(() => {
    message.reply('⏱️ Tempo esgotado... talvez o nome do anime esteja errado.');
  }, 10000);

  try {
    await checkAnime(true, animeName);
    clearTimeout(timeout);
  } catch (err) {
    clearTimeout(timeout);
    message.reply('❌ Erro ao buscar anime.');
  }
}

  // ADD
if (message.content.startsWith('!add ')) {
  const inputName = message.content.replace('!add ', '').trim();

  try {
    // 🔎 busca principal
    const query = `
    query {
      Media(search: "${inputName}", type: ANIME) {
        title { romaji }
      }
    }`;

    const res = await axios.post('https://graphql.anilist.co', { query });
    const data = res.data.data.Media;

    if (!data) {
      throw new Error("Not found");
    }

    const correctName = data.title.romaji;

    if (animeList.includes(correctName)) {
      return message.reply('⚠️ Esse anime já está na lista.');
    }

    animeList.push(correctName);
    fs.writeFileSync('animes.json', JSON.stringify(animeList, null, 2));

    return message.reply(`✅ Adicionado: **${correctName}**`);

  } catch {
    // 🔥 SUGESTÕES
    try {
      const searchQuery = `
      query {
        Page(perPage: 5) {
          media(search: "${inputName}", type: ANIME) {
            title { romaji }
          }
        }
      }`;

      const res = await axios.post('https://graphql.anilist.co', { query: searchQuery });
      const results = res.data.data.Page.media;

      if (!results || results.length === 0) {
        return message.reply('❌ Anime não encontrado.');
      }

      const suggestions = results.map(a => `• ${a.title.romaji}`).join('\n');

      return message.reply(
        `❌ Anime não encontrado.\nVocê quis dizer:\n${suggestions}`
      );

    } catch (err) {
      console.log(err);
      message.reply('❌ Erro ao buscar sugestões.');
    }
  }
}

  // LIST
  if (message.content === '!list') {
    if (animeList.length === 0) {
      return message.reply('📭 Nenhum anime na lista.');
    }

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle('📺 Animes Monitorados')
      .setDescription(animeList.map(a => `• ${a}`).join('\n'))
      .setFooter({ text: `Criado por André Castro • Assistido por ChatGPT • ${VERSION}` })
      .setTimestamp()

    message.reply({ embeds: [embed] });
  }
// INFO
if (message.content.startsWith('!info ')) {
  const animeName = message.content.replace('!info ', '').trim();

  try {
    const query = `
    query {
      Media(search: "${animeName}", type: ANIME) {
        title { romaji }
        description
        averageScore
        episodes
        status
        studios {
          nodes {
            name
          }
        }
        coverImage { large }
      }
    }`;

    const res = await axios.post('https://graphql.anilist.co', { query });
    const data = res.data.data.Media;

    if (!data) {
      return message.reply('❌ Anime não encontrado.');
    }

    // 🧠 Limitar descrição (Discord corta textos grandes)
    let description = data.description
      ?.replace(/<[^>]*>/g, '') // remove HTML
      .slice(0, 300);

    if (data.description && data.description.length > 300) {
      description += '...';
    }

    // 🧠 Status traduzido
    const statusMap = {
      FINISHED: "Finalizado",
      RELEASING: "Em exibição",
      NOT_YET_RELEASED: "Ainda não lançado",
      CANCELLED: "Cancelado",
      HIATUS: "Em hiato"
    };

    const status = statusMap[data.status] || data.status;

    const studio = data.studios?.nodes[0]?.name || "Desconhecido";

    const embed = new EmbedBuilder()
      .setColor(0x9933ff)
      .setTitle(`📺 ${data.title.romaji}`)
      .setDescription(description || "Sem descrição disponível.")
      .addFields(
        { name: '⭐ Nota', value: `${data.averageScore || "N/A"}`, inline: true },
        { name: '🎬 Episódios', value: `${data.episodes || "?"}`, inline: true },
        { name: '📊 Status', value: status, inline: true },
        { name: '🎥 Estúdio', value: studio, inline: true }
      )
      .setImage(data.coverImage?.large || null)
      .setFooter({ text: `Criado por André Castro • Assistido por ChatGPT • ${VERSION}` })
      .setTimestamp();

    message.reply({ embeds: [embed] });

  } catch (err) {
    console.log(err);
    message.reply('❌ Erro ao buscar informações.');
  }
}
// HELP
if (message.content === '!help') {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📖 Comandos do AnimeDBot')
    .setDescription('Aqui estão todos os comandos disponíveis:')
    .addFields(
      {
        name: '📺 Animes',
        value:
          '`!add <nome>` → Adiciona anime à lista\n' +
          '`!remove <nome>` → Remove anime\n' +
          '`!list` → Mostra lista de animes\n' +
          '`!clearlist` → Remove todos os animes',
      },
      {
        name: '⏰ Episódios',
        value:
          '`!next <nome>` → Próximo episódio\n' +
          '`!test <nome>` → Teste manual',
      },
      {
        name: '📚 Informações',
        value:
          '`!info <nome>` → Detalhes do anime\n' +
          '`!about` → Sobre o bot',
      }
    )
    .setFooter({
      text: `Criado por André • Assistido por ChatGPT • ${VERSION}`
    })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}
// ABOUT
if (message.content === '!about') {
  const embed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🤖 Sobre o Bot')
    .setDescription(
      `Este bot foi criado por **André Castro**.\n\n` +
      `💻 Desenvolvimento: André Castro\n` +
      `🧠 Assistência técnica: ChatGPT\n\n` +
      `Todos os direitos e autoria do projeto pertencem ao criador.`
    )
    .setFooter({ text: 'AnimeDBot' })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}
// CLEAR LIST (CONFIRMAÇÃO)
if (message.content === '!clearlist') {
  return message.reply('⚠️ Tem certeza? Digite `!confirmclear` para apagar tudo.');
}

if (message.content === '!confirmclear') {
  animeList = [];
  fs.writeFileSync('animes.json', JSON.stringify(animeList, null, 2));

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('🧹 Lista Limpa')
    .setDescription('Todos os animes foram removidos da lista.')
    .setFooter({
      text: `Criado por André • Assistido por ChatGPT • ${VERSION}`
    })
    .setTimestamp();

  message.reply({ embeds: [embed] });
}
  // REMOVE
  if (message.content.startsWith('!remove ')) {
    const animeName = message.content.replace('!remove ', '').toLowerCase();

    const index = animeList.findIndex(a => a.toLowerCase() === animeName);

    if (index === -1) {
      return message.reply('❌ Esse anime não está na lista.');
    }

    const removed = animeList[index];
    animeList.splice(index, 1);

    fs.writeFileSync('animes.json', JSON.stringify(animeList, null, 2));

    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('🗑️ Anime Removido')
      .setDescription(`**${removed}** foi removido da lista.`)
      .setFooter({ text: `Criado por André Castro • Assistido por ChatGPT • ${VERSION}` })
.setTimestamp();

    message.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);