const axios = require('axios');

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder
} = require('discord.js');

const {
  loadUserAnimes,
  saveUserAnimes
} = require('./userAnimeStorage');

const {
  saveAnimeToCache
} = require('./animeCacheService');

const {
  getRetryAfterMs,
  isTemporaryAniListError
} = require('./anilistErrors');

const SESSION_TTL_MS =
  10 * 60 * 1000;

const sessions =
  new Map();

const CUSTOM_IDS = {
  select:
    'repair_select',
  validateSame:
    'repair_validate_same',
  newId:
    'repair_new_id',
  apply:
    'repair_apply',
  back:
    'repair_back',
  cancel:
    'repair_cancel',
  modalNewId:
    'repair_new_id_modal'
};

function getOwnerId() {

  return (
    process.env.OWNER_ID ||
    process.env.BOT_OWNER_ID
  );
}

function isOwner(
  interaction
) {

  const ownerId =
    getOwnerId();

  return Boolean(
    ownerId &&
    interaction.user.id === ownerId
  );
}

function createSessionId() {

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function cleanupSessions() {

  const now =
    Date.now();

  for (
    const [sessionId, session] of sessions.entries()
  ) {
    if (
      session.expiresAt <= now
    ) {
      sessions.delete(
        sessionId
      );
    }
  }
}

function createSession(
  ownerId
) {

  cleanupSessions();

  const sessionId =
    createSessionId();

  sessions.set(
    sessionId,
    {
      ownerId,
      createdAt:
        Date.now(),
      expiresAt:
        Date.now() + SESSION_TTL_MS,
      selected:
        null,
      validated:
        null
    }
  );

  return sessionId;
}

function getSession(
  sessionId,
  userId
) {

  cleanupSessions();

  const session =
    sessions.get(
      sessionId
    );

  if (
    !session ||
    session.ownerId !== userId
  ) {
    return null;
  }

  return session;
}

function deleteSession(
  sessionId
) {

  sessions.delete(
    sessionId
  );
}

function getAnimeTitle(
  anime
) {

  return (
    anime?.title?.romaji ||
    anime?.title ||
    'Unknown'
  );
}

function formatDate(
  value
) {

  if (!value) {
    return 'unknown';
  }

  return String(value);
}

function getReason(
  anime
) {

  return (
    anime.invalidReason ||
    anime.quarantineReason ||
    anime.repairProposalStatus ||
    'unknown'
  );
}

function isQuarantinedAnime(
  anime
) {

  return Boolean(
    anime &&
    (
      anime.invalid ||
      anime.quarantined
    )
  );
}

function getQuarantinedAnime() {

  const data =
    loadUserAnimes();

  const grouped =
    new Map();

  for (
    const userId of Object.keys(data || {})
  ) {

    const list =
      data[userId]?.anime || [];

    for (
      const anime of list
    ) {
      if (
        !isQuarantinedAnime(
          anime
        )
      ) {
        continue;
      }

      const key =
        String(anime.id);

      const item =
        grouped.get(key) || {
          id:
            anime.id,
          title:
            getAnimeTitle(anime),
          reason:
            getReason(anime),
          quarantinedAt:
            anime.quarantinedAt ||
            anime.invalidDetectedAt ||
            null,
          affectedUsers:
            new Set(),
          sample:
            anime
        };

      item.affectedUsers.add(
        userId
      );

      grouped.set(
        key,
        item
      );
    }
  }

  return Array.from(
    grouped.values()
  )
    .map(item => ({
      ...item,
      affectedCount:
        item.affectedUsers.size,
      affectedUsers:
        Array.from(
          item.affectedUsers
        )
    }))
    .sort((a, b) =>
      String(a.title)
        .localeCompare(
          String(b.title)
        )
    );
}

function createText(
  content
) {

  return new TextDisplayBuilder()
    .setContent(
      content
    );
}

function createContainer(
  textBlocks,
  actionRows = []
) {

  const container =
    new ContainerBuilder()
      .setAccentColor(
        0xff6600
      );

  textBlocks.forEach(
    (block, index) => {
      if (
        index > 0
      ) {
        container.addSeparatorComponents(
          new SeparatorBuilder()
            .setDivider(true)
        );
      }

      container.addTextDisplayComponents(
        createText(
          block
        )
      );
    }
  );

  actionRows.forEach(row => {
    container.addActionRowComponents(
      row
    );
  });

  return {
    flags:
      MessageFlags.IsComponentsV2,
    components: [
      container
    ]
  };
}

function buildInitialPanel(
  sessionId
) {

  const items =
    getQuarantinedAnime();

  if (
    !items.length
  ) {
    return createContainer([
      [
        '## AnimeDBot Repair Center',
        '',
        'Nenhum anime em quarentena encontrado.'
      ].join('\n')
    ]);
  }

  const lines =
    items
      .slice(0, 10)
      .map((item, index) =>
        [
          `${index + 1}. **${item.title}**`,
          `ID atual: ${item.id}`,
          `Afetando: ${item.affectedCount} usuario(s)`,
          `Motivo: ${item.reason}`
        ].join('\n')
      );

  const select =
    new StringSelectMenuBuilder()
      .setCustomId(
        `${CUSTOM_IDS.select}:${sessionId}`
      )
      .setPlaceholder(
        'Selecione um anime para reparar'
      )
      .addOptions(
        items
          .slice(0, 25)
          .map(item => ({
            label:
              String(item.title)
                .slice(0, 100),
            description:
              `ID ${item.id} - ${item.affectedCount} user(s)`
                .slice(0, 100),
            value:
              String(item.id)
          }))
      );

  const row =
    new ActionRowBuilder()
      .addComponents(
        select
      );

  return createContainer(
    [
      [
        '## AnimeDBot Repair Center',
        '',
        `Animes em quarentena encontrados: ${items.length}`,
        '',
        ...lines,
        '',
        'Selecione um anime abaixo para reparar.'
      ].join('\n')
    ],
    [
      row
    ]
  );
}

function findQuarantinedById(
  animeId
) {

  return getQuarantinedAnime()
    .find(item =>
      String(item.id) === String(animeId)
    ) || null;
}

function createDetailsRows(
  sessionId,
  animeId
) {

  return [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `${CUSTOM_IDS.validateSame}:${sessionId}:${animeId}`
          )
          .setLabel(
            'Validar mesmo ID'
          )
          .setStyle(
            ButtonStyle.Primary
          ),
        new ButtonBuilder()
          .setCustomId(
            `${CUSTOM_IDS.newId}:${sessionId}:${animeId}`
          )
          .setLabel(
            'Informar novo ID'
          )
          .setStyle(
            ButtonStyle.Secondary
          ),
        new ButtonBuilder()
          .setCustomId(
            `${CUSTOM_IDS.cancel}:${sessionId}`
          )
          .setLabel(
            'Cancelar'
          )
          .setStyle(
            ButtonStyle.Danger
          )
      )
  ];
}

function buildDetailsPanel(
  sessionId,
  item
) {

  return createContainer(
    [
      [
        '## Anime selecionado',
        '',
        `Titulo salvo: ${item.title}`,
        `ID atual: ${item.id}`,
        `Usuarios afetados: ${item.affectedCount}`,
        `Motivo: ${item.reason}`,
        `Data da quarentena: ${formatDate(item.quarantinedAt)}`
      ].join('\n')
    ],
    createDetailsRows(
      sessionId,
      item.id
    )
  );
}

function createApplyRows(
  sessionId,
  brokenId,
  candidateId
) {

  return [
    new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId(
            `${CUSTOM_IDS.apply}:${sessionId}:${brokenId}:${candidateId}`
          )
          .setLabel(
            'Aplicar reparo'
          )
          .setStyle(
            ButtonStyle.Success
          ),
        new ButtonBuilder()
          .setCustomId(
            `${CUSTOM_IDS.back}:${sessionId}:${brokenId}`
          )
          .setLabel(
            'Voltar'
          )
          .setStyle(
            ButtonStyle.Secondary
          ),
        new ButtonBuilder()
          .setCustomId(
            `${CUSTOM_IDS.cancel}:${sessionId}`
          )
          .setLabel(
            'Cancelar'
          )
          .setStyle(
            ButtonStyle.Danger
          )
      )
  ];
}

function buildComparisonPanel({
  sessionId,
  broken,
  candidate
}) {

  const next =
    candidate.nextAiringEpisode
      ? `Episodio ${candidate.nextAiringEpisode.episode} em ${new Date(candidate.nextAiringEpisode.airingAt * 1000).toISOString()}`
      : 'unknown';

  return createContainer(
    [
      [
        '## Reparo proposto',
        '',
        '**Anime em quarentena:**',
        `${broken.title}`,
        `ID atual: ${broken.id}`,
        '',
        '**Resultado AniList:**',
        `${getAnimeTitle(candidate)}`,
        `Novo ID: ${candidate.id}`,
        `Status: ${candidate.status || 'unknown'}`,
        `Episodes: ${candidate.episodes || 'unknown'}`,
        `Next airing: ${next}`,
        '',
        '**Confianca:**',
        'ID validado com sucesso pela AniList.'
      ].join('\n')
    ],
    createApplyRows(
      sessionId,
      broken.id,
      candidate.id
    )
  );
}

async function validateAniListId(
  id
) {

  const numericId =
    Number(id);

  if (
    !Number.isInteger(numericId) ||
    numericId <= 0
  ) {
    return null;
  }

  const query = `
    query {
      Media(id: ${numericId}, type: ANIME) {
        id
        type
        format
        status
        episodes
        siteUrl
        title {
          romaji
          english
          native
        }
        coverImage {
          large
          medium
        }
        nextAiringEpisode {
          episode
          airingAt
        }
        externalLinks {
          site
          url
        }
        trailer {
          id
          site
          thumbnail
        }
        startDate {
          year
          month
          day
        }
      }
    }`;

  let res;

  try {
    res =
      await axios.post(
        'https://graphql.anilist.co/graphql',
        {
          query
        }
      );
  } catch (err) {
    if (
      isTemporaryAniListError(
        err
      )
    ) {
      const retryAfterMs =
        getRetryAfterMs(
          err
        );

      console.log(
        'AniList temporary error, skipping quarantine'
      );

      if (
        retryAfterMs
      ) {
        console.log(
          `AniList retry-after received: ${Math.ceil(retryAfterMs / 1000)}s`
        );
      }
    }

    throw err;
  }

  if (
    Array.isArray(
      res.data?.errors
    ) &&
    res.data.errors.length
  ) {
    const error =
      new Error(
        'AniList GraphQL errors returned'
      );

    error.response = {
      status:
        res.status,
      data:
        res.data,
      headers:
        res.headers
    };

    throw error;
  }

  return res.data?.data?.Media || null;
}

function updateAnimeFromCandidate(
  anime,
  candidate,
  brokenId
) {

  anime.previousId =
    anime.id;
  anime.id =
    candidate.id;
  anime.title =
    getAnimeTitle(
      candidate
    );
  anime.coverImage =
    candidate.coverImage?.large ||
    candidate.coverImage?.medium ||
    anime.coverImage ||
    null;
  anime.mode =
    candidate.nextAiringEpisode
      ? 'tracking'
      : anime.mode || 'library';
  anime.repairedAt =
    new Date().toISOString();
  anime.repairSource =
    'manual_owner';
  anime.previousBrokenId =
    brokenId;

  delete anime.invalid;
  delete anime.quarantined;
  delete anime.invalidReason;
  delete anime.invalidDetectedAt;
  delete anime.quarantineReason;
  delete anime.quarantinedAt;
  delete anime.repairProposalStatus;
  delete anime.repairProposalSentAt;
  delete anime.repairCandidates;
}

function applyManualRepair(
  brokenId,
  candidate
) {

  const data =
    loadUserAnimes();

  let repaired = 0;
  let quarantineRemoved = false;

  for (
    const userId of Object.keys(data || {})
  ) {

    const list =
      data[userId]?.anime || [];

    for (
      const anime of list
    ) {
      if (
        String(anime.id) !== String(brokenId)
      ) {
        continue;
      }

      if (
        isQuarantinedAnime(anime)
      ) {
        quarantineRemoved = true;
      }

      updateAnimeFromCandidate(
        anime,
        candidate,
        brokenId
      );

      repaired++;
    }
  }

  if (
    repaired > 0
  ) {
    saveUserAnimes(
      data
    );

    saveAnimeToCache(
      candidate
    );
  }

  return {
    repaired,
    quarantineRemoved,
    cacheUpdated:
      repaired > 0
  };
}

function buildFinalPanel({
  brokenId,
  candidate,
  result
}) {

  return createContainer([
    [
      '## Reparo concluido',
      '',
      `Anime: ${getAnimeTitle(candidate)}`,
      `ID anterior: ${brokenId}`,
      `ID aplicado: ${candidate.id}`,
      `Titulo AniList: ${getAnimeTitle(candidate)}`,
      `Listas reparadas: ${result.repaired}`,
      `Quarentena removida: ${result.quarantineRemoved ? 'sim' : 'nao'}`,
      `Cache atualizado: ${result.cacheUpdated ? 'sim' : 'nao'}`
    ].join('\n')
  ]);
}

function buildCancelledPanel() {

  return createContainer([
    [
      '## Reparo cancelado',
      '',
      'Nenhuma alteracao foi realizada.'
    ].join('\n')
  ]);
}

function expiredPayload() {

  return {
    content:
      'Sessao de reparo expirada. Execute /repairanime novamente.',
    flags:
      MessageFlags.Ephemeral
  };
}

function notAllowedPayload() {

  return {
    content:
      'Voce nao tem permissao para usar este comando.',
    flags:
      MessageFlags.Ephemeral
  };
}

module.exports = {
  CUSTOM_IDS,
  applyManualRepair,
  buildComparisonPanel,
  buildCancelledPanel,
  buildDetailsPanel,
  buildFinalPanel,
  buildInitialPanel,
  createSession,
  deleteSession,
  expiredPayload,
  findQuarantinedById,
  getSession,
  isOwner,
  notAllowedPayload,
  validateAniListId
};
