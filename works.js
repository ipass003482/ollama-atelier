// Edit these records to update your portfolio. Use direct image URLs,
// not Unsplash page URLs: WebGL textures need an image response with CORS support.
export const works = [
  {
    id: '01',
    title: 'Web讀寫卡系統',
    subtitle: 'Web Card Read / Write System',
    category: 'BLAZOR / 軟硬體整合',
    year: '—',
    description: '透過 Blazor 建立網頁操作介面，搭配 QP3000S 卡機，完成卡片資料的讀取與寫入。\n\n將卡片讀寫操作整合至 Web 系統，讓使用者透過網頁介面操作卡機。',
    imageUrl: './assets/web-card-system.png',
    imageCredit: 'Web讀寫卡系統 · 系統畫面',
    imageFit: 'contain',
    color: '#163d43'
  },
  {
    id: '02',
    title: 'LineBot',
    subtitle: 'LINE Chatbot',
    category: 'WEBHOOK / 聊天機器人',
    year: '—',
    description: '透過 webhook 接收使用者傳送給 LINE 機器人的訊息，處理後回傳回覆，讓使用者直接在 LINE 聊天介面與機器人互動。',
    imageUrl: './assets/linebot-chat.png',
    imageCredit: 'LineBot · 聊天畫面',
    imageFit: 'contain',
    color: '#385449'
  },
  {
    id: '03',
    title: 'BinanceTrade',
    subtitle: 'Crypto Trading Experiments & Performance Tracking',
    category: 'JEV × CODEX CLI / 交易實驗',
    year: '—',
    description: '把交易想法帶進可以觀察、記錄與檢視的實驗環境。BinanceTrade 透過 jev 與 Codex CLI 進行虛擬貨幣交易，並以 Binance Demo 的現貨與合約交易作為畫面中的實驗場景。\n\n每一筆成交，都成為理解交易結果的線索。儀表板集中呈現本輪損益、已實現與未實現損益、平倉筆數、持倉數及勝率，讓分散的交易紀錄轉化為清楚的數字。\n\n從執行交易，到回頭檢視每輪表現，這個作品記錄了工具協作與交易實驗的過程。畫面也列出現貨、合約各 100 筆的累計驗證目標，並標示待核對的資料，作為後續檢視與調整的依據。',
    imageUrl: './assets/binance-trade.png',
    imageCredit: 'BinanceTrade · Demo 交易損益儀表板',
    imageFit: 'contain',
    color: '#101d3b'
  },
  {
    id: '04',
    title: 'RagLearning問答機器人',
    subtitle: 'Knowledge Retrieval & Conversational Q&A',
    category: 'RAG / 知識庫問答',
    year: '—',
    description: '從一句提問開始，讓散落在知識庫裡的資料成為可以對話的答案。使用者透過 Ask、Search 或 Teams Bot 提出問題後，系統先搜尋 SQL Server 知識庫，找出相關內容。\n\n接著透過 Weighted RRF 與 Rerank 整理、排序候選資料，再交由 Ollama 產生回答，並附上引用來源，讓使用者能追溯答案的依據。\n\n實際對話中，使用者先問「請問高雄敬老卡的資料」，系統列出票卡欄位與資料來源；接著追問「那台南的呢？」，畫面便接續呈現台南市敬老卡資訊，展示連續追問的使用情境。',
    imageUrl: './assets/raglearning-flow.png',
    imageCredit: 'RagLearning · 問答流程與實際對話',
    imageFit: 'contain',
    images: [
      { src: './assets/raglearning-flow.png', alt: 'RagLearning 使用者問答流程：提出問題、搜尋 SQL Server 知識庫、整理相關證據，再由 Ollama 產生回答。', caption: '01 / 問答流程：從提問到有來源的回答' },
      { src: './assets/raglearning-chat.png', alt: '使用者查詢高雄敬老卡資料後，接著追問台南，系統回覆對應票卡資訊。', caption: '02 / 實際對話：查詢高雄，再接續追問台南' }
    ],
    color: '#253b35'
  },
  {
    id: '05',
    title: '高雄菜價快查',
    subtitle: 'Kaohsiung Food Price Explorer',
    category: '開放資料 / 生活應用',
    year: '—',
    description: '今天買菜，先掌握行情。把分散的食材價格整理成手機也能輕鬆查詢的網站，讓日常採買多一份參考。\n\n串接農業部近 14 天的蔬果批發資料，支援品名搜尋、蔬菜與水果篩選，以及高雄市、鳳山區兩市場比較；另整合豬、雞、牛、羊行情與全聯、家樂福線上商品售價，能辨識重量的品項也會換算每公斤價格。\n\n以 Python 整理價格快照，透過 GitHub Actions 每 6 小時排程更新並部署至 GitHub Pages。介面標示資料日期與來源，區分批發、肉品行情及線上零售價格；零售資料是定期快照，並非各門市即時售價。',
    imageUrl: './assets/kaohsiung-price-site.png',
    imageCredit: '高雄菜價快查 · 實際網站畫面',
    imageFit: 'contain',
    websiteUrl: 'https://ipass003482.github.io/kaohsiung-price-site/',
    repositoryUrl: 'https://github.com/ipass003482/kaohsiung-price-site',
    color: '#254e3c'
  },
  {
    id: '06',
    title: 'openAlice',
    subtitle: 'Adaptation of an Existing Trading Project',
    category: '既有專案改作 / 美股自動交易',
    year: '—',
    description: '這是一項以既有 openAlice 專案為基礎的修改實作。openAlice 原始專案並非由我開發；我借鏡其設計，依自己的使用需求進行修改，這裡展示的是修改後的版本。\n\n目前版本用於美股自動交易，並串接 moomoo 證券與元大證券。帳戶總覽呈現總權益、現金、已實現與未實現損益，搭配帳戶切換、不同時間區間的權益曲線與快照設定，方便觀察帳戶變化；截圖也包含元大台股 UAT 測試帳戶。\n\n這個項目記錄了從理解既有系統，到依需求調整與測試的實作過程。作品展示著重於借鏡、修改與應用的經驗，原專案的設計與開發成果歸屬原作者。',
    imageUrl: './assets/openalice-overview.png',
    imageCredit: 'openAlice 修改版 · 原專案由原作者開發',
    imageFit: 'contain',
    color: '#343c44'
  },
  {
    id: '07',
    title: 'Azure DevOps 平台運用',
    subtitle: 'Version Control, CI/CD & Security Scanning',
    category: '平台運用 / 建置與部署管理',
    year: '—',
    description: '這項展示記錄我運用既有 Azure DevOps 平台的工作經驗，平台本身由 Microsoft 提供。我的工作是整理各部門的程式，建立從版本管理、自動建置到部署與安全檢查的流程。\n\n1. 版本控制：整理各部門程式，依部門與專案分門別類，方便管理及追蹤版本。\n\n2. CI 自動建置：整合程式後，依 C#、Python、C 等不同語言配置對應的建置流程。\n\n3. CD 自動部署：將程式自動部署至指定主機，銜接建置與交付作業。\n\n4. 弱點掃描：安排程式弱點掃描，檢視程式中的潛在安全問題。\n\n5. 第三方套件掃描：運用 Sonatype 掃描專案使用的第三方套件，掌握相依套件的安全風險。',
    imageUrl: './assets/azure-devops-pipelines.png',
    imageCredit: 'Azure DevOps · 平台運用畫面（已遮蔽部分資訊）',
    imageFit: 'contain',
    color: '#263b50'
  },
];
