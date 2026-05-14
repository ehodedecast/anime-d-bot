const {

  loadAnalytics,

  saveAnalytics

} = require(
  '../utils/analyticsStorage'
);

function ensureAnimeMetric(
  anime
) {

  const analytics =
    loadAnalytics();

  if (
    !analytics.animeMetrics
  ) {

    analytics.animeMetrics = {};
  }

  if (

    !analytics
      .animeMetrics[
        anime.id
      ]

  ) {

    analytics
      .animeMetrics[
        anime.id
      ] = {

        title:
          anime.title.romaji,

        successfulAdds: 0,

        attemptAdds: 0,

        duplicateAttempts: 0,

        activeGuilds: []
      };
  }

  return analytics;
}

function registerSuccessfulAdd(

  anime,

  guildId

) {

  const analytics =
    ensureAnimeMetric(
      anime
    );

  analytics
    .animeMetrics[
      anime.id
    ]
    .successfulAdds++;

  analytics
    .animeMetrics[
      anime.id
    ]
    .attemptAdds++;

  if (

    !analytics
      .animeMetrics[
        anime.id
      ]
      .activeGuilds
      .includes(guildId)

  ) {

    analytics
      .animeMetrics[
        anime.id
      ]
      .activeGuilds
      .push(guildId);
  }

  saveAnalytics(
    analytics
  );
}

function registerDuplicateAttempt(

  anime

) {

  const analytics =
    ensureAnimeMetric(
      anime
    );

  analytics
    .animeMetrics[
      anime.id
    ]
    .attemptAdds++;

  analytics
    .animeMetrics[
      anime.id
    ]
    .duplicateAttempts++;

  saveAnalytics(
    analytics
  );
}

module.exports = {

  registerSuccessfulAdd,

  registerDuplicateAttempt
};