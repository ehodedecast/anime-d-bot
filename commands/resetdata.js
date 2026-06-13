const {
  MessageFlags
} = require('discord.js');

const {
  createPasswordModal
} = require('../utils/modals');

const {
  resetAnimeDBotData,
  detectEnvironment
} = require('../utils/dataReset');

const REQUIRED_CONFIRMATION =
  'RESET_ANIMEDBOT_DATA';

const RESETDATA_PASSWORD_MODAL_ID =
  'modal_resetdata_password';

function getOwnerId() {

  return (
    process.env.OWNER_ID ||
    process.env.BOT_OWNER_ID
  );
}

function isBotOwner(
  interaction
) {

  const ownerId =
    getOwnerId();

  return Boolean(
    ownerId &&
    interaction.user.id === ownerId
  );
}

function isResetPasswordConfigured() {

  return Boolean(
    process.env.RESETDATA_PASSWORD
  );
}

function isResetPasswordValid(
  value
) {

  return (
    isResetPasswordConfigured() &&
    value === process.env.RESETDATA_PASSWORD
  );
}

function formatFinalMessage(
  result
) {

  const validationStatus =
    result.storageOk
      ? 'Aprovada'
      : 'Falhou';

  const storageStatus =
    result.validation
      .map(item =>
        `${item.valid ? 'OK' : 'ERRO'} ${item.fileName}`
      )
      .join('\n');

  return [
    '⚠️ ATENÇÃO',
    '',
    'Você acabou de apagar os dados do ambiente atual.',
    '',
    `Ambiente detectado: ${result.environment}`,
    '',
    `Backup criado: ${result.backup.backupDir}`,
    `Arquivos no backup: ${result.backup.copiedFiles.join(', ') || 'nenhum'}`,
    '',
    `Arquivos resetados: ${result.resetFiles.join(', ')}`,
    '',
    `Validação final: ${validationStatus}`,
    '',
    'Status do storage:',
    storageStatus,
    '',
    `Resultado final: ${result.storageOk ? 'Reset concluído com sucesso.' : 'Reset concluído, mas a validação encontrou erro.'}`,
    '',
    'Este comando é temporário e deve ser removido após o uso.'
  ].join('\n');
}

async function resetdata(
  interaction
) {

  if (
    !isBotOwner(
      interaction
    )
  ) {

    return interaction.reply({
      content:
        'Você não tem permissão para utilizar este comando.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (
    !isResetPasswordConfigured()
  ) {

    return interaction.reply({
      content:
        'Reset password is not configured.',
      flags: MessageFlags.Ephemeral
    });
  }

  const confirmation =
    interaction.options.getString(
      'confirmation'
    );

  if (
    confirmation !==
    REQUIRED_CONFIRMATION
  ) {

    return interaction.reply({
      content:
        'Confirmação inválida.\n\nPara executar este comando você deve informar:\n\nRESET_ANIMEDBOT_DATA\n\nNenhuma alteração foi realizada.',
      flags: MessageFlags.Ephemeral
    });
  }

  return interaction.showModal(
    createPasswordModal(
      RESETDATA_PASSWORD_MODAL_ID,
      'Reset Password',
      'Reset Password'
    )
  );
}

async function executeResetData(
  interaction
) {

  const environment =
    detectEnvironment();

  await interaction.reply({
    content:
      [
        '⚠️ ATENÇÃO',
        '',
        'Você está prestes a apagar os dados do ambiente atual.',
        '',
        `Ambiente detectado: ${environment}`,
        '',
        'Backup será criado antes da limpeza.',
        '',
        'Esta ação não pode ser desfeita automaticamente.',
        '',
        'Iniciando reset...'
      ].join('\n'),
    flags: MessageFlags.Ephemeral
  });

  const result =
    resetAnimeDBotData();

  return interaction.editReply({
    content:
      formatFinalMessage(
        result
      )
  });
}

module.exports = resetdata;
module.exports.executeResetData =
  executeResetData;
module.exports.isBotOwner =
  isBotOwner;
module.exports.isResetPasswordValid =
  isResetPasswordValid;
module.exports.RESETDATA_PASSWORD_MODAL_ID =
  RESETDATA_PASSWORD_MODAL_ID;
module.exports.REQUIRED_CONFIRMATION =
  REQUIRED_CONFIRMATION;
