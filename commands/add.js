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

  createSelectionEmbed,

  createSelectionRows

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
  userAnimeAlreadyExists,
  saveAnimeToUser
} = require('../utils/userAnimeStorage');

const {
  ensureUserProfile
} = require('../utils/userProfileStorage');

const {
  saveAnimeToCache
} = require('../utils/animeCacheService');

const {
  validateAniListAnimeById
} = require('../utils/animeHealthValidation');

const {
  handleTrailerAfterAdd
} = require('../utils/trailerNotifications');

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

const {
  createAddNavigationRow
} = require(
  '../utils/navigationButtons'
);

const {
  createNotificationSettingsRow
} = require('../utils/notificationSettings');

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
      skipSelection &&
      selectedAnime
        ? [
            selectedAnime
          ]
        : await searchAnime(
            inputName
          );

    // 🎯 MANUAL SELECTION RESULT

    // ❌ NO RESULTS

    if (
      !hasResults(results)
    ) {

      return message.reply(

        t(
          message.guild.id,
          'anime_not_found'
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

        topResults,

        'add',

        {
          inputName
        }
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

        embeds: [embed],

        components:
          createSelectionRows(
            topResults
          )
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

      userAnimeAlreadyExists(

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

    const isFirstPersonalAnime =
      animeList.length === 0;

const mapping =

  registerAnimeMapping(

    anime,

    'anilist'
  );

    // 🎯 MODE

    const validation =
      await validateAniListAnimeById(
        anime.id
      );

    if (
      validation.status === 'temporary'
    ) {
      return message.reply({
        content:
          [
            'Nao consegui validar este anime na AniList agora.',
            '',
            'Isso parece ser um erro temporario da AniList/Cloudflare. Tente adicionar novamente em alguns minutos.',
            '',
            'Nenhum anime foi colocado em quarentena.'
          ].join('\n'),
        components: [
          createAddNavigationRow()
        ]
      });
    }

    const finalAnime =
      validation.status === 'valid'
        ? {
            ...anime,
            ...validation.anime
          }
        : anime;

    const quarantineFields =
      validation.status === 'invalid'
        ? {
            invalid: true,
            quarantined: true,
            invalidReason:
              validation.reason ||
              'AniList validation failed',
            quarantineReason:
              validation.reason ||
              'AniList validation failed',
            invalidDetectedAt:
              new Date().toISOString(),
            quarantinedAt:
              new Date().toISOString()
          }
        : {};

    const mode =
      getAnimeMode(
        finalAnime
      );

    // 💾 SAVE

    saveAnimeToUser(

      message.author.id,

      message.author.username,

      finalAnime,

      mode,

      quarantineFields
    );

    ensureUserProfile(
      message.author.id,
      message.author.username
    );

    if (
      isFirstPersonalAnime &&
      message.client
    ) {
      try {
        const user =
          await message.client.users.fetch(
            message.author.id
          );

        await user.send({
          content:
            'AnimeDBot usa DMs para enviar suas notificações pessoais. Você pode configurar essas notificações aqui.',
          components: [
            createNotificationSettingsRow({
              userId:
                message.author.id,
              guildId:
                message.guild.id
            })
          ]
        });
      } catch (err) {
        console.log(
          `Could not send notification settings DM to ${message.author.id}: ${err.message}`
        );
      }
    }

    if (
      validation.status === 'valid'
    ) {
      saveAnimeToCache(
        finalAnime
      );
    }

    if (
      validation.status === 'valid'
    ) {
      await handleTrailerAfterAdd({
        client:
          message.client,
        userId:
          message.author.id,
        username:
          message.author.username,
        anime:
          finalAnime,
        guildId:
          message.guild.id
      });
    }

    // 📊 ANALYTICS

    registerSuccessfulAdd(

      finalAnime,

      message.guild.id
    );
    // 🔄 PROVIDER SYNC

if (
  validation.status === 'valid'
) {
  syncAnimeProviders(
    finalAnime
  );
}

    // 🎨 EMBED

    const embed =

      createAnimeAddedEmbed({

        guildId:
          message.guild.id,

        anime:
          finalAnime,

        mode,

        autoSelected:
          results.length > 1
      });

    return message.reply({

      content:
        validation.status === 'invalid'
          ? [
              `⚠️ ${message.author.username} adicionou ${finalAnime.title} à lista pessoal, mas ele está em quarentena.`,
              '',
              `Motivo: ${validation.reason || 'AniList validation failed'}`,
              'Este anime não será monitorado até ser reparado.'
            ].join('\n')
          : `✅ ${message.author.username} adicionou ${finalAnime.title} à lista pessoal.`,

      embeds: [embed],

      components: [
        createAddNavigationRow()
      ]
    });

    return message.reply({

      content:
        `✅ ${message.author.username} adicionou ${anime.title} à lista pessoal.`,

      embeds: [embed],

      components: [
        createAddNavigationRow()
      ]
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
