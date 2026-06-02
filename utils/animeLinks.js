const STREAMING_PROVIDERS = [
  {
    key: 'crunchyroll',
    label: 'Crunchyroll'
  },
  {
    key: 'netflix',
    label: 'Netflix'
  },
  {
    key: 'hidive',
    label: 'HIDIVE'
  },
  {
    key: 'disney',
    label: 'Disney+'
  },
  {
    key: 'hulu',
    label: 'Hulu'
  },
  {
    key: 'amazon',
    label: 'Amazon Prime Video'
  },
  {
    key: 'prime video',
    label: 'Amazon Prime Video'
  }
];

const BLOCKED_HOSTS = [
  'x.com',
  'twitter.com',
  'instagram.com',
  'facebook.com',
  'youtube.com',
  'youtu.be'
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

function isBlockedUrl(value) {
  const hostname =
    getHostname(value);

  return BLOCKED_HOSTS.some(host =>
    hostname === host ||
    hostname.endsWith(`.${host}`)
  );
}

function getProviderMatch(link) {
  const haystack =
    `${normalize(link?.site)} ` +
    `${normalize(link?.name)} ` +
    `${normalize(link?.url)}`;

  return STREAMING_PROVIDERS.find(provider =>
    haystack.includes(provider.key)
  );
}

function getExternalLinks(anime) {
  return Array.isArray(anime?.externalLinks)
    ? anime.externalLinks
    : [];
}

function findStreamingLink(anime) {
  if (
    isValidUrl(anime?.streamingUrl) &&
    !isBlockedUrl(anime.streamingUrl)
  ) {
    return {
      url: anime.streamingUrl,
      provider:
        anime.streamingProvider ||
        'Streaming'
    };
  }

  const links =
    getExternalLinks(anime)
      .filter(link =>
        isValidUrl(link?.url) &&
        !isBlockedUrl(link.url)
      );

  const candidates =
    links
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
    animePageUrl:
      getAnimePageUrl(anime),
    streamingUrl:
      streaming?.url || null,
    streamingProvider:
      streaming?.provider || null
  };
}

function getBestWatchTarget(anime) {
  const fields =
    getAnimeLinkFields(anime);

  if (fields.streamingUrl) {
    return {
      url:
        fields.streamingUrl,
      label:
        fields.streamingProvider
          ? `Assistir no ${fields.streamingProvider}`
          : 'Assistir',
      isStreaming: true,
      provider:
        fields.streamingProvider
    };
  }

  if (fields.animePageUrl) {
    return {
      url:
        fields.animePageUrl,
      label:
        'Ver pagina do anime',
      isStreaming: false,
      provider: null
    };
  }

  return {
    url: null,
    label:
      'Ver pagina do anime',
    isStreaming: false,
    provider: null
  };
}

module.exports = {
  getAnimeLinkFields,
  getBestWatchTarget,
  isBlockedUrl,
  isValidUrl
};
