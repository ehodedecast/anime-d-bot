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

const devReply =
  require(
    '../utils/devReply'
  );

async function testQuery(

  message,

  query

) {

  const startedAt =
    Date.now();

  try {

    // 📡 ANILIST

    const aniListResults =

      await searchAniListAnime(
        query
      );

    // 📡 JIKAN

    const jikanResults =

      await searchJikanAnime(
        query
      );

    const duration =

      Date.now() -
      startedAt;

    const aniListTop =

      aniListResults[0]
        ?.title
        ?.romaji ||

      'None';

    const jikanTop =

      jikanResults[0]
        ?.title
        ?.romaji ||

      'None';

    return devReply(

      message,

`📡 QUERY TEST

🔎 Search:
${query}

🟦 AniList:
${aniListResults.length} results

Top:
${aniListTop}

🟨 Jikan:
${jikanResults.length} results

Top:
${jikanTop}

⏱️ Duration:
${duration}ms`
    );

  } catch (err) {

    console.log(err);

    return devReply(

      message,

`❌ Query test failed.

${err.message}`
    );
  }
}

module.exports =
  testQuery;