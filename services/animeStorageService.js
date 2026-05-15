const {

  loadAnimeData,

  saveAnimeData

} = require(
  '../utils/animeStorage'
);

function animeAlreadyExists(

  animeList,

  animeId

) {

  return (animeList || []).find(

    anime =>

      anime.id === animeId
  );
}

function ensureGuildAnimeData(
  guildId
) {

  const animeData =
    loadAnimeData();

  if (
    !animeData[guildId]
  ) {

    animeData[guildId] = {

      guildName:
        'Unknown Guild',

      anime: []
    };
  }

  return animeData;
}

function saveAnimeToGuild(

  guildId,

  anime,

  mode

) {

  const animeData =

    ensureGuildAnimeData(
      guildId
    );

  animeData[guildId]
    .anime
    .push({

      id:
        anime.id,

      title:
        anime.title,

      mode
    });

  saveAnimeData(
    animeData
  );
}

module.exports = {

  animeAlreadyExists,

  ensureGuildAnimeData,

  saveAnimeToGuild
};