const axios = require('axios');

const chalk = require('chalk').default;

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const {
  loadUserAnimes,
  saveUserAnimes
} = require('./userAnimeStorage');

const {
  loadCache
} = require('./cacheManager');

function getOwnerId() {

  return (
    process.env.OWNER_ID ||
    process.env.BOT_OWNER_ID
  );
}

function normalizeTitle(
  value
) {

  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(season|saison|temporada)\b/g, '')
    .replace(/\b(second|2nd|third|3rd|part)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function similarityScore(
  left,
  right
) {

  const a =
    normalizeTitle(left);

  const b =
    normalizeTitle(right);

  if (!a || !b) {
    return 0;
  }

  if (a === b) {
    return 1;
  }

  if (
    a.includes(b) ||
    b.includes(a)
  ) {
    return 0.85;
  }

  const aWords =
    new Set(
      a.split(' ')
    );

  const bWords =
    new Set(
      b.split(' ')
    );

  const shared =
    [...aWords]
      .filter(word =>
        bWords.has(word)
      )
      .length;

  const total =
    new Set([
      ...aWords,
      ...bWords
    ]).size;

  return total
    ? shared / total
    : 0;
}

async function validateAniListId(
  id
) {

  const query = `
    query {
      Media(id: ${Number(id)}, type: ANIME) {
        id
        format
        status
        title {
          romaji
          english
          native
        }
        nextAiringEpisode {
          episode
          airingAt
        }
      }
    }`;

  const res =
    await axios.post(
      'https://graphql.anilist.co/graphql',
      {
        query
      }
    );

  return res.data?.data?.Media || null;
}

async function searchAniListCandidates(
  title
) {

  const query = `
    query ($search: String) {
      Page(perPage: 5) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          format
          status
          title {
            romaji
            english
            native
          }
          nextAiringEpisode {
            episode
            airingAt
          }
        }
      }
    }`;

  const res =
    await axios.post(
      'https://graphql.anilist.co/graphql',
      {
        query,
        variables: {
          search: title
        }
      }
    );

  return res.data?.data?.Page?.media || [];
}

function collectLocalCandidateIds(
  brokenAnime,
  userAnimeData
) {

  const ids =
    new Set();

  const brokenTitle =
    normalizeTitle(
      brokenAnime.title
    );

  for (
    const userId in userAnimeData
  ) {

    const animeList =
      userAnimeData[userId]?.anime || [];

    for (
      const anime of animeList
    ) {

      if (
        anime.invalid ||
        !anime.id ||
        anime.id === brokenAnime.id
      ) {
        continue;
      }

      if (
        normalizeTitle(
          anime.title
        ) === brokenTitle
      ) {
        ids.add(
          anime.id
        );
      }
    }
  }

  const cache =
    loadCache();

  for (
    const [id, cachedAnime] of
    Object.entries(
      cache.animes || {}
    )
  ) {

    if (
      normalizeTitle(
        cachedAnime.title
      ) === brokenTitle
    ) {
      ids.add(
        Number(id)
      );
    }
  }

  return [...ids];
}

async function findRepairCandidates(
  brokenAnime,
  userAnimeData
) {

  const candidates =
    new Map();

  const addCandidate =
    async (
      rawCandidate,
      source
    ) => {

      if (
        !rawCandidate?.id ||
        rawCandidate.id === brokenAnime.id
      ) {
        return;
      }

      let data = rawCandidate;

      if (
        !rawCandidate.title?.romaji
      ) {

        data =
          await validateAniListId(
            rawCandidate.id
          );
      }

      if (!data) {
        return;
      }

      const score =
        Math.max(
          similarityScore(
            brokenAnime.title,
            data.title?.romaji
          ),
          similarityScore(
            brokenAnime.title,
            data.title?.english
          )
        );

      if (
        score < 0.45
      ) {
        return;
      }

      candidates.set(
        String(data.id),
        {
          id: data.id,
          title:
            data.title?.romaji ||
            data.title?.english ||
            'Unknown',
          format: data.format || null,
          status: data.status || null,
          nextAiringEpisode:
            data.nextAiringEpisode || null,
          score,
          source
        }
      );
    };

  for (
    const id of collectLocalCandidateIds(
      brokenAnime,
      userAnimeData
    )
  ) {

    try {
      await addCandidate(
        {
          id
        },
        'local/cache'
      );
    } catch {
      // Ignore invalid local candidate.
    }
  }

  try {

    const searchResults =
      await searchAniListCandidates(
        brokenAnime.title
      );

    for (
      const result of searchResults
    ) {

      await addCandidate(
        result,
        'anilist-search'
      );
    }

  } catch {

    console.log(
      chalk.red(
        `Repair candidate search failed: ${brokenAnime.title}`
      )
    );
  }

  return [...candidates.values()]
    .sort((a, b) =>
      b.score - a.score
    )
    .slice(0, 5);
}

function buildRepairRows(
  brokenAnime,
  candidates
) {

  const rows = [];
  let currentRow =
    new ActionRowBuilder();

  candidates
    .slice(0, 4)
    .forEach(candidate => {

      if (
        currentRow.components.length >= 5
      ) {
        rows.push(currentRow);
        currentRow =
          new ActionRowBuilder();
      }

      currentRow.addComponents(
        new ButtonBuilder()
          .setCustomId(
            `repair_apply_${brokenAnime.id}_${candidate.id}`
          )
          .setLabel(
            `Use ${candidate.id}`
          )
          .setStyle(
            ButtonStyle.Success
          )
      );
    });

  currentRow.addComponents(
    new ButtonBuilder()
      .setCustomId(
        `repair_reject_${brokenAnime.id}`
      )
      .setLabel(
        'Reject'
      )
      .setStyle(
        ButtonStyle.Danger
      )
  );

  rows.push(currentRow);

  return rows;
}

async function sendRepairProposal(
  client,
  brokenAnime,
  candidates
) {

  const ownerId =
    getOwnerId();

  if (
    !ownerId ||
    !client?.users?.fetch
  ) {
    return false;
  }

  const owner =
    await client.users.fetch(
      ownerId
    );

  const candidateLines =
    candidates.length
      ? candidates
          .map((candidate, index) =>
            `${index + 1}. ${candidate.title} - ID ${candidate.id} (${Math.round(candidate.score * 100)}%, ${candidate.source})`
          )
          .join('\n')
      : 'No safe candidate was found.';

  const title =
    candidates.length
      ? 'Anime repair needs your decision'
      : 'Anime repair failed';

  const content = [
    title,
    '',
    'Broken anime:',
    `${brokenAnime.title}`,
    `Broken ID: ${brokenAnime.id}`,
    '',
    'Candidates found:',
    candidateLines,
    '',
    candidates.length
      ? 'Approve one candidate or reject this proposal.'
      : 'Please manually provide the correct AniList ID later.'
  ].join('\n');

  await owner.send({
    content:
      content.slice(
        0,
        1900
      ),
    components:
      candidates.length
        ? buildRepairRows(
            brokenAnime,
            candidates
          )
        : []
  });

  return true;
}

function getBrokenAnimeKeys(
  userAnimeData
) {

  const seen =
    new Set();

  const broken = [];

  for (
    const userId in userAnimeData
  ) {

    for (
      const anime of
      userAnimeData[userId]?.anime || []
    ) {

      if (
        !anime.invalid
      ) {
        continue;
      }

      const key =
        `${anime.id}:${normalizeTitle(anime.title)}`;

      if (
        seen.has(key)
      ) {
        continue;
      }

      seen.add(key);
      broken.push(anime);
    }
  }

  return broken;
}

async function repairInvalidAnime(
  client
) {

  console.log(
    chalk.blue(
      'Repair scan started'
    )
  );

  const animeData =
    loadUserAnimes();

  let proposals = 0;

  for (
    const anime of getBrokenAnimeKeys(
      animeData
    )
  ) {

    if (
      anime.repairProposalStatus === 'pending' ||
      anime.repairProposalStatus === 'rejected'
    ) {
      continue;
    }

    console.log(
      chalk.yellow(
        `Broken anime found: ${anime.title}`
      )
    );

    const candidates =
      await findRepairCandidates(
        anime,
        animeData
      );

    console.log(
      chalk.blue(
        `Candidates found: ${candidates.length}`
      )
    );

    try {

      const sent =
        await sendRepairProposal(
          client,
          anime,
          candidates
        );

      if (sent) {

        anime.repairProposalStatus =
          candidates.length
            ? 'pending'
            : 'manual_required';

        anime.repairProposalSentAt =
          new Date().toISOString();

        anime.repairCandidates =
          candidates.map(candidate => ({
            id: candidate.id,
            title: candidate.title,
            score: candidate.score,
            source: candidate.source
          }));

        proposals++;

        console.log(
          chalk.green(
            'Repair proposal sent to owner'
          )
        );
      }

    } catch {

      console.log(
        chalk.red(
          `Could not send repair proposal for ${anime.title}`
        )
      );
    }
  }

  saveUserAnimes(
    animeData
  );

  console.log(
    chalk.blue(
      `Repair scan complete | Proposals: ${proposals}`
    )
  );
}

async function applyRepair(
  brokenId,
  candidateId
) {

  const animeData =
    loadUserAnimes();

  const candidate =
    await validateAniListId(
      candidateId
    );

  if (!candidate) {
    return {
      applied: 0,
      title: null
    };
  }

  let applied = 0;

  for (
    const userId in animeData
  ) {

    for (
      const anime of
      animeData[userId]?.anime || []
    ) {

      if (
        String(anime.id) !== String(brokenId) ||
        !anime.invalid
      ) {
        continue;
      }

      anime.previousId =
        anime.id;

      anime.id =
        candidate.id;

      anime.title =
        candidate.title?.romaji ||
        candidate.title?.english ||
        anime.title;

      anime.repairedAt =
        new Date().toISOString();

      anime.repairSource =
        'owner-approved';

      delete anime.invalid;
      delete anime.invalidReason;
      delete anime.invalidDetectedAt;
      delete anime.quarantined;
      delete anime.quarantineReason;
      delete anime.quarantinedAt;
      delete anime.repairProposalStatus;
      delete anime.repairProposalSentAt;
      delete anime.repairCandidates;

      applied++;
    }
  }

  saveUserAnimes(
    animeData
  );

  console.log(
    chalk.green(
      `Repair applied to ${applied} user lists`
    )
  );

  return {
    applied,
    title:
      candidate.title?.romaji ||
      candidate.title?.english ||
      String(candidateId)
  };
}

function rejectRepair(
  brokenId
) {

  const animeData =
    loadUserAnimes();

  let rejected = 0;

  for (
    const userId in animeData
  ) {

    for (
      const anime of
      animeData[userId]?.anime || []
    ) {

      if (
        String(anime.id) !== String(brokenId) ||
        !anime.invalid
      ) {
        continue;
      }

      anime.repairProposalStatus =
        'rejected';

      anime.repairRejectedAt =
        new Date().toISOString();

      rejected++;
    }
  }

  saveUserAnimes(
    animeData
  );

  console.log(
    chalk.yellow(
      'Repair rejected'
    )
  );

  return rejected;
}

module.exports = repairInvalidAnime;
module.exports.applyRepair = applyRepair;
module.exports.rejectRepair = rejectRepair;
module.exports.findRepairCandidates = findRepairCandidates;
module.exports.normalizeTitle = normalizeTitle;
