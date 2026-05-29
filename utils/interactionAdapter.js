function createInteractionMessage(
  interaction
) {

  return {
    guild:
      interaction.guild,

    channel:
      interaction.channel,

    author:
      interaction.user,

    client:
      interaction.client,

    reply: async (payload) => {

      if (
        interaction.deferred ||
        interaction.replied
      ) {
        return interaction.editReply(
          payload
        );
      }

      return interaction.reply(
        payload
      );
    }
  };
}

module.exports = {
  createInteractionMessage
};
