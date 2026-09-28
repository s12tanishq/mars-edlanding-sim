import * as THREE from "three";

const ASSET_BASE = import.meta.env.BASE_URL;
export const VIKING_TILE_COLUMNS = 8;
export const VIKING_TILE_ROWS = 4;
export const VIKING_TILE_SIZE = 256;
export const JEZERO_TILE_COLUMNS = 4;
export const JEZERO_TILE_ROWS = 4;

// NASA Mars Trek serves the Viking MDIM 2.1 global colour mosaic as WMTS tiles.
// Stitching the bundled tiles in a canvas keeps the demo offline and gives both
// the orbital sphere and high-altitude terrain one consistent source image.
export function createMarsVikingTexture(manager, anisotropy = 4) {
  const canvas = document.createElement("canvas");
  canvas.width = VIKING_TILE_COLUMNS * VIKING_TILE_SIZE;
  canvas.height = VIKING_TILE_ROWS * VIKING_TILE_SIZE;
  const context = canvas.getContext("2d", { alpha: false });
  context.fillStyle = "#7c4a38";
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = "NASA Viking MDIM 2.1 global Mars mosaic";
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = false;

  const loader = new THREE.ImageLoader(manager);
  let remaining = VIKING_TILE_COLUMNS * VIKING_TILE_ROWS;
  for (let row = 0; row < VIKING_TILE_ROWS; row += 1) {
    for (let column = 0; column < VIKING_TILE_COLUMNS; column += 1) {
      loader.load(
        `${ASSET_BASE}assets/mars-viking-z2/${row}-${column}.jpg`,
        (image) => {
          context.drawImage(
            image,
            column * VIKING_TILE_SIZE,
            row * VIKING_TILE_SIZE,
            VIKING_TILE_SIZE,
            VIKING_TILE_SIZE,
          );
          remaining -= 1;
          if (remaining === 0) texture.generateMipmaps = true;
          texture.needsUpdate = true;
        },
      );
    }
  }
  return texture;
}

export function createJezeroOrbitalTexture(manager, anisotropy = 4) {
  const canvas = document.createElement("canvas");
  canvas.width = JEZERO_TILE_COLUMNS * VIKING_TILE_SIZE;
  canvas.height = JEZERO_TILE_ROWS * VIKING_TILE_SIZE;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = "NASA Northeast Syrtis–Jezero orbital mosaic";
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = anisotropy;
  texture.generateMipmaps = false;

  const loader = new THREE.ImageLoader(manager);
  let remaining = JEZERO_TILE_COLUMNS * JEZERO_TILE_ROWS;
  for (let row = 0; row < JEZERO_TILE_ROWS; row += 1) {
    for (let column = 0; column < JEZERO_TILE_COLUMNS; column += 1) {
      loader.load(
        `${ASSET_BASE}assets/mars-jezero-z9/${row + 202}-${column + 730}.png`,
        (image) => {
          context.drawImage(
            image,
            column * VIKING_TILE_SIZE,
            row * VIKING_TILE_SIZE,
            VIKING_TILE_SIZE,
            VIKING_TILE_SIZE,
          );
          remaining -= 1;
          if (remaining === 0) texture.generateMipmaps = true;
          texture.needsUpdate = true;
        },
      );
    }
  }
  return texture;
}

export function createJezeroDetailTexture(manager, anisotropy = 4) {
  const texture = new THREE.TextureLoader(manager).load(
    `${ASSET_BASE}assets/mars-jezero-z9/204-732.png`,
  );
  texture.name = "NASA Jezero orbital detail continuation";
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = anisotropy;
  return texture;
}
