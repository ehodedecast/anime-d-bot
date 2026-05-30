const axios = require('axios');

const chalk = require('chalk').default;

const {
  loadUserAnimes,
  saveUserAnimes
} = require('./userAnimeStorage');

async function repairInvalidAnime() {

  const animeData =
    loadUserAnimes();

  let repaired = 0;

  for (const userId in animeData) {

    const animeList =
      animeData[userId]?.anime || [];

    for (const anime of animeList) {

      if (!anime.invalid) {
        continue;
      }

      console.log(
        chalk.yellow(
          `🛠️ Testing repair for: ${anime.title}`
        )
      );

      try {

        const query = `
        query {
          Media(id: ${anime.id}, type: ANIME) {
            id
            title {
              romaji
            }
          }
        }`;

        const res =
          await axios.post(
            'https://graphql.anilist.co/graphql',
            { query }
          );

        const data =
          res.data?.data?.Media;

        if (!data) {

         console.log(
  chalk.yellow(
    `🔍 Attempting auto-repair search: ${anime.title}`
  )
);

try {

  const searchQuery = `
  query {

    Media(
      search: ${JSON.stringify(anime.title)},
      type: ANIME
    ) {

      id

      title {
        romaji
      }
    }
  }`;

  const searchRes =
    await axios.post(
      'https://graphql.anilist.co/graphql',
      { query: searchQuery }
    );

  const foundAnime =

    searchRes.data
      ?.data
      ?.Media;

  if (!foundAnime) {

    console.log(
      chalk.red(
        `❌ Auto-repair failed: ${anime.title}`
      )
    );

    continue;
  }

  console.log(
    chalk.green(
      `🛠️ Auto-repair success: ${anime.title} -> ${foundAnime.id}`
    )
  );

  anime.id =
    foundAnime.id;

  anime.title =
    foundAnime.title.romaji;

  delete anime.invalid;
  delete anime.invalidReason;
  delete anime.invalidDetectedAt;

  repaired++;

} catch (searchErr) {

  console.log(
    chalk.red(
      `❌ Auto-search failed: ${anime.title}`
    )
  );
}

continue;
        }

        delete anime.invalid;
        delete anime.invalidReason;
        delete anime.invalidDetectedAt;

        anime.title =
          data.title.romaji;

        repaired++;

        console.log(
          chalk.green(
            `✅ Anime repaired: ${anime.title}`
          )
        );

      } catch (err) {

        console.log(
          chalk.red(
            `❌ Repair failed: ${anime.title}`
          )
        );
      }
    }
  }

  saveUserAnimes(
    animeData
  );

  console.log(
    chalk.blue(
      `🔧 Repair complete | Restored: ${repaired}`
    )
  );
}

module.exports = repairInvalidAnime;
