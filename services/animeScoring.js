function calculateScore(

  anime,

  normalizedInput

) {

  let score = 0;

  const title =

    anime.title.romaji
      .toLowerCase();

  // 🎯 EXACT MATCH

  if (
    title === normalizedInput
  ) {

    score += 40;
  }

  // 🔍 CONTAINS

  if (
    title.includes(
      normalizedInput
    )
  ) {

    score += 50;
  }

  // 📺 TV PRIORITY

  if (
    anime.format === 'TV'
  ) {

    score += 40;
  }

  // ❌ FORMAT PENALTIES

  if (
    anime.format === 'MOVIE'
  ) {

    score -= 80;
  }

  if (
    anime.format === 'OVA'
  ) {

    score -= 60;
  }

  if (
    anime.format === 'SPECIAL'
  ) {

    score -= 60;
  }

  // 📡 STATUS PRIORITY

  if (
    anime.status ===
    'RELEASING'
  ) {

    score += 120;
  }

  if (
    anime.status ===
    'NOT_YET_RELEASED'
  ) {

    score += 100;
  }

  // 📅 YEAR BONUS

  if (
    anime.seasonYear
  ) {

    score +=
      anime.seasonYear -
      2000;
  }

  return score;
}

function sortAnimeResults(

  results,

  normalizedInput

) {

  return results.sort(

    (a, b) =>

      calculateScore(
        b,
        normalizedInput
      ) -

      calculateScore(
        a,
        normalizedInput
      )
  );
}

module.exports = {

  calculateScore,

  sortAnimeResults
};