const {
  saveUserAnimes,
  ensureUserAnimeData
} = require('../utils/userAnimeStorage');
const { t } = require('../utils/language');
const {
  createRemoveNavigationRow
} = require('../utils/navigationButtons');
const {
  createSelectionEmbed,
  createSelectionRows,
  registerSelectionState
} = require('../services/animeSelection');
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

function normalize(
  value
) {

  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function findRemoveCandidates(
  animeList,
  animeName
) {

  const input =
    normalize(
      animeName
    );

  if (!input) {
    return [];
  }

  return animeList
    .map((anime, index) => {

      const title =
        normalize(
          anime.title
        );

      let score = 0;

      if (title === input) {
        score += 100;
      }

      if (title.startsWith(input)) {
        score += 80;
      }

      if (title.includes(input)) {
        score += 60;
      }

      input
        .split(/\s+/)
        .filter(Boolean)
        .forEach(part => {

          if (
            title.includes(part)
          ) {
            score += 20;
          }
        });

      return {
        ...anime,
        index,
        score
      };
    })
    .filter(anime =>
      anime.score > 0
    )
    .sort((a, b) =>
      b.score - a.score
    )
    .slice(0, 5);
}

function createRemoveConfirmRow(
  selectionIndex
) {

  return new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(
          `remove_confirm_${selectionIndex}`
        )
        .setLabel(
          'Remover'
        )
        .setStyle(
          ButtonStyle.Danger
        ),
      new ButtonBuilder()
        .setCustomId(
          'remove_cancel'
        )
        .setLabel(
          'Cancelar'
        )
        .setStyle(
          ButtonStyle.Secondary
        )
    );
}

function remove(
  message,
  animeName,
  confirmedAnime = null
) {

  const data =
    ensureUserAnimeData(
      message.author.id,
      message.author.username
    );

  const animeList =
    data[message.author.id]
      ?.anime || [];

    console.log(animeList);
console.log(animeName);

  let index = -1;

  if (
    confirmedAnime
  ) {

    index =
      animeList.findIndex(
        a =>
          String(a.id) ===
            String(confirmedAnime.id) ||
          normalize(a.title) ===
            normalize(confirmedAnime.title)
      );

  } else {

    const candidates =
      findRemoveCandidates(
        animeList,
        animeName
      );

    if (
      candidates.length === 1
    ) {

      registerSelectionState(
        message.author.id,
        candidates,
        'remove',
        {
          inputName:
            animeName
        }
      );

      return message.reply({
        content:
          `Voce quer remover **${candidates[0].title}**?`,
        components: [
          createRemoveConfirmRow(
            0
          )
        ]
      });
    }

    if (
      candidates.length > 1
    ) {

      registerSelectionState(
        message.author.id,
        candidates,
        'remove',
        {
          inputName:
            animeName
        }
      );

      const embed =
        createSelectionEmbed(
          animeName,
          candidates,
          'Escolha qual anime deseja remover.'
        );

      return message.reply({
        embeds: [embed],
        components:
          createSelectionRows(
            candidates
          )
      });
    }
  }

  if (index === -1) {
    return message.reply(
      t(message.guild.id, 'anime_not_found', { title: animeName })
    );
  }
  

  const removed = animeList[index];

  animeList.splice(index, 1);

  data[message.author.id]
    .anime = animeList;

  saveUserAnimes(data);

  return message.reply({
    content:
      t(
        message.guild.id,
        'anime_removed'
      ) +
      ` ${removed.title}`,

    components: [
      createRemoveNavigationRow()
    ]
  });
}

module.exports = remove;
module.exports.findRemoveCandidates = findRemoveCandidates;
module.exports.createRemoveConfirmRow = createRemoveConfirmRow;
