const axios =
  require('axios');

async function searchAnime(
  inputName
) {

  const query = `

query ($search: String) {

  Page(perPage: 10) {

    media(

      search: $search,

      type: ANIME

    ) {

      id

      isAdult

      status

      format

      seasonYear

      title {

        romaji
      }

      coverImage {

        large
      }

      nextAiringEpisode {

        episode

        airingAt
      }

      relations {

        edges {

          relationType

          node {

            id

            title {

              romaji
            }

            format

            status
          }
        }
      }
    }
  }
}`;

  const variables = {

    search: inputName
  };

  const response =
    await axios.post(

      'https://graphql.anilist.co/graphql',

      {

        query,

        variables
      }
    );

  return response
  .data
  .data
  .Page
  .media
  .map(anime => ({

    id:
      anime.id,

    title:
      anime.title
        ?.romaji ||

      'Unknown',

    isAdult:
      anime.isAdult,

    status:
      anime.status,

    format:
      anime.format,

    seasonYear:
      anime.seasonYear,

    coverImage:
      anime.coverImage,

    nextAiringEpisode:
      anime.nextAiringEpisode,

    relations:
      anime.relations
  }));
}

module.exports = {

  searchAnime
};