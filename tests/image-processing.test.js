import test from "node:test";
import assert from "node:assert/strict";

import {
  LINE_SPECS,
  calculateContainSize,
  formatBytes,
  getTrimBounds,
  isValidStickerCount,
  removeNearWhitePixels,
} from "../src/image-processing.js";

test("横長画像を370×320以内へ収める", () => {
  assert.deepEqual(calculateContainSize(1000, 500, 350, 300), {
    width: 350,
    height: 175,
    scale: 0.35,
  });
});

test("縦長画像を370×320以内へ収める", () => {
  assert.deepEqual(calculateContainSize(500, 1000, 350, 300), {
    width: 150,
    height: 300,
    scale: 0.3,
  });
});

test("LINEで選択できる静止画スタンプ数だけを許可する", () => {
  for (const count of LINE_SPECS.validCounts) assert.equal(isValidStickerCount(count), true);
  for (const count of [0, 7, 9, 20, 41]) assert.equal(isValidStickerCount(count), false);
});

test("ファイルサイズを読みやすく表示する", () => {
  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(2048), "2 KB");
  assert.equal(formatBytes(1572864), "1.50 MB");
});

test("透明部分を除いた境界を検出する", () => {
  const imageData = { width: 3, height: 3, data: new Uint8ClampedArray(3 * 3 * 4) };
  imageData.data[(1 * 3 + 2) * 4 + 3] = 255;
  assert.deepEqual(getTrimBounds(imageData), { x: 2, y: 1, width: 1, height: 1, empty: false });
});

test("白に近い画素を透明化する", () => {
  const imageData = {
    width: 2,
    height: 1,
    data: new Uint8ClampedArray([255, 255, 255, 255, 20, 30, 40, 255]),
  };
  removeNearWhitePixels(imageData, 245);
  assert.equal(imageData.data[3], 0);
  assert.equal(imageData.data[7], 255);
});
