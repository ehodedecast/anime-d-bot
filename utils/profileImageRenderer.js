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

const PROFILE_TEXT_LAYOUT = {
  width: 700,
  height: 1200,
  titlePlaceholder: {
    x: 190,
    y: 475,
    width: 320,
    height: 58,
    radius: 18
  },
  level: {
    x: 350,
    y: 610,
    fontSize: 42
  },
  xp: {
    x: 350,
    y: 665,
    fontSize: 34
  }
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

function escapeSvgText(
  value
) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createProfileTextOverlay({
  progress
}) {
  const {
    width,
    height,
    titlePlaceholder,
    level,
    xp
  } = PROFILE_TEXT_LAYOUT;

  const levelText =
    `Nível ${Math.max(
      1,
      Number(progress?.level) || 1
    )}`;

  const xpText =
    `${Math.max(
      0,
      Number(progress?.currentXp) || 0
    )} / ${Math.max(
      0,
      Number(progress?.requiredXp) || 0
    )}`;

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="${titlePlaceholder.x}"
        y="${titlePlaceholder.y}"
        width="${titlePlaceholder.width}"
        height="${titlePlaceholder.height}"
        rx="${titlePlaceholder.radius}"
        fill="rgba(8, 12, 28, 0.58)"
        stroke="rgba(255, 255, 255, 0.28)"
        stroke-width="2"
      />
      <text
        x="${level.x}"
        y="${level.y}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${level.fontSize}"
        font-weight="700"
        fill="#ffffff"
      >${escapeSvgText(levelText)}</text>
      <text
        x="${xp.x}"
        y="${xp.y}"
        text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${xp.fontSize}"
        font-weight="600"
        fill="#dbeafe"
      >${escapeSvgText(xpText)}</text>
    </svg>
  `);
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
  avatarUrl,
  progress = {
    level: 1,
    currentXp: 0,
    requiredXp: 1000
  }
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
      },
      {
        input:
          createProfileTextOverlay({
            progress
          }),
        left:
          0,
        top:
          0
      }
    ])
    .png()
    .toBuffer();
}

module.exports = {
  renderProfileImage,
  AVATAR_PLACEMENT,
  PROFILE_TEXT_LAYOUT,
  BACKGROUND_PATH
};
