const createEmbed =
  require('../utils/embed');

const state =
  require('../state/state');

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const statusMap = {

  FINISHED:
    '📚 Finished',

  RELEASING:
    '🔔 Releasing',

  NOT_YET_RELEASED:
    '🕒 Upcoming',

  HIATUS:
    '⏸️ Hiatus',

  CANCELLED:
    '❌ Cancelled'
};

function createSelectionData(
  results
) {

  return results
    .slice(0, 5);
}

function createSelectionDescription(

  topResults

) {

  return topResults.map(

    (anime, index) => {

      const status =

        statusMap[
          anime.status
        ] ||

        anime.status ||

        'Tracked';

      return (

`${index + 1}️⃣ **${anime.title}**
${status}
📺 ${anime.format || 'Unknown'}
📅 ${anime.seasonYear || 'Unknown'}`
      );
    }

  ).join('\n\n');
}

function registerSelectionState(

  userId,

  results,

  action = 'add',

  meta = {}

) {

  state
    .waitingForAddSelection[
      userId
    ] = {

      results
    };

  state
    .waitingForAnimeSelection[
      userId
    ] = {

      action,

      results,

      meta
    };
}

function clearSelectionState(
  userId
) {

  delete state
    .waitingForAddSelection[
      userId
    ];

  delete state
    .waitingForAnimeSelection[
      userId
    ];
}

function createSelectionRows(
  topResults
) {

  const row =
    new ActionRowBuilder();

  topResults.forEach(
    (anime, index) => {

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(
            `anime_select_${index}`
          )
          .setLabel(
            `${index + 1}`
          )
          .setStyle(
            ButtonStyle.Primary
          )
      );
    }
  );

  return [row];
}

function createSelectionEmbed(

  inputName,

  topResults,

  selectionPrompt

) {

  const description =

    createSelectionDescription(
      topResults
    );

  return createEmbed({

    title:

`🎯 "${inputName}" generated ${topResults.length} results`,

    description:

`${description}

${selectionPrompt}`,

    color:
      0x5865F2
  });
}

module.exports = {

  createSelectionData,

  createSelectionDescription,

  registerSelectionState,

  clearSelectionState,

  createSelectionEmbed,

  createSelectionRows
};
