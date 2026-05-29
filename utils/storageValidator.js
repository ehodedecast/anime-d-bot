const fs =
  require('fs');

const path =
  require('path');

const chalk =
  require('chalk').default;

const {
  REQUIRED_DATA_FILES
} = require('./dataSchemas');

const DATA_DIR =
  './data';

function ensureDirectory() {

  if (
    !fs.existsSync(DATA_DIR)
  ) {

    fs.mkdirSync(DATA_DIR);

    console.log(
      chalk.green(
        '📁 Created data directory'
      )
    );
  }
}

function ensureFile(
  fileName,
  defaultData
) {

  function isSchemaCompatible(
    data
  ) {

    if (
      Array.isArray(
        defaultData
      )
    ) {

      return Array.isArray(
        data
      );
    }

    if (
      defaultData &&
      typeof defaultData === 'object'
    ) {

      return (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data)
      );
    }

    return true;
  }

  const filePath =
    path.join(
      DATA_DIR,
      fileName
    );

  // 📄 CREATE FILE

  if (
    !fs.existsSync(filePath)
  ) {

    fs.writeFileSync(

      filePath,

      JSON.stringify(
        defaultData,
        null,
        2
      )
    );

    console.log(
      chalk.green(
        `📄 Created ${fileName}`
      )
    );

    return;
  }

  // 🔍 VALIDATE JSON

  try {

    const raw =
      fs.readFileSync(
        filePath,
        'utf8'
      );

    const data =
      JSON.parse(raw);

    if (
      !isSchemaCompatible(
        data
      )
    ) {

      console.log(
        chalk.red(
          `Invalid storage schema repaired: ${fileName}`
        )
      );

      fs.writeFileSync(

        filePath,

        JSON.stringify(
          defaultData,
          null,
          2
        )
      );
    }

  } catch {

    console.log(
      chalk.red(
        `💥 Corrupted JSON repaired: ${fileName}`
      )
    );

    fs.writeFileSync(

      filePath,

      JSON.stringify(
        defaultData,
        null,
        2
      )
    );
  }
}

function validateStorage() {

  console.log(
    chalk.cyan(
      '\n🧠 Validating storage...\n'
    )
  );

  ensureDirectory();

  for (
    const fileName in
    REQUIRED_DATA_FILES
  ) {

    ensureFile(

      fileName,

      REQUIRED_DATA_FILES[
        fileName
      ]
    );
  }

  console.log(
    chalk.green(
      '\n✅ Storage validation complete\n'
    )
  );
}

module.exports =
  validateStorage;
