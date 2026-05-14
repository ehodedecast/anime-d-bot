const {

  searchAnime:
    searchAniListAnime

} = require(
  '../providers/anilist'
);

const {

  searchAnime:
    searchJikanAnime

} = require(
  '../providers/jikan'
);

const {

  loadMappings,

updateProviderSyncTime,

wasRecentlySynced,

  registerAnimeMapping

} = require(
  './animeMappingService'
);

// 🔍 FIND BEST TITLE MATCH

function findMatchingAnime(

  results,

  targetTitle

) {

  return results.find(

    anime =>

      anime.title
        .romaji
        ?.toLowerCase?.() ===

      targetTitle
        ?.toLowerCase?.()
  );
}

// 🔄 SYNC PROVIDERS

async function syncAnimeProviders(
  anime
) {

  try {

    const title =
      anime.title;

      // ⏱️ TTL CHECK

if (

  wasRecentlySynced(
    title,
    24
  )

) {

  console.log(

`⏭️ Skipping sync for ${title}`
  );

  return;
}

    console.log(

      `🔄 Syncing providers for: ${title}`
    );

    // 📡 SEARCH JIKAN

    const jikanResults =

      await searchJikanAnime(
        title
      );

console.log(
  jikanResults.map(
    anime =>
      anime.title
  )
);

    const matchedJikan =

      findMatchingAnime(

        jikanResults,

        title
      );

    if (
      matchedJikan
    ) {

      registerAnimeMapping(

        matchedJikan,

        'jikan'
      );

      console.log(

        `✅ Jikan mapped for ${title}`
      );
    }

    // 📡 SEARCH ANILIST

    const aniListResults =

      await searchAniListAnime(
        title
      );

    const matchedAniList =

      findMatchingAnime(

        aniListResults,

        title
      );

    if (
      matchedAniList
    ) {

      registerAnimeMapping(

        matchedAniList,

        'anilist'
      );

      console.log(

        `✅ AniList mapped for ${title}`
      );
    }
// 💾 UPDATE SYNC TIME

updateProviderSyncTime(
  title
);
  } catch (err) {

    console.log(

      'Provider sync failed:',

      err.message
    );
  }
}

module.exports = {

  syncAnimeProviders
};