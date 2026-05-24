const fs =
  require('fs');

const path =
  require('path');

const SANDBOX_PATH =
  './dev/sandbox';

function ensureSandbox() {

  if (
    !fs.existsSync(
      SANDBOX_PATH
    )
  ) {

    fs.mkdirSync(
      SANDBOX_PATH,
      {
        recursive: true
      }
    );
  }
}

function copyFileToSandbox(
  fileName
) {

  ensureSandbox();

  const source =
    path.join(
      './data',
      fileName
    );

  const destination =
    path.join(
      SANDBOX_PATH,
      fileName
    );

  fs.copyFileSync(
    source,
    destination
  );

  return destination;
}

module.exports = {

  ensureSandbox,

  copyFileToSandbox
};