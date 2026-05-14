function hasResults(
  results
) {

  return (
    Array.isArray(results) &&
    results.length > 0
  );
}

function isAdultAnime(
  anime
) {

  return anime.isAdult;
}

function isValidSelection(

  choice,

  max

) {

  return (

    !isNaN(choice) &&

    choice >= 1 &&

    choice <= max
  );
}

function isTrackingAnime(
  anime
) {

  const trackingStatuses = [

    'RELEASING',

    'NOT_YET_RELEASED'
  ];

  return trackingStatuses.includes(
    anime.status
  );
}

function getAnimeMode(
  anime
) {

  return isTrackingAnime(
    anime
  )

    ? 'tracking'

    : 'library';
}

module.exports = {

  hasResults,

  isAdultAnime,

  isValidSelection,

  isTrackingAnime,

  getAnimeMode
};