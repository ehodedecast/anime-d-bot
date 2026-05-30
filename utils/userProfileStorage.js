const fs =
  require('fs');

const PATH =
  './data/userProfiles.json';

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

function loadUserProfiles() {

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

function saveUserProfiles(
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

function ensureUserProfile(
  userId,
  username = 'Unknown User'
) {

  const data =
    loadUserProfiles();

  if (
    !data[userId]
  ) {

    data[userId] = {
      username
    };

    saveUserProfiles(
      data
    );
  }

  data[userId].username =
    username ||
    data[userId].username ||
    'Unknown User';

  saveUserProfiles(
    data
  );

  return data[userId];
}

module.exports = {
  loadUserProfiles,
  saveUserProfiles,
  ensureUserProfile
};
