const {

  searchAnime

} = require(
  '../providers/animeProvider'
);

const {

  registerAnimeMapping

} = require(
  '../services/animeMappingService'
);

const {

  sortAnimeResults

} = require(
  '../services/animeScoring'
);

const {

  createSelectionData,

  registerSelectionState,

  createSelectionEmbed

} = require(
  '../services/animeSelection'
);

const {

  hasResults,

  isAdultAnime,

  getAnimeMode

} = require(
  '../services/animeValidation'
);

const {

  syncAnimeProviders

} = require(
  '../services/animeProviderSync'
);

const {

  animeAlreadyExists,

  saveAnimeToGuild

} = require(
  '../services/animeStorageService'
);

const {

  registerSuccessfulAdd,

  registerDuplicateAttempt

} = require(
  '../services/animeAnalytics'
);

const {

  createAnimeAddedEmbed

} = require(
  '../services/animeEmbeds'
);

const { t } =
  require(
    '../utils/language'
  );

async function add(

  message,

  animeList,

  inputName,

  skipSelection = false,

  selectedAnime = null

) {

  try {

    // 📡 SEARCH

    let results =
      await searchAnime(
        inputName
      );

    // 🎯 MANUAL SELECTION RESULT

    if (

      skipSelection &&

      selectedAnime

    ) {

      results = [
        selectedAnime
      ];
    }

    // ❌ NO RESULTS

    if (
      !hasResults(results)
    ) {

      return message.reply(

        t(
          message.guild.id,
          'search_temporarily_disabled'
        )
      );
    }

    // 🎯 SORT

    const normalizedInput =

      inputName
        .toLowerCase()
        .trim();

    sortAnimeResults(

      results,

      normalizedInput
    );

    // 📋 SELECTION MENU

    if (
      !skipSelection
    ) {

      const topResults =

        createSelectionData(
          results
        );

      registerSelectionState(

        message.author.id,

        topResults
      );

      const embed =

        createSelectionEmbed(

          inputName,

          topResults,

          t(
            message.guild.id,
            'selection_prompt'
          )
        );

      return message.reply({

        embeds: [embed]
      });
    }

    // 📺 FINAL ANIME

    const anime =
      results[0];

    // 🔞 ADULT CHECK

    if (
      isAdultAnime(anime)
    ) {

      return message.reply(

        t(
          message.guild.id,
          'adult_content_warning'
        )
      );
    }

    // 📚 DUPLICATE CHECK

    const alreadyExists =

      animeAlreadyExists(

        animeList,

        anime.id
      );

    if (
      alreadyExists
    ) {

      registerDuplicateAttempt(
        anime
      );

      return message.reply(

        t(
          message.guild.id,
          'anime_already_exists'
        )
      );
    }

const mapping =

  registerAnimeMapping(

    anime,

    'anilist'
  );

    // 🎯 MODE

    const mode =
      getAnimeMode(
        anime
      );

    // 💾 SAVE

    saveAnimeToGuild(

      message.guild.id,

      message.guild.name,

      anime,

      mode
    );

    // 📊 ANALYTICS

    registerSuccessfulAdd(

      anime,

      message.guild.id
    );
    // 🔄 PROVIDER SYNC

syncAnimeProviders(
  anime
);

    // 🎨 EMBED

    const embed =

      createAnimeAddedEmbed({

        guildId:
          message.guild.id,

        anime,

        mode,

        autoSelected:
          results.length > 1
      });

    return message.reply({

      embeds: [embed]
    });

  } catch (err) {

    console.log(err);

    return message.reply(

      t(
        message.guild.id,
        'error_occurred'
      )
    );
  }
}

module.exports = add;