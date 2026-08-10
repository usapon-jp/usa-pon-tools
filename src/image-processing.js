export const LINE_SPECS = Object.freeze({
  sticker: { width: 370, height: 320, fileName: (index) => `${String(index + 1).padStart(2, "0")}.png` },
  main: { width: 240, height: 240, fileName: () => "main.png" },
  tab: { width: 96, height: 74, fileName: () => "tab.png" },
  validCounts: [8, 16, 24, 32, 40],
  maxFileBytes: 1024 * 1024,
});

export function calculateContainSize(sourceWidth, sourceHeight, maxWidth, maxHeight) {
  if ([sourceWidth, sourceHeight, maxWidth, maxHeight].some((value) => !Number.isFinite(value) || value <= 0)) {
    throw new TypeError("画像サイズは0より大きい数値で指定してください。");
  }

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);
  return {
    width: Math.max(1, Math.round(sourceWidth * scale)),
    height: Math.max(1, Math.round(sourceHeight * scale)),
    scale,
  };
}

export function isValidStickerCount(count) {
  return LINE_SPECS.validCounts.includes(count);
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function getTrimBounds(imageData, alphaThreshold = 8) {
  const { data, width, height } = imageData;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * 4 + 3] <= alphaThreshold) continue;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
  }

  if (right < left || bottom < top) {
    return { x: 0, y: 0, width, height, empty: true };
  }

  return {
    x: left,
    y: top,
    width: right - left + 1,
    height: bottom - top + 1,
    empty: false,
  };
}

export function removeNearWhitePixels(imageData, threshold = 245, feather = 18) {
  const { data } = imageData;
  const transparentDistance = 255 - threshold;
  const featherWidth = Math.max(1, feather);

  for (let index = 0; index < data.length; index += 4) {
    const distanceFromWhite = 255 - Math.min(data[index], data[index + 1], data[index + 2]);
    if (distanceFromWhite <= transparentDistance) {
      data[index + 3] = 0;
      continue;
    }
    if (distanceFromWhite < transparentDistance + featherWidth) {
      const ratio = (distanceFromWhite - transparentDistance) / featherWidth;
      data[index + 3] = Math.round(data[index + 3] * ratio);
    }
  }

  return imageData;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("PNG画像を生成できませんでした。"));
    }, "image/png");
  });
}

async function decodeImage(file) {
  if ("createImageBitmap" in globalThis) {
    return createImageBitmap(file);
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function makeSourceCanvas(image, removeWhite, whiteThreshold) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0);

  if (removeWhite) {
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    removeNearWhitePixels(imageData, whiteThreshold);
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(imageData, 0, 0);
  }

  return canvas;
}

function makeTintedAlphaCanvas(sourceCanvas, color) {
  const canvas = document.createElement("canvas");
  canvas.width = sourceCanvas.width;
  canvas.height = sourceCanvas.height;
  const context = canvas.getContext("2d");
  context.drawImage(sourceCanvas, 0, 0);
  context.globalCompositeOperation = "source-in";
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function cropCanvas(sourceCanvas, bounds) {
  const canvas = document.createElement("canvas");
  canvas.width = bounds.width;
  canvas.height = bounds.height;
  canvas.getContext("2d").drawImage(
    sourceCanvas,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    0,
    0,
    bounds.width,
    bounds.height,
  );
  return canvas;
}

function drawOutline(context, silhouette, x, y, width, height, radius) {
  if (radius <= 0) return;
  const steps = Math.max(24, Math.ceil(radius * 10));
  for (let index = 0; index < steps; index += 1) {
    const angle = (index / steps) * Math.PI * 2;
    context.drawImage(
      silhouette,
      Math.round(x + Math.cos(angle) * radius),
      Math.round(y + Math.sin(angle) * radius),
      width,
      height,
    );
  }
}

export async function renderLineImage(file, spec, options = {}) {
  const {
    padding = 10,
    removeWhite = false,
    whiteThreshold = 245,
    outline = 0,
    outlineColor = "#ffffff",
  } = options;
  const image = await decodeImage(file);

  try {
    const sourceCanvas = makeSourceCanvas(image, removeWhite, whiteThreshold);
    const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
    const sourceData = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const bounds = getTrimBounds(sourceData);
    const croppedCanvas = cropCanvas(sourceCanvas, bounds);

    const target = document.createElement("canvas");
    target.width = spec.width;
    target.height = spec.height;
    const targetContext = target.getContext("2d");
    targetContext.imageSmoothingEnabled = true;
    targetContext.imageSmoothingQuality = "high";

    const safePadding = Math.min(
      Math.max(0, padding),
      Math.floor(Math.min(spec.width, spec.height) / 3),
    );
    const safeOutline = Math.max(0, outline);
    const availableWidth = Math.max(1, spec.width - (safePadding + safeOutline) * 2);
    const availableHeight = Math.max(1, spec.height - (safePadding + safeOutline) * 2);
    const fitted = calculateContainSize(bounds.width, bounds.height, availableWidth, availableHeight);
    const x = Math.round((spec.width - fitted.width) / 2);
    const y = Math.round((spec.height - fitted.height) / 2);

    if (safeOutline > 0) {
      const silhouette = makeTintedAlphaCanvas(croppedCanvas, outlineColor);
      drawOutline(targetContext, silhouette, x, y, fitted.width, fitted.height, safeOutline);
    }

    targetContext.drawImage(
      croppedCanvas,
      0,
      0,
      croppedCanvas.width,
      croppedCanvas.height,
      x,
      y,
      fitted.width,
      fitted.height,
    );

    const blob = await canvasToBlob(target);
    return {
      blob,
      width: target.width,
      height: target.height,
      contentBounds: { x, y, width: fitted.width, height: fitted.height },
      hasTransparency:
        safePadding > 0 || sourceData.data.some((value, index) => index % 4 === 3 && value < 255),
    };
  } finally {
    if (typeof image.close === "function") image.close();
  }
}
