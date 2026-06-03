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

      siteUrl

      isAdult

      status

      format

      seasonYear

      startDate {

        year

        month

        day
      }

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

      externalLinks {

        site

        url
      }

      trailer {

        id

        site

        thumbnail
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
console.log(
  response
    .data
    .data
    .Page
    .media
);
  return response
  .data
  .data
  .Page
  .media
  .map(anime => ({

    id:
      anime.id,

    siteUrl:
      anime.siteUrl,

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

    startDate:
      anime.startDate,

    coverImage:
      anime.coverImage,

    nextAiringEpisode:
      anime.nextAiringEpisode,

    externalLinks:
      anime.externalLinks || [],

    trailer:
      anime.trailer,

    relations:
      anime.relations
  }));
}

module.exports = {

  searchAnime
};
