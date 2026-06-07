const path = require('path');

const axios = require('axios');

const BACKGROUND_PATH =
  path.join(
    __dirname,
    '..',
    'assets',
    'profile',
    'profilebackground001.png'
  );

const AVATAR_PLACEMENT = {
  detectedCircle: {
    x: 172,
    y: 82,
    width: 357,
    height: 358,
    centerX: 350,
    centerY: 260.5
  },
  x: 184,
  y: 95,
  size: 332
};

function loadSharp() {
  try {
    return require('sharp');
  } catch {
    return null;
  }
}

async function downloadAvatar(
  avatarUrl
) {
  const response =
    await axios.get(
      avatarUrl,
      {
        responseType:
          'arraybuffer',
        timeout:
          10000
      }
    );

  return Buffer.from(
    response.data
  );
}

function createCircleMask(
  size
) {
  return Buffer.from(
    `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
      `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/>` +
    '</svg>'
  );
}

async function createCircularAvatar({
  sharp,
  avatarBuffer,
  size
}) {
  const resizedAvatar =
    await sharp(
      avatarBuffer
    )
      .resize(
        size,
        size,
        {
          fit:
            'cover',
          position:
            'centre'
        }
      )
      .png()
      .toBuffer();

  return sharp(
    resizedAvatar
  )
    .composite([
      {
        input:
          createCircleMask(
            size
          ),
        blend:
          'dest-in'
      }
    ])
    .png()
    .toBuffer();
}

async function renderProfileImage({
  avatarUrl
}) {
  const sharp =
    loadSharp();

  if (
    !sharp
  ) {
    throw new Error(
      'Sharp is not installed. Run npm install sharp.'
    );
  }

  const avatarBuffer =
    await downloadAvatar(
      avatarUrl
    );

  const avatar =
    await createCircularAvatar({
      sharp,
      avatarBuffer,
      size:
        AVATAR_PLACEMENT.size
    });

  return sharp(
    BACKGROUND_PATH
  )
    .composite([
      {
        input:
          avatar,
        left:
          AVATAR_PLACEMENT.x,
        top:
          AVATAR_PLACEMENT.y
      }
    ])
    .png()
    .toBuffer();
}

module.exports = {
  renderProfileImage,
  AVATAR_PLACEMENT,
  BACKGROUND_PATH
};
