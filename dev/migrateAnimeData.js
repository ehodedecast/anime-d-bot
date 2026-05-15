const {

  loadAnimeData,

  saveAnimeData

} = require(
  '../utils/animeStorage'
);

async function migrateAnimeData() {

  const animeData =
    loadAnimeData();

  let migrated = 0;

  for (
    const guildId in animeData
  ) {

    const guildData =
      animeData[guildId];

    // ⏭️ ALREADY MIGRATED

    if (
      guildData.anime
    ) {

      continue;
    }

    // 🔄 OLD FORMAT

    if (
      Array.isArray(
        guildData
      )
    ) {

      animeData[guildId] = {

        guildName:
          'Unknown Guild',

        anime:
          guildData
      };

      migrated++;

      console.log(

`✅ Migrated guild:
${guildId}`
      );
    }
  }

  saveAnimeData(
    animeData
  );

  console.log(

`\n🎉 Migration complete.`

  );

  console.log(

`📚 Migrated guilds:
${migrated}`
  );
}

module.exports =
  migrateAnimeData;