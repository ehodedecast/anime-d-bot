const createEmbed =
  require('../utils/embed');

const state =
  require('../state/state');

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

        anime.status;

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

  results

) {

  state
    .waitingForAddSelection[
      userId
    ] = {

      results
    };
}

function clearSelectionState(
  userId
) {

  delete state
    .waitingForAddSelection[
      userId
    ];
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

  createSelectionEmbed
};