const fs =
  require('fs');

const path =
  require('path');

const validateStorage =
  require('./storageValidator');

const {
  REQUIRED_DATA_FILES,
  cloneDefaultData
} = require('./dataSchemas');

const DATA_DIR =
  path.resolve(
    'data'
  );

function detectEnvironment() {

  if (
    process.env.RAILWAY_ENVIRONMENT ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.RAILWAY_SERVICE_ID ||
    process.env.RAILWAY_VOLUME_MOUNT_PATH
  ) {

    return 'Railway';
  }

  return 'Local';
}

function createTimestamp() {

  return new Date()
    .toISOString()
    .replace(/\.\d+Z$/, '')
    .replace(/:/g, '-')
    .replace('T', '-');
}

function ensureDataDirectory() {

  if (
    !fs.existsSync(
      DATA_DIR
    )
  ) {

    fs.mkdirSync(
      DATA_DIR,
      {
        recursive: true
      }
    );
  }
}

function listRootJsonFiles() {

  ensureDataDirectory();

  return fs
    .readdirSync(
      DATA_DIR,
      {
        withFileTypes: true
      }
    )
    .filter(entry =>
      entry.isFile() &&
      entry.name.endsWith('.json')
    )
    .map(entry =>
      entry.name
    );
}

function createBackup() {

  ensureDataDirectory();

  const backupDir =
    path.join(
      DATA_DIR,
      'backups',
      `reset-${createTimestamp()}`
    );

  fs.mkdirSync(
    backupDir,
    {
      recursive: true
    }
  );

  const copiedFiles = [];

  for (
    const fileName of
    listRootJsonFiles()
  ) {

    fs.copyFileSync(
      path.join(
        DATA_DIR,
        fileName
      ),
      path.join(
        backupDir,
        fileName
      )
    );

    copiedFiles.push(
      fileName
    );
  }

  return {
    backupDir,
    copiedFiles
  };
}

function writeJsonFile(
  fileName,
  data
) {

  fs.writeFileSync(
    path.join(
      DATA_DIR,
      fileName
    ),
    JSON.stringify(
      data,
      null,
      2
    )
  );
}

function resetDataFiles() {

  ensureDataDirectory();

  const resetFiles = [];

  for (
    const fileName of
    Object.keys(
      REQUIRED_DATA_FILES
    )
  ) {

    writeJsonFile(
      fileName,
      cloneDefaultData(
        fileName
      )
    );

    resetFiles.push(
      fileName
    );
  }

  return resetFiles;
}

function validateSchema(
  fileName,
  data
) {

  const expected =
    REQUIRED_DATA_FILES[
      fileName
    ];

  if (
    Array.isArray(
      expected
    )
  ) {

    return Array.isArray(
      data
    );
  }

  if (
    typeof expected === 'object' &&
    expected !== null
  ) {

    return (
      data &&
      typeof data === 'object' &&
      !Array.isArray(data)
    );
  }

  return true;
}

function validateDataFiles() {

  const results = [];

  validateStorage();

  for (
    const fileName of
    Object.keys(
      REQUIRED_DATA_FILES
    )
  ) {

    const filePath =
      path.join(
        DATA_DIR,
        fileName
      );

    let valid = false;

    try {

      const data =
        JSON.parse(
          fs.readFileSync(
            filePath,
            'utf8'
          )
        );

      valid =
        validateSchema(
          fileName,
          data
        );

    } catch {

      valid = false;
    }

    results.push({
      fileName,
      valid
    });
  }

  return results;
}

function resetAnimeDBotData() {

  const environment =
    detectEnvironment();

  const backup =
    createBackup();

  const resetFiles =
    resetDataFiles();

  const validation =
    validateDataFiles();

  return {
    environment,
    backup,
    resetFiles,
    validation,
    storageOk:
      validation.every(
        item => item.valid
      )
  };
}

module.exports = {
  detectEnvironment,
  createBackup,
  resetDataFiles,
  validateDataFiles,
  resetAnimeDBotData
};
