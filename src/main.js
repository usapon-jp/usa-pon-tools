import JSZip from "jszip";

import "./styles.css";
import {
  LINE_SPECS,
  formatBytes,
  isValidStickerCount,
  renderLineImage,
} from "./image-processing.js";

const icon = (name) => {
  const icons = {
    upload:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>',
    shield:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg>',
    check:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/></svg>',
    image:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m4 17 5-4 3 3 3-2 5 4"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    left:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    right:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
  };
  return icons[name];
};

document.querySelector("#app").innerHTML = `
  <header class="site-header">
    <a class="brand" href="#" aria-label="USA-PON TOOLS ホーム">
      <span class="brand-mark">U</span>
      <span><strong>USA-PON</strong><small>TOOLS</small></span>
    </a>
    <div class="privacy-badge">${icon("shield")} 画像は外部に送信されません</div>
  </header>

  <main>
    <section class="hero" aria-labelledby="page-title">
      <p class="eyebrow">LINE STICKER FINISHER</p>
      <h1 id="page-title">スタンプ画像を、<br><em>申請できる形</em>に。</h1>
      <p class="hero-copy">サイズ・余白・背景・白フチをまとめて調整。<br class="desktop-only">仕上がりを見ながら、申請用ZIPをつくれます。</p>
      <div class="spec-row" aria-label="対応仕様">
        <span>${icon("check")} 370 × 320 px</span>
        <span>${icon("check")} 透明PNG</span>
        <span>${icon("check")} 8〜40枚</span>
      </div>
    </section>

    <section class="workspace" aria-label="スタンプ画像の編集">
      <div class="upload-panel">
        <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
        <button id="drop-zone" class="drop-zone" type="button">
          <span class="upload-icon">${icon("upload")}</span>
          <strong>画像をここにドロップ</strong>
          <span>またはクリックして選択</span>
          <small>PNG・JPG・WebP / 最大40枚</small>
        </button>
      </div>

      <div class="editor" hidden>
        <aside class="controls" aria-label="一括調整">
          <div class="controls-heading">
            <div>
              <p class="eyebrow">BATCH EDIT</p>
              <h2>一括調整</h2>
            </div>
            <button id="add-more" class="icon-button labeled" type="button">${icon("upload")} 追加</button>
          </div>

          <div class="control-group">
            <div class="control-label"><label for="padding">まわりの余白</label><output id="padding-value">10px</output></div>
            <input id="padding" type="range" min="10" max="40" value="10" step="2">
            <div class="range-labels"><span>小さめ</span><span>ゆったり</span></div>
          </div>

          <div class="control-group toggle-group">
            <div>
              <label for="remove-white">白背景を透明に</label>
              <p>JPGや白背景画像向け</p>
            </div>
            <label class="switch"><input id="remove-white" type="checkbox"><span></span></label>
          </div>

          <div id="threshold-control" class="control-group nested-control" hidden>
            <div class="control-label"><label for="threshold">白の判定</label><output id="threshold-value">245</output></div>
            <input id="threshold" type="range" min="220" max="254" value="245">
            <p class="hint">数値を下げるほど広く消します。白い絵柄まで消えないか確認してください。</p>
          </div>

          <div class="control-group toggle-group">
            <div>
              <label for="add-outline">白フチをつける</label>
              <p>濃い背景でも見やすく</p>
            </div>
            <label class="switch"><input id="add-outline" type="checkbox" checked><span></span></label>
          </div>

          <div id="outline-control" class="control-group nested-control">
            <div class="control-label"><label for="outline">フチの太さ</label><output id="outline-value">5px</output></div>
            <input id="outline" type="range" min="1" max="12" value="5">
          </div>

          <div class="guideline-note">
            <strong>仕上げの目安</strong>
            <p>画像の外側に約10pxの余白を残すことがLINE公式で案内されています。</p>
            <a href="https://creator.line.me/ja/guideline/" target="_blank" rel="noreferrer">公式ガイドラインを確認 ↗</a>
          </div>
        </aside>

        <div class="preview-area">
          <div class="preview-heading">
            <div>
              <p class="eyebrow">PREVIEW</p>
              <h2>仕上がり</h2>
            </div>
            <div class="count-badge"><strong id="image-count">0</strong><span>枚</span></div>
          </div>
          <div id="progress" class="progress" hidden>
            <span></span><p>画像を仕上げています… <b>0 / 0</b></p>
          </div>
          <div id="sticker-grid" class="sticker-grid"></div>
        </div>
      </div>
    </section>

    <section id="export-panel" class="export-panel" hidden>
      <div class="export-summary">
        <div id="readiness-icon" class="readiness-icon">${icon("check")}</div>
        <div>
          <strong id="readiness-title">申請用データを作成できます</strong>
          <p id="readiness-copy">main.png・tab.pngも一緒に生成します</p>
        </div>
      </div>
      <div class="export-files" aria-label="出力内容">
        <span><b id="export-count">0</b> stamp PNG</span>
        <span>+ main / tab</span>
      </div>
      <button id="download-zip" class="primary-button" type="button">
        ${icon("download")} <span>申請用ZIPをダウンロード</span>
      </button>
    </section>

    <section class="how-it-works" aria-labelledby="how-heading">
      <p class="eyebrow">HOW IT WORKS</p>
      <h2 id="how-heading">3ステップで完成</h2>
      <ol>
        <li><span>01</span><div><strong>画像を入れる</strong><p>8・16・24・32・40枚をまとめて選択</p></div></li>
        <li><span>02</span><div><strong>見た目を整える</strong><p>プレビューを見ながら余白やフチを調整</p></div></li>
        <li><span>03</span><div><strong>ZIPで保存</strong><p>LINE申請用の名前・サイズで一括出力</p></div></li>
      </ol>
    </section>
  </main>

  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <footer><span>USA-PON TOOLS</span><p>画像はお使いの端末内だけで処理されます。</p></footer>
`;

const elements = {
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  addMore: document.querySelector("#add-more"),
  editor: document.querySelector(".editor"),
  uploadPanel: document.querySelector(".upload-panel"),
  grid: document.querySelector("#sticker-grid"),
  imageCount: document.querySelector("#image-count"),
  exportPanel: document.querySelector("#export-panel"),
  exportCount: document.querySelector("#export-count"),
  downloadZip: document.querySelector("#download-zip"),
  readinessIcon: document.querySelector("#readiness-icon"),
  readinessTitle: document.querySelector("#readiness-title"),
  readinessCopy: document.querySelector("#readiness-copy"),
  progress: document.querySelector("#progress"),
  toast: document.querySelector("#toast"),
  padding: document.querySelector("#padding"),
  paddingValue: document.querySelector("#padding-value"),
  removeWhite: document.querySelector("#remove-white"),
  threshold: document.querySelector("#threshold"),
  thresholdValue: document.querySelector("#threshold-value"),
  thresholdControl: document.querySelector("#threshold-control"),
  addOutline: document.querySelector("#add-outline"),
  outline: document.querySelector("#outline"),
  outlineValue: document.querySelector("#outline-value"),
  outlineControl: document.querySelector("#outline-control"),
};

const state = {
  items: [],
  representativeId: null,
  renderToken: 0,
  renderTimer: null,
  processing: false,
};

function getSettings() {
  return {
    padding: Number(elements.padding.value),
    removeWhite: elements.removeWhite.checked,
    whiteThreshold: Number(elements.threshold.value),
    outline: elements.addOutline.checked ? Number(elements.outline.value) : 0,
  };
}

function showToast(message, type = "success") {
  elements.toast.textContent = message;
  elements.toast.dataset.type = type;
  elements.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 2800);
}

function nextValidCount(count) {
  return LINE_SPECS.validCounts.find((validCount) => validCount > count) ?? null;
}

function updateSummary() {
  const count = state.items.length;
  const finished = state.items.filter((item) => item.result && !item.error).length;
  const oversized = state.items.filter((item) => item.result?.blob.size > LINE_SPECS.maxFileBytes).length;
  const ready = isValidStickerCount(count) && finished === count && oversized === 0 && !state.processing;
  const nextCount = nextValidCount(count);

  elements.imageCount.textContent = String(count);
  elements.exportCount.textContent = String(count);
  elements.exportPanel.hidden = count === 0;
  elements.downloadZip.disabled = !ready;
  elements.readinessIcon.classList.toggle("is-warning", !ready);

  if (oversized > 0) {
    elements.readinessTitle.textContent = `${oversized}枚が1MBを超えています`;
    elements.readinessCopy.textContent = "元画像を小さくして入れ直してください";
  } else if (!isValidStickerCount(count)) {
    elements.readinessTitle.textContent = nextCount ? `あと${nextCount - count}枚で${nextCount}枚セット` : "画像は最大40枚です";
    elements.readinessCopy.textContent = "LINEでは8・16・24・32・40枚から選びます";
  } else if (state.processing || finished < count) {
    elements.readinessTitle.textContent = "画像を仕上げています";
    elements.readinessCopy.textContent = `${finished} / ${count}枚 完了`;
  } else {
    elements.readinessTitle.textContent = "申請用データを作成できます";
    elements.readinessCopy.textContent = "main.png・tab.pngも一緒に生成します";
  }
}

function createCard(item, index) {
  const card = document.createElement("article");
  card.className = "sticker-card";
  card.dataset.id = item.id;

  const visual = document.createElement("div");
  visual.className = "sticker-visual checkerboard";
  if (item.previewUrl) {
    const image = document.createElement("img");
    image.src = item.previewUrl;
    image.alt = `${index + 1}枚目 ${item.file.name} の仕上がり`;
    visual.append(image);
  } else if (item.error) {
    visual.innerHTML = `<span class="card-error">!</span><small>処理できません</small>`;
  } else {
    visual.innerHTML = '<span class="card-loader"></span>';
  }

  const number = document.createElement("span");
  number.className = "sticker-number";
  number.textContent = String(index + 1).padStart(2, "0");
  visual.append(number);

  if (item.id === state.representativeId) {
    const mainBadge = document.createElement("span");
    mainBadge.className = "main-badge";
    mainBadge.textContent = "メイン";
    visual.append(mainBadge);
  }

  const info = document.createElement("div");
  info.className = "sticker-info";
  const text = document.createElement("div");
  const fileName = document.createElement("strong");
  fileName.textContent = item.file.name;
  fileName.title = item.file.name;
  const meta = document.createElement("small");
  meta.textContent = item.result
    ? `${item.result.width}×${item.result.height} · ${formatBytes(item.result.blob.size)}`
    : item.error || "処理中";
  if (item.result?.blob.size > LINE_SPECS.maxFileBytes) meta.classList.add("is-error");
  text.append(fileName, meta);

  const menu = document.createElement("div");
  menu.className = "card-actions";
  menu.innerHTML = `
    <button type="button" data-action="left" aria-label="前へ移動" ${index === 0 ? "disabled" : ""}>${icon("left")}</button>
    <button type="button" data-action="right" aria-label="後ろへ移動" ${index === state.items.length - 1 ? "disabled" : ""}>${icon("right")}</button>
    <button type="button" data-action="remove" aria-label="削除">${icon("close")}</button>
  `;
  info.append(text, menu);

  const footer = document.createElement("div");
  footer.className = "card-footer";
  const representativeButton = document.createElement("button");
  representativeButton.type = "button";
  representativeButton.dataset.action = "representative";
  representativeButton.textContent = item.id === state.representativeId ? "メイン画像に使用中" : "メイン画像に使う";
  representativeButton.disabled = item.id === state.representativeId;
  const downloadButton = document.createElement("button");
  downloadButton.type = "button";
  downloadButton.dataset.action = "download";
  downloadButton.innerHTML = `${icon("download")} PNG`;
  downloadButton.disabled = !item.result;
  footer.append(representativeButton, downloadButton);

  card.append(visual, info, footer);
  return card;
}

function renderGrid() {
  elements.grid.replaceChildren(...state.items.map(createCard));
  updateSummary();
}

function releaseItemUrl(item) {
  if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
}

async function renderAll() {
  const token = ++state.renderToken;
  state.processing = true;
  const settings = getSettings();
  elements.progress.hidden = false;
  const progressBar = elements.progress.querySelector("span");
  const progressText = elements.progress.querySelector("b");
  progressBar.style.width = "0%";
  renderGrid();

  for (let index = 0; index < state.items.length; index += 1) {
    if (token !== state.renderToken) return;
    const item = state.items[index];
    try {
      const result = await renderLineImage(item.file, LINE_SPECS.sticker, settings);
      if (token !== state.renderToken) return;
      releaseItemUrl(item);
      item.result = result;
      item.previewUrl = URL.createObjectURL(result.blob);
      item.error = null;
    } catch (error) {
      item.error = error instanceof Error ? error.message : "画像を処理できませんでした。";
      item.result = null;
    }
    const done = index + 1;
    progressBar.style.width = `${(done / state.items.length) * 100}%`;
    progressText.textContent = `${done} / ${state.items.length}`;
    renderGrid();
  }

  if (token !== state.renderToken) return;
  state.processing = false;
  elements.progress.hidden = true;
  updateSummary();
}

function scheduleRender() {
  window.clearTimeout(state.renderTimer);
  state.renderTimer = window.setTimeout(renderAll, 160);
}

function addFiles(fileList) {
  const accepted = [...fileList].filter((file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type));
  const available = 40 - state.items.length;
  const files = accepted.slice(0, available);

  if (accepted.length !== fileList.length) showToast("PNG・JPG・WebP以外のファイルを除外しました", "warning");
  if (accepted.length > available) showToast("画像は最大40枚までです", "warning");
  if (files.length === 0) return;

  const newItems = files.map((file) => ({ id: crypto.randomUUID(), file, result: null, previewUrl: null, error: null }));
  state.items.push(...newItems);
  state.representativeId ||= newItems[0].id;
  elements.uploadPanel.hidden = true;
  elements.editor.hidden = false;
  elements.fileInput.value = "";
  renderGrid();
  renderAll();
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadZip() {
  const representative = state.items.find((item) => item.id === state.representativeId) ?? state.items[0];
  if (!representative || elements.downloadZip.disabled) return;

  const originalLabel = elements.downloadZip.querySelector("span").textContent;
  elements.downloadZip.disabled = true;
  elements.downloadZip.querySelector("span").textContent = "ZIPを作成しています…";

  try {
    const zip = new JSZip();
    state.items.forEach((item, index) => zip.file(LINE_SPECS.sticker.fileName(index), item.result.blob));

    const settings = getSettings();
    const main = await renderLineImage(representative.file, LINE_SPECS.main, {
      ...settings,
      padding: Math.min(settings.padding, 20),
      outline: Math.min(settings.outline, 8),
    });
    const tab = await renderLineImage(representative.file, LINE_SPECS.tab, {
      ...settings,
      padding: Math.min(settings.padding, 8),
      outline: Math.min(settings.outline, 3),
    });
    zip.file("main.png", main.blob);
    zip.file("tab.png", tab.blob);

    const blob = await zip.generateAsync(
      { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
      ({ percent }) => {
        elements.downloadZip.querySelector("span").textContent = `ZIPを作成中 ${Math.round(percent)}%`;
      },
    );
    downloadBlob(blob, `line-stickers-${state.items.length}.zip`);
    showToast("申請用ZIPをダウンロードしました");
  } catch (error) {
    console.error(error);
    showToast("ZIPを作成できませんでした", "error");
  } finally {
    elements.downloadZip.querySelector("span").textContent = originalLabel;
    updateSummary();
  }
}

elements.dropZone.addEventListener("click", () => elements.fileInput.click());
elements.addMore.addEventListener("click", () => elements.fileInput.click());
elements.fileInput.addEventListener("change", (event) => addFiles(event.target.files));

for (const eventName of ["dragenter", "dragover"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("is-dragging");
  });
}
elements.dropZone.addEventListener("drop", (event) => addFiles(event.dataTransfer.files));

elements.grid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  const card = event.target.closest(".sticker-card");
  if (!button || !card) return;
  const index = state.items.findIndex((item) => item.id === card.dataset.id);
  if (index < 0) return;
  const item = state.items[index];

  if (button.dataset.action === "remove") {
    releaseItemUrl(item);
    state.items.splice(index, 1);
    if (state.representativeId === item.id) state.representativeId = state.items[0]?.id ?? null;
    if (state.items.length === 0) {
      state.renderToken += 1;
      state.processing = false;
      elements.editor.hidden = true;
      elements.uploadPanel.hidden = false;
      elements.progress.hidden = true;
    }
    renderGrid();
  } else if (button.dataset.action === "representative") {
    state.representativeId = item.id;
    renderGrid();
    showToast("メイン画像・タブ画像の元画像を変更しました");
  } else if (button.dataset.action === "download" && item.result) {
    downloadBlob(item.result.blob, LINE_SPECS.sticker.fileName(index));
  } else if (button.dataset.action === "left" && index > 0) {
    [state.items[index - 1], state.items[index]] = [state.items[index], state.items[index - 1]];
    renderGrid();
  } else if (button.dataset.action === "right" && index < state.items.length - 1) {
    [state.items[index], state.items[index + 1]] = [state.items[index + 1], state.items[index]];
    renderGrid();
  }
});

for (const range of [elements.padding, elements.threshold, elements.outline]) {
  range.addEventListener("input", () => {
    elements.paddingValue.value = `${elements.padding.value}px`;
    elements.thresholdValue.value = elements.threshold.value;
    elements.outlineValue.value = `${elements.outline.value}px`;
    scheduleRender();
  });
}

elements.removeWhite.addEventListener("change", () => {
  elements.thresholdControl.hidden = !elements.removeWhite.checked;
  scheduleRender();
});
elements.addOutline.addEventListener("change", () => {
  elements.outlineControl.hidden = !elements.addOutline.checked;
  scheduleRender();
});
elements.downloadZip.addEventListener("click", downloadZip);

window.addEventListener("beforeunload", () => state.items.forEach(releaseItemUrl));
