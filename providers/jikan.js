const axios =
  require('axios');

async function searchAnime(
  inputName
) {

  const response =
    await axios.get(

      'https://api.jikan.moe/v4/anime',

      {

        params: {

          q: inputName,

          limit: 10
        }
      }
    );

  const results =
    response.data.data;

  return results.map(

    anime => ({

      id:
        anime.mal_id,

      isAdult:
        anime.rating
          ?.includes('Hentai'),

      status:
        convertStatus(
          anime.status
        ),

      format:
        convertFormat(
          anime.type
        ),

      seasonYear:
        anime.year,

      title:
  anime.title,

      coverImage: {

        large:
          anime.images
            ?.jpg
            ?.large_image_url
      },

      nextAiringEpisode:
        null,

      relations: {

        edges: []
      }
    })
  );
}

function convertStatus(
  status
) {

  if (
    status ===
    'Currently Airing'
  ) {

    return 'RELEASING';
  }

  if (
    status ===
    'Not yet aired'
  ) {

    return 'NOT_YET_RELEASED';
  }

  if (
    status ===
    'Finished Airing'
  ) {

    return 'FINISHED';
  }

  return 'FINISHED';
}

function convertFormat(
  type
) {

  const map = {

    TV: 'TV',

    Movie: 'MOVIE',

    OVA: 'OVA',

    ONA: 'ONA',

    Special: 'SPECIAL'
  };

  return map[type] || type;
}

module.exports = {

  searchAnime
};