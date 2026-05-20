const {

  loadGuildHistory,

  saveGuildHistory

} = require(

  '../utils/guildHistoryStorage'
);

async function guildDelete(
  guild
) {

  try {

    const history =

      loadGuildHistory();

    const guildData =
      history[guild.id];

    if (!guildData) {

      return;
    }

    guildData.currentlyInServer =
      false;

    const now =
      new Date();

    guildData.lastLeftAt =
      now.toISOString();

    // ⏳ LAST SESSION

    const lastSession =

      guildData.history[
        guildData.history.length - 1
      ];

    if (
      lastSession &&
      !lastSession.leftAt
    ) {

      lastSession.leftAt =
        now.toISOString();

      const joinedAt =
        new Date(
          lastSession.joinedAt
        );

      guildData.totalTimeMs +=

        now - joinedAt;
    }

    saveGuildHistory(
      history
    );

    console.log(

      `📤 Left server: ${guild.name}`
    );

  } catch (err) {

    console.log(

      `💥 guildDelete error: ${err.message}`
    );
  }
}

module.exports =
  guildDelete;