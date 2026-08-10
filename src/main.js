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
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4m0 0L8 8m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>',
    download:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/></svg>',
    list:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/></svg>',
    edit:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.5-1L19 8.5 15.5 5 5 15.5 4 20Z"/><path d="m13.8 6.7 3.5 3.5"/></svg>',
    adjust:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M14 4v6M4 17h2m4 0h10M7 14v6"/></svg>',
    preview:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    sparkle:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c.5 5.5 2.5 7.5 8 8-5.5.5-7.5 2.5-8 8-.5-5.5-2.5-7.5-8-8 5.5-.5 7.5-2.5 8-8Z"/></svg>',
    checker:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16v16H4z"/><path d="M4 4h5v5H4m10-5h6v5h-6M9 9h5v5H9m-5 5h5v-5H4m10 0h6v5h-6"/></svg>',
    message:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 9 9 0 0 1-3-.5L4 20l1.4-4A7.5 7.5 0 1 1 20 11.5Z"/></svg>',
    crop:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v14h14M3 7h14v14"/></svg>',
    book:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z"/></svg>',
    settings:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
    close:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
    left:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    right:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    lock:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
  };
  return icons[name];
};

const bunnyFace = `
  <svg class="bunny-face" viewBox="0 0 48 48" aria-hidden="true">
    <path d="M15.8 17.5c-1.7-5.9-1.1-11.1 1.6-11.8 2.4-.6 4.7 3.7 5.4 9.1M32.2 17.5c1.7-5.9 1.1-11.1-1.6-11.8-2.4-.6-4.7 3.7-5.4 9.1"/>
    <path d="M37.5 29.3c0 8-5.7 12.2-13.5 12.2s-13.5-4.2-13.5-12.2S16.2 15 24 15s13.5 6.3 13.5 14.3Z"/>
    <circle cx="19" cy="27" r="1.4"/><circle cx="29" cy="27" r="1.4"/>
    <path d="M22 31.2c1.3 1.2 2.7 1.2 4 0M24 29.5v2"/>
    <circle class="blush" cx="15.7" cy="31.5" r="2.2"/><circle class="blush" cx="32.3" cy="31.5" r="2.2"/>
  </svg>`;

const bunnyMascot = `
  <svg class="bunny-mascot" viewBox="0 0 300 320" aria-label="バナナに乗ったうさぽん" role="img">
    <defs>
      <clipPath id="mascot-subject-clip">
        <path d="M4 180 L58 180 L73 132 L82 103 L98 85 L125 86 L151 105 L168 132 L190 151 L226 141 L260 119 L274 108 L278 116 L276 146 L269 178 L258 211 L239 243 L210 269 L165 288 L94 300 L42 294 L13 278 L3 247 Z"/>
      </clipPath>
    </defs>
    <image href="/usapon-mascot-source.png" width="370" height="320" clip-path="url(#mascot-subject-clip)"/>
  </svg>`;

const emptySlots = Array.from({ length: 8 }, (_, index) => `
  <div class="empty-slot" aria-hidden="true">
    <span class="empty-bunny">${bunnyFace}</span>
    <small>${String(index + 1).padStart(2, "0")}</small>
  </div>
`).join("");

document.querySelector("#app").innerHTML = `
  <header class="site-header">
    <a class="brand" href="#" aria-label="うさぽん LINEスタンプ仕上げ ホーム">
      <span class="brand-logo"><img src="/usapon-logo.png" alt="うさぽん"></span>
      <strong>うさぽん</strong>
      <span>LINEスタンプ仕上げ</span>
    </a>
    <nav class="header-actions" aria-label="補助メニュー">
      <a href="https://creator.line.me/ja/guideline/" target="_blank" rel="noreferrer">${icon("book")}<span>使い方</span></a>
      <button type="button" id="header-settings">${icon("settings")}<span>設定</span></button>
    </nav>
  </header>

  <main class="tool-shell">
    <aside class="step-sidebar" aria-label="工程ナビゲーション">
      <nav>
        <a class="step-link is-active" href="#stamp-list">${icon("checker")}<span><strong>スタンプ一覧</strong><small id="nav-count">0 / 40枚</small></span></a>
        <a class="step-link" href="#stamp-list">${icon("list")}<span>並び替え</span></a>
        <a class="step-link" href="#stamp-list">${icon("edit")}<span>個別編集</span></a>
        <a class="step-link" href="#finish-settings">${icon("adjust")}<span>まとめて調整</span></a>
        <a class="step-link" href="#stamp-list">${icon("preview")}<span>プレビュー</span></a>
        <a class="step-link" href="#export-panel">${icon("download")}<span>書き出し</span></a>
      </nav>
      <div class="mascot-area">
        <p>右の設定できれいに仕上げて<br>LINEに登録しよう！</p>
        ${bunnyMascot}
      </div>
    </aside>

    <section id="stamp-list" class="stamp-workspace" aria-labelledby="list-heading">
      <div class="section-heading">
        <h1 id="list-heading">スタンプ一覧</h1>
        <span class="count-pill"><b id="image-count">0</b> 枚</span>
      </div>

      <div id="progress" class="progress" hidden>
        <span></span><p>画像を仕上げています <b>0 / 0</b></p>
      </div>

      <div id="empty-grid" class="empty-grid">${emptySlots}</div>
      <div id="sticker-grid" class="sticker-grid" aria-live="polite"></div>

      <div class="upload-panel">
        <input id="file-input" type="file" accept="image/png,image/jpeg,image/webp" multiple hidden>
        <button id="drop-zone" class="drop-zone" type="button">
          ${icon("upload")}
          <strong>画像を追加する</strong>
        </button>
        <p>JPG / PNG / WebP（1枚10MBまで）・最大40枚まで</p>
      </div>
      <button id="add-more" class="text-add-button" type="button">${icon("upload")} 画像を追加する</button>
    </section>

    <aside id="finish-settings" class="finish-settings" aria-label="仕上げ設定">
      <div class="settings-title">
        ${icon("sparkle")}
        <div><h2>きれいに仕上げる</h2><span>おすすめ設定</span></div>
      </div>

      <section class="setting-card">
        <div class="setting-card-head">
          <span class="setting-icon checker-icon">${icon("checker")}</span>
          <div><h3>背景を透明にする</h3><span id="remove-white-status" class="status-chip">そのまま</span></div>
          <label class="switch" aria-label="背景を透明にする"><input id="remove-white" type="checkbox"><span></span></label>
        </div>
        <div id="threshold-control" class="detail-control" hidden>
          <div class="control-label"><label for="threshold">白の判定</label><output id="threshold-value">245</output></div>
          <input id="threshold" type="range" min="220" max="254" value="245">
          <p>数値を下げるほど白い範囲を広く透明にします。</p>
        </div>
      </section>

      <section class="setting-card">
        <div class="setting-card-head">
          <span class="setting-icon">${icon("message")}</span>
          <div><h3>白フチをつける</h3><span id="outline-status" class="status-chip">あり</span></div>
          <label class="switch" aria-label="白フチをつける"><input id="add-outline" type="checkbox" checked><span></span></label>
        </div>
        <div id="outline-control" class="detail-control">
          <div class="control-label"><label for="outline">フチの太さ</label><output id="outline-value">5px</output></div>
          <input id="outline" type="range" min="1" max="12" value="5">
        </div>
      </section>

      <section class="setting-card">
        <div class="setting-card-head">
          <span class="setting-icon">${icon("crop")}</span>
          <div><h3>余白を調整する</h3><span id="padding-status" class="status-chip">標準</span></div>
        </div>
        <div class="detail-control always-open">
          <div class="control-label"><label for="padding">まわりの余白</label><output id="padding-value">10px</output></div>
          <input id="padding" type="range" min="10" max="40" value="10" step="2">
          <div class="range-labels"><span>標準</span><span>ゆったり</span></div>
        </div>
      </section>

      <details class="advanced-settings">
        <summary>${icon("adjust")}<span>詳細調整</span></summary>
        <p>白の判定・フチの太さ・余白を上の項目から細かく調整できます。</p>
      </details>

      <div class="recommendation-note">
        <span>💡</span><p>迷ったらおすすめ設定の<br>ままでOK！</p>
      </div>
    </aside>

    <section id="export-panel" class="export-panel" aria-labelledby="export-heading">
      <div class="export-copy">
        <h2 id="export-heading">LINE用データを書き出す</h2>
        <p id="readiness-copy">スタンプ画像を8枚追加すると書き出せます</p>
      </div>
      <div class="export-status">
        <span id="readiness-icon" class="readiness-icon">${icon("sparkle")}</span>
        <strong id="readiness-title">あと8枚で8枚セット</strong>
      </div>
      <button id="download-zip" class="primary-button" type="button" disabled>
        ${icon("download")} <span>ZIPで書き出す</span>
      </button>
      <p class="privacy-note">${icon("lock")} データは保存されません。安心してご利用ください。</p>
      <span id="export-count" hidden>0</span>
    </section>
  </main>

  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  <footer>© うさぽんDAYS</footer>
`;

const elements = {
  fileInput: document.querySelector("#file-input"),
  dropZone: document.querySelector("#drop-zone"),
  addMore: document.querySelector("#add-more"),
  grid: document.querySelector("#sticker-grid"),
  emptyGrid: document.querySelector("#empty-grid"),
  imageCount: document.querySelector("#image-count"),
  navCount: document.querySelector("#nav-count"),
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
  paddingStatus: document.querySelector("#padding-status"),
  removeWhite: document.querySelector("#remove-white"),
  removeWhiteStatus: document.querySelector("#remove-white-status"),
  threshold: document.querySelector("#threshold"),
  thresholdValue: document.querySelector("#threshold-value"),
  thresholdControl: document.querySelector("#threshold-control"),
  addOutline: document.querySelector("#add-outline"),
  outlineStatus: document.querySelector("#outline-status"),
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

function updateSettingLabels() {
  elements.removeWhiteStatus.textContent = elements.removeWhite.checked ? "透明" : "そのまま";
  elements.outlineStatus.textContent = elements.addOutline.checked ? "あり" : "なし";
  const padding = Number(elements.padding.value);
  elements.paddingStatus.textContent = padding <= 14 ? "標準" : padding <= 26 ? "やや広め" : "広め";
}

function updateSummary() {
  const count = state.items.length;
  const finished = state.items.filter((item) => item.result && !item.error).length;
  const oversized = state.items.filter((item) => item.result?.blob.size > LINE_SPECS.maxFileBytes).length;
  const ready = isValidStickerCount(count) && finished === count && oversized === 0 && !state.processing;
  const nextCount = nextValidCount(count);

  elements.imageCount.textContent = String(count);
  elements.navCount.textContent = `${count} / 40枚`;
  elements.exportCount.textContent = String(count);
  elements.emptyGrid.hidden = count > 0;
  elements.grid.hidden = count === 0;
  elements.downloadZip.disabled = !ready;
  elements.readinessIcon.classList.toggle("is-ready", ready);
  updateSettingLabels();

  if (oversized > 0) {
    elements.readinessTitle.textContent = `${oversized}枚が1MBを超えています`;
    elements.readinessCopy.textContent = "元画像を小さくして入れ直してください";
  } else if (!isValidStickerCount(count)) {
    elements.readinessTitle.textContent = nextCount ? `あと${nextCount - count}枚で${nextCount}枚セット` : "画像は最大40枚です";
    elements.readinessCopy.textContent = nextCount
      ? `スタンプ画像をあと${nextCount - count}枚追加すると書き出せます`
      : "40枚セットとして書き出せます";
  } else if (state.processing || finished < count) {
    elements.readinessTitle.textContent = "画像を仕上げています";
    elements.readinessCopy.textContent = `${finished} / ${count}枚 完了`;
  } else {
    elements.readinessTitle.textContent = "書き出す準備ができました";
    elements.readinessCopy.textContent = "LINEスタンプメーカーでそのまま使える画像（ZIP）を作成します";
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
    visual.innerHTML = '<span class="card-error">!</span><small>処理できません</small>';
  } else {
    visual.innerHTML = '<span class="card-loader"></span>';
  }

  if (item.id === state.representativeId) {
    const mainBadge = document.createElement("span");
    mainBadge.className = "main-badge";
    mainBadge.textContent = "メイン";
    visual.append(mainBadge);
  }

  const info = document.createElement("div");
  info.className = "sticker-info";
  const number = document.createElement("strong");
  number.textContent = String(index + 1).padStart(2, "0");
  const meta = document.createElement("small");
  meta.textContent = item.result ? `${formatBytes(item.result.blob.size)}` : item.error || "処理中";
  if (item.result?.blob.size > LINE_SPECS.maxFileBytes) meta.classList.add("is-error");

  const actions = document.createElement("div");
  actions.className = "card-actions";
  actions.innerHTML = `
    <button type="button" data-action="left" aria-label="前へ移動" ${index === 0 ? "disabled" : ""}>${icon("left")}</button>
    <button type="button" data-action="right" aria-label="後ろへ移動" ${index === state.items.length - 1 ? "disabled" : ""}>${icon("right")}</button>
    <button type="button" data-action="remove" aria-label="削除">${icon("close")}</button>
  `;
  info.append(number, meta, actions);

  const footer = document.createElement("div");
  footer.className = "card-footer";
  const representativeButton = document.createElement("button");
  representativeButton.type = "button";
  representativeButton.dataset.action = "representative";
  representativeButton.textContent = item.id === state.representativeId ? "メイン画像" : "メインに設定";
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
  if (state.items.length === 0) {
    updateSummary();
    return;
  }
  window.clearTimeout(state.renderTimer);
  state.renderTimer = window.setTimeout(renderAll, 160);
}

function addFiles(fileList) {
  const accepted = [...fileList].filter((file) => ["image/png", "image/jpeg", "image/webp"].includes(file.type));
  const sized = accepted.filter((file) => file.size <= 10 * 1024 * 1024);
  const available = 40 - state.items.length;
  const files = sized.slice(0, available);

  if (accepted.length !== fileList.length) showToast("PNG・JPG・WebP以外のファイルを除外しました", "warning");
  if (sized.length !== accepted.length) showToast("10MBを超える画像を除外しました", "warning");
  if (sized.length > available) showToast("画像は最大40枚までです", "warning");
  if (files.length === 0) return;

  const newItems = files.map((file) => ({ id: crypto.randomUUID(), file, result: null, previewUrl: null, error: null }));
  state.items.push(...newItems);
  state.representativeId ||= newItems[0].id;
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
    updateSettingLabels();
    scheduleRender();
  });
}

elements.removeWhite.addEventListener("change", () => {
  elements.thresholdControl.hidden = !elements.removeWhite.checked;
  updateSettingLabels();
  scheduleRender();
});
elements.addOutline.addEventListener("change", () => {
  elements.outlineControl.hidden = !elements.addOutline.checked;
  updateSettingLabels();
  scheduleRender();
});
elements.downloadZip.addEventListener("click", downloadZip);
document.querySelector("#header-settings").addEventListener("click", () => {
  document.querySelector("#finish-settings").scrollIntoView({ behavior: "smooth", block: "start" });
});

window.addEventListener("beforeunload", () => state.items.forEach(releaseItemUrl));
updateSummary();
