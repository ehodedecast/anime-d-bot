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

  return animeList.find(

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

    animeData[guildId] = [];
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

  animeData[guildId].push({

    id:
      anime.id,

    title:
      anime.title.romaji,

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