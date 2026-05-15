const {

  loadAnimeData,

  saveAnimeData

} = require(
  '../utils/animeStorage'
);

const devReply =
  require(
    '../utils/devReply'
  );

async function repairGuildNames(

  message,

  client

) {

  const animeData =
    loadAnimeData();

  let repaired = 0;

  for (
    const guildId in
    animeData
  ) {

    try {

      const guild =

        await client.guilds.fetch(
          guildId
        );

      if (
        !guild
      ) {

        continue;
      }

      animeData[guildId]
        .guildName =

        guild.name;

      repaired++;

      console.log(

`🔧 Repaired:
${guild.name}`
      );

    } catch (err) {

      console.log(

`❌ Failed:
${guildId}`
      );
    }
  }

  saveAnimeData(
    animeData
  );

  return devReply(

    message,

`✅ Guild repair complete.

🔧 Repaired:
${repaired}`
  );
}

module.exports =
  repairGuildNames;