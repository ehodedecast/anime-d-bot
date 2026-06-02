const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder
} = require('discord.js');

const { t } =
  require('./language');

const {
  createMenuBackButton
} = require('./navigationButtons');

function createPageButton({
  customId,
  label,
  style,
  disabled
}) {

  return new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);
}

function isValidImageUrl(value) {
  try {
    const url =
      new URL(value);

    return (
      url.protocol === 'http:' ||
      url.protocol === 'https:'
    );
  } catch {
    return false;
  }
}

function formatAnimeItem({
  guildId,
  anime,
  formattedDate,
  timeLeft
}) {

  return [
    `### ${anime.title}`,
    `${t(guildId, 'next_field_episode')}: Ep ${anime.episode}`,
    `${t(guildId, 'next_field_time_left')}: ${timeLeft}`,
    `${t(guildId, 'next_field_airing')}: ${formattedDate}`
  ].join('\n');
}

function addAnimeCard({
  container,
  guildId,
  anime,
  formattedDate,
  timeLeft
}) {

  const content =
    formatAnimeItem({
      guildId,
      anime,
      formattedDate,
      timeLeft
    });

  if (
    isValidImageUrl(
      anime.image
    )
  ) {
    container.addSectionComponents(
      new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder()
            .setContent(content)
        )
        .setThumbnailAccessory(
          new ThumbnailBuilder()
            .setURL(anime.image)
        )
    );

    return;
  }

  container.addTextDisplayComponents(
    new TextDisplayBuilder()
      .setContent(content)
  );
}

function createNextPayload({
  guildId,
  pageItems,
  safePage,
  totalPages,
  formatTimeLeft
}) {

  const container =
    new ContainerBuilder()
      .setAccentColor(0x00ccff)
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            `# ${t(guildId, 'next_dashboard_title')}`
          )
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder()
          .setContent(
            t(
              guildId,
              'next_dashboard_description'
            )
          )
      )
      .addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(true)
      );

  pageItems.forEach((anime, index) => {
    const formattedDate =
      new Date(
        anime.airingTime
      ).toLocaleString(
        'pt-BR',
        {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }
      );

    if (index > 0) {
      container.addSeparatorComponents(
        new SeparatorBuilder()
          .setDivider(false)
      );
    }

    addAnimeCard({
      container,
      guildId,
      anime,
      formattedDate,
      timeLeft:
        formatTimeLeft(
          anime.timeLeft
        )
    });
  });

  container
    .addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(true)
    )
    .addActionRowComponents(
      new ActionRowBuilder()
        .addComponents(
          createPageButton({
            customId:
              `next_prev_${safePage - 1}`,
            label:
              '<',
            style:
              ButtonStyle.Secondary,
            disabled:
              safePage <= 0
          }),
          createPageButton({
            customId:
              `next_page_${safePage}`,
            label:
              `${safePage + 1}/${totalPages}`,
            style:
              ButtonStyle.Primary,
            disabled:
              true
          }),
          createPageButton({
            customId:
              `next_next_${safePage + 1}`,
            label:
              '>',
            style:
              ButtonStyle.Secondary,
            disabled:
              safePage >= totalPages - 1
          }),
          createMenuBackButton()
        )
    );

  return {
    flags:
      MessageFlags.IsComponentsV2,
    components: [
      container
    ]
  };
}

module.exports = {
  createNextPayload
};
