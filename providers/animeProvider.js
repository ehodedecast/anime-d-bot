const {

  searchAnime:
    searchAniListAnime

} = require(
  './anilist'
);

const {

  searchAnime:
    searchJikanAnime

} = require(
  './jikan'
);

async function searchAnime(
  inputName
) {

  // 📡 TRY ANILIST

  try {

    const aniListResults =

      await searchAniListAnime(
        inputName
      );

    if (

      aniListResults &&

      aniListResults.length > 0

    ) {

      console.log(
        'Using AniList provider'
      );

      return aniListResults;
    }

  } catch (err) {

    console.log(

      'AniList failed:',

      err.message
    );
  }

  // 📡 FALLBACK JIKAN

  try {

    const jikanResults =

      await searchJikanAnime(
        inputName
      );

    if (

      jikanResults &&

      jikanResults.length > 0

    ) {

      console.log(
        'Using Jikan fallback'
      );

      return jikanResults;
    }

  } catch (err) {

    console.log(

      'Jikan failed:',

      err.message
    );
  }

  // ❌ BOTH FAILED

  return [];
}

module.exports = {

  searchAnime
};