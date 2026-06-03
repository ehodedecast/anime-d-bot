const STREAMING_PROVIDERS = [
  {
    key: 'crunchyroll',
    label: 'Crunchyroll',
    hosts: [
      'crunchyroll.com'
    ]
  },
  {
    key: 'netflix',
    label: 'Netflix',
    hosts: [
      'netflix.com'
    ]
  }
];

const SOCIAL_HOSTS = [
  'x.com',
  'twitter.com',
  'instagram.com',
  'facebook.com',
  'tiktok.com'
];

const TRAILER_HOSTS = [
  'youtube.com',
  'youtu.be'
];

const REFERENCE_HOSTS = [
  'anilist.co',
  'myanimelist.net'
];

function isValidUrl(value) {
  try {
    const url = new URL(value);

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .trim();
}

function getHostname(value) {
  try {
    return new URL(value)
      .hostname
      .replace(/^www\./, '')
      .toLowerCase();
  } catch {
    return '';
  }
}

function hostMatches(value, hosts) {
  const hostname =
    getHostname(value);

  return hosts.some(host =>
    hostname === host ||
    hostname.endsWith(`.${host}`)
  );
}

function isSocialUrl(value) {
  return hostMatches(
    value,
    SOCIAL_HOSTS
  );
}

function isTrailerUrl(value) {
  return hostMatches(
    value,
    TRAILER_HOSTS
  );
}

function isReferenceUrl(value) {
  return hostMatches(
    value,
    REFERENCE_HOSTS
  );
}

function isBlockedUrl(value) {
  return (
    isSocialUrl(value) ||
    isTrailerUrl(value) ||
    isReferenceUrl(value)
  );
}

function getExternalLinks(anime) {
  return Array.isArray(anime?.externalLinks)
    ? anime.externalLinks
    : [];
}

function getProviderMatch(link) {
  const haystack =
    `${normalize(link?.site)} ` +
    `${normalize(link?.name)} ` +
    `${normalize(link?.url)}`;

  return STREAMING_PROVIDERS.find(provider =>
    haystack.includes(provider.key) ||
    provider.hosts.some(host =>
      hostMatches(link?.url, [host])
    )
  );
}

function findStreamingLink(anime) {
  if (
    isValidUrl(anime?.streamingUrl) &&
    !isBlockedUrl(anime.streamingUrl)
  ) {
    const provider =
      STREAMING_PROVIDERS.find(item =>
        hostMatches(
          anime.streamingUrl,
          item.hosts
        )
      );

    if (provider) {
      return {
        url:
          anime.streamingUrl,
        provider:
          anime.streamingProvider ||
          provider.label
      };
    }
  }

  const candidates =
    getExternalLinks(anime)
      .filter(link =>
        isValidUrl(link?.url) &&
        !isBlockedUrl(link.url)
      )
      .map(link => ({
        link,
        provider:
          getProviderMatch(link)
      }))
      .filter(candidate =>
        candidate.provider
      );

  candidates.sort((a, b) =>
    STREAMING_PROVIDERS.indexOf(a.provider) -
    STREAMING_PROVIDERS.indexOf(b.provider)
  );

  const best =
    candidates[0];

  if (!best) {
    return null;
  }

  return {
    url:
      best.link.url,
    provider:
      best.provider.label
  };
}

function findOfficialSite(anime) {
  if (
    isValidUrl(anime?.officialSiteUrl) &&
    !isBlockedUrl(anime.officialSiteUrl)
  ) {
    return anime.officialSiteUrl;
  }

  const official =
    getExternalLinks(anime)
      .find(link => {
        const label =
          `${normalize(link?.site)} ${normalize(link?.name)}`;

        return (
          isValidUrl(link?.url) &&
          !isBlockedUrl(link.url) &&
          (
            label.includes('official') ||
            label.includes('site oficial')
          )
        );
      });

  return official?.url || null;
}

function findSocialLink(anime) {
  const social =
    getExternalLinks(anime)
      .find(link =>
        isValidUrl(link?.url) &&
        isSocialUrl(link.url)
      );

  return social?.url || null;
}

function findTrailerLink(anime) {
  if (
    anime?.trailer?.id &&
    normalize(anime?.trailer?.site).includes('youtube')
  ) {
    return `https://www.youtube.com/watch?v=${anime.trailer.id}`;
  }

  if (
    isValidUrl(anime?.trailer?.url) &&
    isTrailerUrl(anime.trailer.url)
  ) {
    return anime.trailer.url;
  }

  if (
    isValidUrl(anime?.trailerUrl) &&
    isTrailerUrl(anime.trailerUrl)
  ) {
    return anime.trailerUrl;
  }

  const trailer =
    getExternalLinks(anime)
      .find(link =>
        isValidUrl(link?.url) &&
        isTrailerUrl(link.url)
      );

  return trailer?.url || null;
}

function getAnimePageUrl(anime) {
  if (
    isValidUrl(anime?.animePageUrl)
  ) {
    return anime.animePageUrl;
  }

  if (
    isValidUrl(anime?.siteUrl)
  ) {
    return anime.siteUrl;
  }

  if (anime?.id) {
    return `https://anilist.co/anime/${anime.id}`;
  }

  return null;
}

function getAnimeLinkFields(anime) {
  const streaming =
    findStreamingLink(anime);

  return {
    streamingUrl:
      streaming?.url || null,
    streamingProvider:
      streaming?.provider || null,
    officialSiteUrl:
      findOfficialSite(anime),
    animePageUrl:
      getAnimePageUrl(anime),
    socialUrl:
      findSocialLink(anime),
    trailerUrl:
      findTrailerLink(anime)
  };
}

function getBestWatchTarget(anime) {
  const fields =
    getAnimeLinkFields(anime);

  return {
    url:
      fields.streamingUrl,
    label:
      'Assistir',
    isStreaming:
      Boolean(fields.streamingUrl),
    provider:
      fields.streamingProvider,
    officialSiteUrl:
      fields.officialSiteUrl,
    animePageUrl:
      fields.animePageUrl
  };
}

module.exports = {
  getAnimeLinkFields,
  getBestWatchTarget,
  isBlockedUrl,
  isReferenceUrl,
  isSocialUrl,
  isTrailerUrl,
  isValidUrl
};
