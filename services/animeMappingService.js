const fs =
  require('fs');

const path =
  require('path');

const mappingPath =
  path.join(

    __dirname,

    '../data/animeMappings.json'
  );

// 📂 LOAD

function loadMappings() {

  if (
    !fs.existsSync(
      mappingPath
    )
  ) {

    return [];
  }

  return JSON.parse(

    fs.readFileSync(
      mappingPath,
      'utf8'
    )
  );
}

// 💾 SAVE

function saveMappings(
  mappings
) {

  fs.writeFileSync(

    mappingPath,

    JSON.stringify(
      mappings,
      null,
      2
    )
  );
}

// 🆔 GENERATE INTERNAL ID

function generateInternalId(
  mappings
) {

  return `adb_${
    mappings.length + 1
  }`;
}

// 🔍 FIND EXISTING MAPPING

function findExistingMapping(

  mappings,

  anime

) {

  return mappings.find(

    mappedAnime =>

      mappedAnime
  .title
  ?.toLowerCase?.() ===

anime
  .title
  ?.toLowerCase?.()
  );
}

// 🔗 REGISTER MAPPING

function registerAnimeMapping(

  anime,

  provider

) {

  const mappings =
    loadMappings();

  // 🔍 CHECK EXISTING

  const existing =

    findExistingMapping(

      mappings,

      anime
    );

  if (
    existing
  ) {

    // ➕ ADD PROVIDER

    existing.providers[
      provider
    ] = anime.id;

    saveMappings(
      mappings
    );

    return existing;
  }

  // 🆕 CREATE NEW

  const newMapping = {

    internalId:

      generateInternalId(
        mappings
      ),

    title:
      anime.title,

    providers: {
      

      [provider]:
        anime.id
    },

    lastProviderSync:
    0

  };

  mappings.push(
    newMapping
  );

  saveMappings(
    mappings
  );

  return newMapping;
}
function updateProviderSyncTime(
  title
) {

  const mappings =
    loadMappings();

  const mapping =
    mappings.find(

      anime =>

        anime.title
          ?.toLowerCase() ===

        title
  ?.toLowerCase?.()
    );

  if (!mapping) {
    return;
  }

  mapping.lastProviderSync =

    Date.now();

  saveMappings(
    mappings
  );
}

function wasRecentlySynced(

  title,

  hours = 24

) {

  const mappings =
    loadMappings();

  const mapping =
    mappings.find(

      anime =>

        anime.title
          ?.toLowerCase?.() ===

        title
  ?.toLowerCase?.()
    );

  if (
    !mapping
  ) {

    return false;
  }

  const lastSync =
    mapping.lastProviderSync || 0;

  const hoursMs =

    hours *
    60 *
    60 *
    1000;

  return (

    Date.now() -
    lastSync

  ) < hoursMs;
}
module.exports = {

  registerAnimeMapping,
  loadMappings,
  updateProviderSyncTime,
  wasRecentlySynced
};
