const fs =
  require('fs');

const PATH =
  './data/userAnimes.json';

function ensureFile() {

  if (
    !fs.existsSync(
      './data'
    )
  ) {

    fs.mkdirSync(
      './data'
    );
  }

  if (
    !fs.existsSync(
      PATH
    )
  ) {

    fs.writeFileSync(
      PATH,
      '{}'
    );
  }
}

function isValidSchema(
  data
) {

  return (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data)
  );
}

function healFile() {

  fs.writeFileSync(
    PATH,
    JSON.stringify(
      {},
      null,
      2
    )
  );
}

function loadUserAnimes() {

  ensureFile();

  try {

    const data =
      JSON.parse(
        fs.readFileSync(
          PATH,
          'utf8'
        )
      );

    if (
      !isValidSchema(
        data
      )
    ) {

      healFile();

      return {};
    }

    return data;

  } catch {

    healFile();

    return {};
  }
}

function saveUserAnimes(
  data
) {

  ensureFile();

  if (
    !isValidSchema(
      data
    )
  ) {

    data = {};
  }

  fs.writeFileSync(
    PATH,
    JSON.stringify(
      data,
      null,
      2
    )
  );
}

function ensureUserAnimeData(
  userId,
  username = 'Unknown User'
) {

  const data =
    loadUserAnimes();

  if (
    !data[userId]
  ) {

    data[userId] = {
      username,
      anime: []
    };

    saveUserAnimes(
      data
    );
  }

  if (
    Array.isArray(
      data[userId]
    )
  ) {

    data[userId] = {
      username,
      anime:
        data[userId]
    };
  }

  if (
    !Array.isArray(
      data[userId].anime
    )
  ) {

    data[userId].anime = [];
  }

  data[userId].username =
    username ||
    data[userId].username ||
    'Unknown User';

  saveUserAnimes(
    data
  );

  return data;
}

function getUserAnimeList(
  userId,
  username
) {

  const data =
    ensureUserAnimeData(
      userId,
      username
    );

  return data[userId].anime;
}

function userAnimeAlreadyExists(
  animeList,
  animeId
) {

  return (animeList || []).find(
    anime =>
      String(anime.id) ===
      String(animeId)
  );
}

function saveAnimeToUser(
  userId,
  username,
  anime,
  mode
) {

  const data =
    ensureUserAnimeData(
      userId,
      username
    );

  data[userId]
    .anime
    .push({
      id:
        anime.id,

      title:
        anime.title,

      coverImage:
        anime.coverImage || null,

      mode
    });

  saveUserAnimes(
    data
  );
}

module.exports = {
  loadUserAnimes,
  saveUserAnimes,
  ensureUserAnimeData,
  getUserAnimeList,
  userAnimeAlreadyExists,
  saveAnimeToUser
};
