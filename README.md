# 雲端靈感島 · Ollama Atelier

一座收藏影像、空間與日常靈感的原創浮空小島。跟著圓胖、雙手空空的 Ollama，以背景視差銜接首頁與 3D 精選作品，慢慢走進創作與故事。網站以 Three.js 呈現立體作品框，搭配 GSAP 聚焦轉場；也保留可以自由拖曳的無限畫廊。

這是無需建置的靜態網站。Ollama 使用透明背景的 3D 渲染 PNG，透過視差與介面動畫陪伴旅程。雲島及角色視覺為本專案透過 ImageGen 生成；作品框、場景渲染與點選互動由 Three.js 即時處理。作品集的八筆內容與 Unsplash 照片是可替換的展示素材。

## 本機開啟

安裝 Node.js 18 或更新版本，在專案資料夾執行：

```powershell
npm run dev
```

開啟 <http://127.0.0.1:4173>。也可以直接執行 `node server.mjs`；本機伺服器不需要安裝額外套件。請透過 HTTP 開啟，避免直接雙擊 HTML 時的 ES Modules 限制。Three.js、GSAP 等 CDN 程式庫及 Unsplash 圖片需要網路連線。

## 逛展方式

| 模式／操作 | 功能 |
| --- | --- |
| 雲島旅程 | 隨著頁面捲動推進背景視差，從首頁銜接至 3D 精選作品 |
| 精選作品 | 點選 3D 作品框，開啟完整介紹 |
| 作品集 | 以原生 HTML 介面瀏覽全部八件作品 |
| 自由探索 | 切換到可探索的無限作品網格 |
| 自由探索中拖曳 | 平移視角 |
| 自由探索中滾輪／雙指捏合 | 放大、縮小 |
| 關閉按鈕／Esc | 關閉對話框，返回瀏覽 |

按鈕與作品集可用 Tab 選取、Enter 開啟，作品介紹使用原生 `<dialog>`。系統啟用「減少動態效果」時，會簡化持續動畫與轉場。自由探索的鍵盤操作請依畫面提示使用；行動裝置也可直接從作品集進入內容。

## 換成自己的內容

| 檔案 | 用途 |
| --- | --- |
| `works.js` | 八筆作品資料：標題、副標題、分類、年份、描述、圖片網址與底色 |
| `index.html` | 網站名稱、章節敘事、按鈕及對話框結構；CDN 設定 |
| `main.js` | Three.js 場景、鏡頭、滾動旅程、自由探索與作品互動 |
| `style.css` | 色彩、字體、版面、手機排版與介面動態 |
| `assets/cloud-islands.png` | 靛藍宇宙中的浮空卵石平台與銀色軌道弧線背景 |
| `assets/ollama-cinematic.png` | 圓胖 Ollama 透明背景角色 |
| `assets/prompts.json` | 本專案視覺素材的生成提示與檔案對照 |
| `server.mjs` | 本機預覽用靜態伺服器 |

修改 `works.js` 即可替換展示作品。圖片可以使用直接回傳影像的網址，或放入 `assets/` 後使用 `./assets/檔名.jpg` 等相對路徑；若使用外站網址，圖片主機必須允許跨來源載入，才能作為 WebGL 紋理。正式作品建議使用自己的專案內圖片與介紹。

目前使用的八張作品照片來自 `images.unsplash.com`，僅作版型展示；它們不代表實際客戶專案。雲島與圓胖 Ollama 則是專為此站生成的原創視覺，角色沒有手持物或文字配件。本機的 `archive/` 備份、預覽截圖與舊角色 `ollama.js` 已排除於 Git 版本控制，不屬於目前網站。

## 驗證

```powershell
npm install
npm run check
npm test
```

`check` 檢查目前啟用的 JavaScript 語法。端對端測試使用本機 Google Chrome（Playwright `channel: chrome`），需要安裝 Chrome 並可連線至 CDN；測試會啟動本機伺服器或使用現有的 4173 連接埠，結果與截圖輸出至 `test-results/`。修改圖片或場景後，也請實際檢查桌面、手機、作品對話框與減少動態效果模式。

## 部署到 Vercel

本專案可直接作為靜態網站部署，不需要執行 `server.mjs`。以下提供自行部署的步驟，目前沒有代為發布。

### 透過網頁介面

1. 將專案推送到自己的 GitHub、GitLab 或 Bitbucket 儲存庫。
2. 在 [Vercel 新增專案](https://vercel.com/new) 匯入儲存庫。
3. Root Directory 選擇包含 `index.html` 的資料夾，Framework Preset 選 **Other**。
4. 開啟 Build Command 的 **Override** 並留空；Output Directory 設為專案根目錄 `.`。
5. 點擊 **Deploy**。Vercel 完成部署後會提供網站網址，開啟確認圖片與互動是否正常。

這組設定會跳過建置，直接提供 HTML、CSS、JavaScript 與圖片。詳見 [Vercel 靜態網站建置設定](https://vercel.com/docs/builds/configure-a-build)。

### 透過命令列

在專案資料夾執行，依提示登入、選擇帳號及設定專案：

```powershell
npx vercel
```

沿用 **Other**、空白 Build Command 與根目錄輸出設定。首次建立專案時請留意 CLI 顯示的部署環境；確認內容後，可用以下指令明確部署正式版：

```powershell
npx vercel --prod
```

部署網址會顯示在命令列。詳細選項見 [Vercel CLI 部署文件](https://vercel.com/docs/cli/deploy)。`.vercelignore` 排除測試、截圖、封存版本及本機伺服器，發布時仍須保留 `index.html`、`style.css`、`main.js`、`works.js` 與使用中的 `assets/`。
