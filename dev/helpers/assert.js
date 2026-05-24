function assertExists(
  value,
  message
) {

  if (!value) {

    throw new Error(
      message
    );
  }
}

function assertArray(
  value,
  message
) {

  if (
    !Array.isArray(value)
  ) {

    throw new Error(
      message
    );
  }
}

function assertEmbed(
  data,
  message =
    'Embed missing'
) {

  if (

    !data.embeds ||

    !data.embeds.length

  ) {

    throw new Error(
      message
    );
  }
}

function assertButtons(
  data,
  message =
    'Buttons missing'
) {

  if (

    !data.components ||

    !data.components.length

  ) {

    throw new Error(
      message
    );
  }
}
function assertNoErrorReply(
  replies
) {

  const hasError =

    replies.some(reply => {

      if (
        typeof reply ===
        'string'
      ) {

        return reply
          .includes(
            'error'
          );
      }

      return false;
    });

  if (hasError) {

    throw new Error(
      'Command replied with error'
    );
  }
}

module.exports = {

  assertExists,

  assertArray,

  assertEmbed,

  assertButtons,
  
  assertNoErrorReply
};