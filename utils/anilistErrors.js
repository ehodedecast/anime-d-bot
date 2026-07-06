const TEMPORARY_ANILIST_STATUSES =
  new Set([
    429,
    500,
    502,
    503,
    504
  ]);

function getAniListStatus(
  error
) {

  return Number(
    error?.response?.status
  );
}

function isTemporaryAniListError(
  error
) {

  const status =
    getAniListStatus(
      error
    );

  const data =
    error?.response?.data || {};

  return Boolean(
    TEMPORARY_ANILIST_STATUSES.has(status) ||
    data.retryable === true ||
    data.cloudflare_error === true
  );
}

function getRetryAfterMs(
  error
) {

  const retryAfter =
    error?.response?.headers?.['retry-after'];

  if (
    !retryAfter
  ) {
    return 0;
  }

  const seconds =
    Number(retryAfter);

  if (
    Number.isFinite(seconds)
  ) {
    return Math.max(
      0,
      seconds * 1000
    );
  }

  const retryAt =
    Date.parse(
      retryAfter
    );

  if (
    Number.isNaN(retryAt)
  ) {
    return 0;
  }

  return Math.max(
    0,
    retryAt - Date.now()
  );
}

function isAniListNotFoundError(
  error
) {

  const status =
    getAniListStatus(
      error
    );

  const errors =
    error?.response?.data?.errors;

  return Boolean(
    status === 404 ||
    (
      Array.isArray(errors) &&
      errors.some(item =>
        /not found/i.test(
          String(item?.message || '')
        )
      )
    )
  );
}

module.exports = {
  getRetryAfterMs,
  isAniListNotFoundError,
  isTemporaryAniListError
};
