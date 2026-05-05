const fs = require('fs');

module.exports = async (interaction, animeList, waitingForAdd) => {

  if (interaction.customId === 'menu_add') {
    waitingForAdd[interaction.user.id] = true;
    return interaction.reply('✏️ Digite o nome do anime:');
  }

  if (interaction.customId === 'menu_list') {
    return interaction.reply(
      animeList.length
        ? '📺 ' + animeList.join('\n')
        : '📭 Lista vazia'
    );
  }

  if (interaction.customId === 'menu_clear') {
    animeList.length = 0;
    fs.writeFileSync('animes.json', '[]');
    return interaction.reply('🧹 Lista limpa!');
  }
  if (interaction.customId === 'menu_next') {
  return interaction.reply('🔍 Use: !next <nome do anime>');
}

if (interaction.customId === 'menu_info') {
  return interaction.reply('📚 Use: !info <nome do anime>');
}
};