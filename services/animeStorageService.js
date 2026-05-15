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

  // 🆕 GUILD NÃO EXISTE

  if (
    !animeData[guildId]
  ) {

    animeData[guildId] = {

      guildName:
        'Unknown Guild',

      anime: []
    };
  }

  // 🔄 FORMATO ANTIGO

  if (
    Array.isArray(
      animeData[guildId]
    )
  ) {

    animeData[guildId] = {

      guildName:
        'Unknown Guild',

      anime:
        animeData[guildId]
    };
  }

  return animeData;
}

function saveAnimeToGuild(

  guildId,

  guildName,

  anime,

  mode
) {

  const animeData =

    ensureGuildAnimeData(
      guildId
    );
    
    animeData[guildId]
  .guildName = guildName;

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