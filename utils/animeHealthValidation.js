const axios = require('axios');

const {
  isAniListNotFoundError,
  isTemporaryAniListError
} = require('./anilistErrors');

function createAniListGraphQLError(
  response
) {

  const error =
    new Error(
      'AniList GraphQL errors returned'
    );

  error.response = {
    status:
      response.status,
    data:
      response.data,
    headers:
      response.headers
  };

  return error;
}

function normalizeAniListAnime(
  anime
) {

  return {
    id:
      anime.id,
    siteUrl:
      anime.siteUrl,
    title:
      anime.title?.romaji ||
      anime.title ||
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
  };
}

async function validateAniListAnimeById(
  animeId
) {

  const id =
    Number(animeId);

  if (
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return {
      status:
        'invalid',
      reason:
        'Invalid AniList ID'
    };
  }

  const query = `
    query {
      Media(id: ${id}, type: ANIME) {
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
          medium
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
    }`;

  try {
    const response =
      await axios.post(
        'https://graphql.anilist.co/graphql',
        {
          query
        }
      );

    if (
      Array.isArray(
        response.data?.errors
      ) &&
      response.data.errors.length
    ) {
      throw createAniListGraphQLError(
        response
      );
    }

    const media =
      response.data?.data?.Media || null;

    if (
      !media
    ) {
      return {
        status:
          'invalid',
        reason:
          'AniList returned empty media'
      };
    }

    return {
      status:
        'valid',
      anime:
        normalizeAniListAnime(
          media
        )
    };
  } catch (error) {
    if (
      isTemporaryAniListError(
        error
      )
    ) {
      return {
        status:
          'temporary',
        reason:
          'AniList temporary error'
      };
    }

    if (
      isAniListNotFoundError(
        error
      )
    ) {
      return {
        status:
          'invalid',
        reason:
          'AniList Not Found'
      };
    }

    return {
      status:
        'temporary',
      reason:
        error.message || 'AniList validation failed temporarily'
    };
  }
}

module.exports = {
  validateAniListAnimeById
};
