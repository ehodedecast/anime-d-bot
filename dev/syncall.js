const {

  loadAnimeData

} = require(
  '../utils/animeStorage'
);

const devReply =
  require(
    '../utils/devReply'
  );

  const delay =
  require(
    '../utils/delay'
  );

const {

  syncAnimeProviders

} = require(
  '../services/animeProviderSync'
);

async function syncAll(
  message
) {

  const animeData =
    loadAnimeData();

  // 📚 COLLECT ALL UNIQUE ANIME

  const uniqueAnime =
    new Map();

  for (
    const guildId in animeData
  ) {

    const guildAnime =

      animeData[guildId];

    for (
      const anime of guildAnime
    ) {

      if (
        !uniqueAnime.has(
          anime.title
        )
      ) {

        uniqueAnime.set(

          anime.title,

          anime
        );
      }
    }
  }

  const animeList =

    Array.from(
      uniqueAnime.values()
    );

  if (
    !animeList.length
  ) {

    return devReply(
  message,

      '❌ No anime found.'
    );
  }

  await devReply(
    message,
    `🔄 Syncing ${animeList.length} anime...`
  );

  let synced = 0;

  for (
    const anime of animeList
  ) {

    try {
      // ⏱️ THROTTLING

await delay(1500);

      await syncAnimeProviders({

        title: {

          romaji:
            anime.title
        }
      });
      synced++;

      console.log(

`✅ Synced: ${anime.title}`
      );

    } catch (err) {

      console.log(

`❌ Failed: ${anime.title}`
      );
    }
  }

  return devReply(
    message,
    `✅ Sync complete.

📚 Updated:
${synced}/${animeList.length}`
  );
}

module.exports =
  syncAll;