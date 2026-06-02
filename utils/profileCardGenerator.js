const zlib = require('zlib');

const WIDTH = 900;
const HEIGHT = 1200;

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;

    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^
        (0xedb88320 & -(crc & 1));
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer =
    Buffer.from(type);
  const length =
    Buffer.alloc(4);
  const crc =
    Buffer.alloc(4);

  length.writeUInt32BE(data.length);
  crc.writeUInt32BE(
    crc32(
      Buffer.concat([
        typeBuffer,
        data
      ])
    )
  );

  return Buffer.concat([
    length,
    typeBuffer,
    data,
    crc
  ]);
}

function createImage(
  width,
  height,
  color = [18, 22, 31, 255]
) {
  const data =
    Buffer.alloc(width * height * 4);

  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    data[i + 3] = color[3];
  }

  return {
    width,
    height,
    data
  };
}

function setPixel(
  image,
  x,
  y,
  color
) {
  if (
    x < 0 ||
    y < 0 ||
    x >= image.width ||
    y >= image.height
  ) {
    return;
  }

  const index =
    (y * image.width + x) * 4;

  image.data[index] = color[0];
  image.data[index + 1] = color[1];
  image.data[index + 2] = color[2];
  image.data[index + 3] = color[3] ?? 255;
}

function fillRect(
  image,
  x,
  y,
  width,
  height,
  color
) {
  for (let yy = y; yy < y + height; yy += 1) {
    for (let xx = x; xx < x + width; xx += 1) {
      setPixel(image, xx, yy, color);
    }
  }
}

function strokeRect(
  image,
  x,
  y,
  width,
  height,
  color,
  size = 2
) {
  fillRect(image, x, y, width, size, color);
  fillRect(image, x, y + height - size, width, size, color);
  fillRect(image, x, y, size, height, color);
  fillRect(image, x + width - size, y, size, height, color);
}

const FONT = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01111', '10000', '10000', '10011', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '10010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  6: ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  ':': ['00000', '00100', '00100', '00000', '00100', '00100', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '00100', '00100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
};

function drawText(
  image,
  text,
  x,
  y,
  scale,
  color
) {
  const normalized =
    String(text || '')
      .toUpperCase()
      .replace(/[^A-Z0-9:\/\-.? ]/g, ' ');

  let cursor = x;

  for (const char of normalized) {
    const glyph =
      FONT[char] || FONT['?'];

    glyph.forEach((row, yy) => {
      [...row].forEach((pixel, xx) => {
        if (pixel === '1') {
          fillRect(
            image,
            cursor + xx * scale,
            y + yy * scale,
            scale,
            scale,
            color
          );
        }
      });
    });

    cursor += 6 * scale;
  }
}

function drawCenteredText(
  image,
  text,
  y,
  scale,
  color
) {
  const width =
    String(text || '').length * 6 * scale;

  drawText(
    image,
    text,
    Math.floor((image.width - width) / 2),
    y,
    scale,
    color
  );
}

function drawInitialsAvatar(
  image,
  username
) {
  const x = 330;
  const y = 210;
  const size = 240;

  fillRect(image, x, y, size, size, [46, 55, 78, 255]);
  strokeRect(image, x, y, size, size, [0, 204, 255, 255], 6);
  strokeRect(image, x + 16, y + 16, size - 32, size - 32, [124, 58, 237, 255], 4);

  const initials =
    String(username || 'AD')
      .trim()
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2) || 'AD';

  drawCenteredText(image, initials, y + 95, 12, [255, 255, 255, 255]);
}

function encodePng(image) {
  const raw =
    Buffer.alloc((image.width * 4 + 1) * image.height);

  for (let y = 0; y < image.height; y += 1) {
    const rowStart =
      y * (image.width * 4 + 1);

    raw[rowStart] = 0;

    image.data.copy(
      raw,
      rowStart + 1,
      y * image.width * 4,
      (y + 1) * image.width * 4
    );
  }

  const header =
    Buffer.alloc(13);
  header.writeUInt32BE(image.width, 0);
  header.writeUInt32BE(image.height, 4);
  header[8] = 8;
  header[9] = 6;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function generateProfileCard({
  username,
  stats
}) {
  const image =
    createImage(
      WIDTH,
      HEIGHT
    );

  fillRect(image, 40, 40, WIDTH - 80, HEIGHT - 80, [24, 29, 41, 255]);
  strokeRect(image, 40, 40, WIDTH - 80, HEIGHT - 80, [88, 101, 242, 255], 6);
  fillRect(image, 70, 70, WIDTH - 140, 120, [32, 39, 56, 255]);

  drawCenteredText(image, 'ANIMEDBOT', 105, 8, [255, 255, 255, 255]);
  drawCenteredText(image, username || 'USER', 165, 4, [0, 204, 255, 255]);

  drawInitialsAvatar(image, username);

  drawCenteredText(image, 'LEVEL 0', 505, 5, [255, 255, 255, 255]);
  drawCenteredText(image, 'XP 0 / 100', 560, 4, [226, 232, 240, 255]);
  drawCenteredText(image, 'TOTAL XP 0', 610, 4, [226, 232, 240, 255]);

  fillRect(image, 230, 685, 440, 90, [46, 55, 78, 255]);
  strokeRect(image, 230, 685, 440, 90, [0, 204, 255, 255], 4);
  drawCenteredText(image, 'NO TITLE', 720, 5, [255, 255, 255, 255]);

  fillRect(image, 170, 850, 560, 210, [15, 23, 42, 255]);
  strokeRect(image, 170, 850, 560, 210, [124, 58, 237, 255], 4);

  drawText(image, `ANIMES: ${stats.animes}`, 230, 890, 5, [255, 255, 255, 255]);
  drawText(image, `EPISODES: ${stats.episodes}`, 230, 950, 5, [255, 255, 255, 255]);
  drawText(image, `LIBRARY: ${stats.library}`, 230, 1010, 5, [255, 255, 255, 255]);

  return encodePng(image);
}

module.exports = {
  generateProfileCard
};
