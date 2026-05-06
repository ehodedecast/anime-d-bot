function list(message, animeList) {
  if (animeList.length === 0) {
    return message.reply('📭 Nenhum anime na lista.');
  }

  return message.reply(
    '📺 Animes:\n' + animeList.map(a => `• ${a}`).join('\n')
  );
}

module.exports = list;