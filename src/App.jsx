import React, { useState, useMemo, useEffect, useRef, useLayoutEffect } from "react";

/* ---------------------------------------------
   design tokens
   bg washi  #FAF7F0   ink #2E2A24   ink-soft #6B6558
   line      #E4DFCF
   matcha    light #BDDBBD  mid #8DC48D  deep #2B7056  deepest #1B4A38
   accent    gold  #C9A227
--------------------------------------------- */

const FONT_STYLE = (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@300;400;500;700&display=swap');
    .font-display { font-family: 'Noto Serif TC', serif; }
    .font-body { font-family: 'Noto Sans TC', sans-serif; }
    html, body {
      -webkit-tap-highlight-color: transparent;
      overflow-x: hidden;
      -webkit-font-smoothing: antialiased;
    }
    /* iOS Safari/Chrome: the address bar resizes the viewport, so 100vh can be
       taller than what's actually visible. Prefer dvh where supported, with
       vh as the fallback for older browsers. */
    .min-h-screen { min-height: 100vh; min-height: 100dvh; }
    .safe-pb { padding-bottom: env(safe-area-inset-bottom); }
    .safe-pt { padding-top: env(safe-area-inset-top); }
    .wheel-col { scrollbar-width: none; -ms-overflow-style: none; overscroll-behavior-y: contain; }
    .wheel-col::-webkit-scrollbar { display: none; }
    /* main scroll area: keep enough room to clear the fixed bottom nav (5rem)
       AND the safe-area inset, additively (a plain pb-20 + safe-pb combo on
       the same element would just overwrite one another instead of adding). */
    .content-safe-pb { padding-bottom: calc(5rem + env(safe-area-inset-bottom) * 0.35); }
    .nav-safe-pb { padding-bottom: calc(env(safe-area-inset-bottom) * 0.35); }
    @media (max-width: 640px) {
      /* must stay >= 16px: iOS Safari auto-zooms the page when a smaller input/select/textarea gets focus */
      input, select, textarea { font-size: 16px !important; }
    }
    html, body { touch-action: manipulation; -webkit-text-size-adjust: 100%; background-color: #E0E6DA; min-height: 100%; }
    body { min-height: 100vh; min-height: -webkit-fill-available; min-height: 100dvh; }
    #root { min-height: 100vh; min-height: 100dvh; background-color: #E0E6DA; }
    button {
      border-radius: 9999px !important;
      color: #45320F !important;
      border: 1.5px solid #45320F !important;
      background-color: transparent !important;
    }
    button:active {
      color: #857763 !important;
      border-color: #857763 !important;
    }
    .btn-guest, .btn-nav, .btn-plain {
      border: none !important;
      background-color: transparent !important;
    }
    .btn-danger {
      color: #BA0F0F !important;
      border-color: #BA0F0F !important;
    }
    .btn-brown {
      color: #857763 !important;
      border-color: #857763 !important;
    }
    .btn-guest:active {
      color: #857763 !important;
      border-color: transparent !important;
    }
    .btn-nav:active {
      border-color: transparent !important;
    }
  `}</style>
);

const TEA_CATEGORIES = ["抹茶", "焙茶", "玄米茶", "其他"];
const CATEGORY_LABEL = {
  "抹茶": { zh: "抹茶", en: "Matcha", ja: "抹茶" },
  "焙茶": { zh: "焙茶", en: "Hojicha", ja: "ほうじ茶" },
  "玄米茶": { zh: "玄米茶", en: "Genmaicha", ja: "玄米茶" },
  "其他": { zh: "其他", en: "Other", ja: "その他" },
};

const TEA_STYLES = ["濃茶", "薄茶"];
const TEA_STYLE_LABEL = {
  "濃茶": { zh: "濃茶", en: "Koicha (Thick Tea)", ja: "濃茶" },
  "薄茶": { zh: "薄茶", en: "Usucha (Thin Tea)", ja: "薄茶" },
};

const MATCHA_BRANDS = [
  "丸久小山園","山政小山園","一保堂茶舖","碧翠園","星野製茶園","石本川口軒","堀井七茗園",
  "伊藤久右衛門","辻利茶舗","上林春松","西條園","中村藤吉本店","祇園辻利","柳櫻園","葵製茶","南山園",
  "福壽園","奧西綠芳園","古畑園","YUGEN","祥玉園","森半","北川半兵衛商店","共榮製茶",
  "森田製茶","千休","通圓","松北園","小柳津清一商店","丸七製茶","カネ十農園","高田茶園",
  "牛島製茶","矢部園","池田製茶",
  "利招園茶舖","松鶴園","伊藤園","井六園","錦一葉","泉園","カクニ茶藤","下堂園",
  "長谷川製茶","THE MATCHA TOKYO","TEA FOR US","茶易","其他",
];

const HOJICHA_BRANDS = [
  "丸八製茶場","上林金澤茶鋪","一保堂茶舖","HOHO HOJICHA","辻利茶舗","山政小山園","中村藤吉本店",
  "祇園辻利","伊藤久右衛門","森乃園","妙香園","丸山製茶","LUPICIA","伊藤園","森半",
  "福寿園","柳桜園茶舗","椿堂茶舗","竹沢製茶","長谷川製茶","天狗堂","下堂園","新緑園",
  "矢野園","放香堂","つぼ市製茶本舗","碧翠園","其他",
];

const GENMAICHA_BRANDS = [
  "一保堂茶舖","丸久小山園","辻利茶舗","伊藤久右衛門","中村藤吉本店","祇園辻利","山政小山園",
  "小柳津清一商店","森乃園","丸八製茶場","伊藤園","森半",
  "福寿園","柳桜園茶舗","椿堂茶舗","竹沢製茶","矢野園","其他",
];

const BRANDS_BY_CATEGORY = {
  "抹茶": MATCHA_BRANDS,
  "焙茶": HOJICHA_BRANDS,
  "玄米茶": GENMAICHA_BRANDS,
};

// union of every brand across all three lists, used as a fallback lookup when editing
// a record whose 茶品類別 doesn't map to one of the three preset brand lists.
const ALL_BRANDS = [...new Set([...MATCHA_BRANDS, ...HOJICHA_BRANDS, ...GENMAICHA_BRANDS])];

const ORIGIN_MAP = {
  "丸久小山園": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "山政小山園": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "一保堂茶舖": { zh: "京都府 京都市", en: "Kyoto City, Kyoto" },
  "碧翠園": { zh: "京都府 宇治市", en: "Uji, Kyoto" },
  "星野製茶園": { zh: "福岡県 八女", en: "Yame, Fukuoka" },
  "石本川口軒": { zh: "新潟 長岡", en: "Nagaoka, Niigata" },
  "堀井七茗園": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "伊藤久右衛門": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "辻利茶舗": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "上林春松": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "西條園": { zh: "愛知 西尾", en: "Nishio, Aichi" },
  "中村藤吉本店": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "祇園辻利": { zh: "京都府 京都市 祇園", en: "Gion, Kyoto City" },
  "柳櫻園": { zh: "京都府 京都市", en: "Kyoto City, Kyoto" },
  "葵製茶": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "南山園": { zh: "京都府 宇治田原", en: "Ujitawara, Kyoto" },
  "福壽園": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "奧西綠芳園": { zh: "京都府 和束", en: "Wazuka, Kyoto" },
  "古畑園": { zh: "静岡県 藤枝", en: "Fujieda, Shizuoka" },
  "YUGEN": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "祥玉園": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "森半": { zh: "京都府 宇治市", en: "Uji, Kyoto" },
  "北川半兵衛商店": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "共榮製茶": { zh: "京都府 宇治田原", en: "Ujitawara, Kyoto" },
  "森田製茶": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "千休": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "通圓": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "松北園": { zh: "京都府 宇治", en: "Uji, Kyoto" },
  "小柳津清一商店": { zh: "靜岡縣 靜岡市", en: "Shizuoka City, Shizuoka" },
  "丸七製茶": { zh: "靜岡 藤枝", en: "Fujieda, Shizuoka" },
  "カネ十農園": { zh: "靜岡 牧之原", en: "Makinohara, Shizuoka" },
  "高田茶園": { zh: "奈良県 大和高原", en: "Yamato Highlands, Nara" },
  "牛島製茶": { zh: "福岡 八女", en: "Yame, Fukuoka" },
  "矢部園": { zh: "宮城 鹽竈（精選靜岡、京都等茶區）", en: "Shiogama, Miyagi (sourcing from Shizuoka, Kyoto, etc.)" },
  "池田製茶": { zh: "鹿兒島 鹿兒島市", en: "Kagoshima City, Kagoshima" },
  "丸八製茶場": { zh: "石川縣 加賀市", en: "Kaga, Ishikawa" },
  "上林金澤茶鋪": { zh: "石川縣 金澤市", en: "Kanazawa, Ishikawa" },
  "HOHO HOJICHA": { zh: "京都府 京都市", en: "Kyoto City, Kyoto" },
  "森乃園": { zh: "東京都 中央區", en: "Chuo, Tokyo" },
  "妙香園": { zh: "愛知縣 名古屋市", en: "Nagoya, Aichi" },
  "丸山製茶": { zh: "靜岡縣 掛川市", en: "Kakegawa, Shizuoka" },
  "LUPICIA": { zh: "東京都 目黒区", en: "Meguro, Tokyo" },
  "伊藤園": { zh: "東京都 澀谷區", en: "Shibuya, Tokyo" },
  "利招園茶舖": { zh: "京都 宇治", en: "Uji, Kyoto" },
  "松鶴園": { zh: "愛知 西尾", en: "Nishio, Aichi" },
  "井六園": { zh: "京都 宇治", en: "Uji, Kyoto" },
  "錦一葉": { zh: "京都 宇治", en: "Uji, Kyoto" },
  "泉園": { zh: "京都 宇治", en: "Uji, Kyoto" },
  "カクニ茶藤": { zh: "靜岡 靜岡市", en: "Shizuoka City, Shizuoka" },
  "下堂園": { zh: "鹿兒島縣 鹿兒島市", en: "Kagoshima City, Kagoshima" },
  "長谷川製茶": { zh: "靜岡縣 靜岡市", en: "Shizuoka City, Shizuoka" },
  "福寿園": { zh: "京都府 木津川市", en: "Kizugawa, Kyoto" },
  "柳桜園茶舗": { zh: "京都府 京都市", en: "Kyoto City, Kyoto" },
  "椿堂茶舗": { zh: "京都府 京都市", en: "Kyoto City, Kyoto" },
  "竹沢製茶": { zh: "靜岡縣 靜岡市", en: "Shizuoka City, Shizuoka" },
  "天狗堂": { zh: "靜岡縣 靜岡市", en: "Shizuoka City, Shizuoka" },
  "新緑園": { zh: "宮崎縣 兒湯郡", en: "Koyu District, Miyazaki" },
  "矢野園": { zh: "京都府 宇治田原町", en: "Ujitawara, Kyoto" },
  "放香堂": { zh: "兵庫縣 神戶市", en: "Kobe, Hyogo" },
  "つぼ市製茶本舗": { zh: "大阪府 堺市", en: "Sakai, Osaka" },
  "THE MATCHA TOKYO": { zh: "京都 / 鹿兒島", en: "Kyoto / Kagoshima" },
  "TEA FOR US": { zh: "京都 宇治", en: "Uji, Kyoto" },
  "茶易": { zh: "京都 宇治", en: "Uji, Kyoto" },
};

const OCCASIONS = ["抹茶拿鐵", "焙茶拿鐵", "玄米茶拿鐵", "純飲", "烘焙", "入饌", "其他"];
const USAGE_PRESET = ["茶筅刷茶", "打泡器刷茶", "茶粉手搖杯"];
const LATTE_LABELS = ["抹茶拿鐵", "焙茶拿鐵", "玄米茶拿鐵"];
function getLatteLabel(category) {
  if (category === "焙茶") return "焙茶拿鐵";
  if (category === "玄米茶") return "玄米茶拿鐵";
  return "抹茶拿鐵";
}
function getOccasions(category) {
  return [getLatteLabel(category), "純飲", "烘焙", "入饌", "其他"];
}

const OCC_LABEL = {
  "抹茶拿鐵": { zh: "抹茶拿鐵", en: "Matcha Latte", ja: "抹茶ラテ" },
  "焙茶拿鐵": { zh: "焙茶拿鐵", en: "Hojicha Latte", ja: "ほうじ茶ラテ" },
  "玄米茶拿鐵": { zh: "玄米茶拿鐵", en: "Genmaicha Latte", ja: "玄米茶ラテ" },
  "純飲": { zh: "純飲", en: "Straight (Usucha)", ja: "そのまま飲む" },
  "烘焙": { zh: "烘焙", en: "Baking", ja: "製菓・焼き菓子" },
  "入饌": { zh: "入饌", en: "Cooking", ja: "料理" },
  "其他": { zh: "其他", en: "Other", ja: "その他" },
};
const USAGE_LABEL = {
  "茶筅刷茶": { zh: "茶筅刷茶", en: "Whisked (Chasen)", ja: "茶筅で点てる" },
  "打泡器刷茶": { zh: "打泡器刷茶", en: "Milk Frother", ja: "泡立て器" },
  "茶粉手搖杯": { zh: "茶粉手搖杯", en: "Shaker Bottle", ja: "シェイカーボトル" },
  "其他": { zh: "其他", en: "Other", ja: "その他" },
};
const STATUS_LABEL = {
  "未開封": { zh: "未開封", en: "Unopened", ja: "未開封" },
  "已開封": { zh: "已開封", en: "Opened", ja: "開封済み" },
};

const RATING_FILL = { 1: "#D7E8D2", 2: "#BDDBBD", 3: "#8DC48D", 4: "#4F9A6F", 5: "#2B7056" };

const DATE_RE = /^(\d{4})\/(\d{2})\/(\d{2})$/;
function parseDMY(s) {
  if (!s) return null;
  const m = DATE_RE.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  if (isNaN(dt.getTime())) return null;
  return dt;
}
function todayDMY() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`;
}
function currentTimeHHMM() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDMYInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length > 6) return `${digits.slice(0, 4)}/${digits.slice(4, 6)}/${digits.slice(6)}`;
  if (digits.length > 4) return `${digits.slice(0, 4)}/${digits.slice(4)}`;
  return digits;
}
function daysFromToday(target) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.round((t - start) / 86400000);
}

/* ---------------- i18n ---------------- */
const STR = {
  zh: {
    appName: "抹茶ログ", appSub: "Matcha Log",
    tagline: "紀錄每一碗抹茶的品牌、風味與心情",
    nav_home: "首頁", nav_records: "使用紀錄", nav_expiry: "到期提醒",
    visit_title: "茶訪", visit_add: "新增茶訪", visit_store: "店家", visit_address: "地區 / 地址", visit_date: "到訪日期（年/月/日）", visit_comment: "留言分享", visit_photo: "照片（選填）", visit_photo_add: "加入照片", visit_save: "儲存", visit_delete: "刪除", visit_empty: "還沒有茶訪紀錄", visit_rating_err: "請選擇評分", visit_drag_hint: "按住 ⠿ 拖曳可調整照片順序", nav_visit: "茶訪",
    nav_stats: "統計", nav_feedback: "意見", nav_settings: "設定",
    home_welcome: "歡迎回來！", home_guest: "訪客模式",
    home_recent: "最近紀錄", home_fav: "我的最愛", home_fav_empty: "尚未標記我的最愛", fav_toggle: "我的最愛", home_viewAll: "查看全部",
    home_addBtn: "＋ 新增紀錄",
    home_empty: "還沒有任何紀錄，開始記下第一碗抹茶吧！",
    stat_total: "總紀錄數", stat_topBrand: "最常喝的品牌",
    stat_topOccasion: "最常見用途", stat_avg: "平均星等",
    records_title: "使用紀錄",
    records_search: "搜尋品牌、產地、商店或備註...",
    filter_occasion: "用途", filter_rating: "星級", filter_all: "全部",
    filter_category: "類別",
    filter_price: "價錢", price_asc: "由低至高", price_desc: "由高至低",
    records_totalUsed: "累積使用", records_usageCount: "總使用次數", records_countUnit: "次",
    usage_earliest: "最早使用", usage_latest: "最近使用", filter_usageDate: "使用日期",
    records_empty: "找不到符合條件的紀錄，換個關鍵字或篩選條件看看。",
    add_title: "新增紀錄", edit_title: "編輯紀錄", add_back: "← 返回",
    add_photo: "抹茶照片", add_photo_hint: "上傳照片作為紀錄圖示（選填）",
    add_photo_remove: "移除照片", photo_new: "新增照片", photo_change: "更換照片",
    add_brand: "品牌 *", add_brand_ph: "請選擇品牌", add_brand_other_ph: "請輸入品牌名稱",
    add_category: "茶品類別", add_category_ph: "請選擇類別", add_category_other_ph: "請輸入類別",
    add_origin: "產地", add_cultivar: "銘柄/產品名稱", add_origin_ph: "請輸入產地",
    add_weight: "初始重量",
    add_openedDate: "開封日期（年/月/日）", add_expiryDays: "開封日數（最多 30 天）",
    add_status: "狀態", add_finishedDate: "用完日期（年/月/日）",
    add_suggestedExpiry: "開封後建議期限",
    weight_remaining: "剩餘克數", weight_log: "使用紀錄", weight_add: "新增使用", weight_add_title: "新增使用紀錄",
    weight_amount: "使用克數（g）", weight_save: "儲存使用紀錄", weight_empty: "尚無使用紀錄",
    action_edit: "編輯", action_save: "儲存",
    weight_useDate: "使用日期（年/月/日）", weight_useTime: "使用時間", weight_note: "備註（選填）",
    weight_useDate_label: "使用日期", weight_amount_label: "使用克數", weight_maxPrefix: "最多可輸入",
    weight_afterPreview: "本次使用後，剩餘克數將變為",
    weight_note_ph: "例如：牛奶 200ml，微糖，味道很順！",
    weight_usedUp: "已用完",
    status_all: "全部", status_inUse: "使用中", status_unopened: "未開封", status_used: "已用完",
    status_openedDay: "開封第", status_openedDaySuffix: "天",
    status_untilExpiry: "距離建議期限還有",
    status_daySuffix: "天",
    add_purchaseDate: "購入日期（年/月/日）", add_store: "購買商店 / 地點",
    add_price: "價錢",
    price_na: "不適用", add_priceSource: "來源",
    add_unsealedExpiry: "未開封效期（年/月/日）*",
    add_rating: "評級 *",
    add_notes: "備註（選填）",
    add_teaStyle: "茶道型態",
    add_occasion: "用途 *", add_occasion_other_ph: "請輸入用途",
    add_usage: "使用方式", add_usage_ph: "請選擇方式", add_usage_other_ph: "請輸入使用方式",
    add_cancel: "取消", add_save: "儲存紀錄",
    date_err: "請輸入正確的日期格式（年/月/日）",
    expiry_title: "到期提醒",
    expiry_openedDate: "開封日期", expiry_days: "開封天數",
    expiry_markOpened: "標記為已開封", expiry_markUnopened: "標記為未開封",
    expiry_noDate: "尚未設定到期日", expiry_today: "今天到期", expiry_dateLabel: "到期期限",
    expiry_empty: "目前沒有任何紀錄。",
    stats_title: "統計",
    stats_filterYear: "年份", stats_filterMonth: "月份",
    stats_priceBreakdown: "價格排行 (由高至低)", stats_priceTop: "最貴", stats_priceLow: "最便宜", stats_brandBreakdown: "品牌分佈", stats_occasionBreakdown: "用途分佈",
    feedback_title: "意見回饋", feedback_category: "類型",
    feedback_suggest: "功能建議", feedback_bug: "問題回報", feedback_other: "其他",
    feedback_message: "內容", feedback_message_ph: "請輸入你的意見...",
    feedback_email: "聯絡 Email（選填）", feedback_submit: "送出回饋",
    feedback_thanks: "謝謝你的回饋！", feedback_sending: "傳送中...", feedback_error: "傳送失敗，請檢查網路後再試一次。",
    settings_title: "設定", settings_account: "帳號",
    settings_guest_hint: "資料只會儲存於本裝置，一旦清除瀏覽器紀錄或於手機主畫面移除web app，資料會一同清除",
    settings_login_btn: "修改暱稱", settings_nick_label: "暱稱", settings_nick_save: "儲存", settings_logout: "登出",
    settings_language: "語言設置",
    settings_data: "資料管理",
    settings_export: "匯出全部資料", settings_import: "匯入資料", settings_clear: "清除所有資料",
    settings_clear_confirm: "確定要清除所有紀錄嗎？此操作無法復原。",
    settings_clear_yes: "確認清除",
    settings_storage_note: "資料只會儲存於本裝置，一旦清除瀏覽器紀錄或於手機主畫面移除web app，資料會一同清除",
    auth_guest: "以訪客身份繼續",
    delete: "刪除紀錄",
    delete_confirm_msg: "刪除後資料無法復原",
    delete_cancel: "取消", delete_yes: "確認刪除",
    label_validUntil: "有效期限",
    status_finishedDate: "用完日期",
  },
  en: {
    appName: "抹茶ログ", appSub: "Matcha Log",
    tagline: "Track every bowl of matcha — brand, flavor, and mood.",
    nav_home: "Home", nav_records: "Records", nav_expiry: "Expiry",
    visit_title: "Tea Visits", visit_add: "Add Visit", visit_store: "Shop", visit_address: "Area / Address", visit_date: "Visit Date (YYYY/MM/DD)", visit_comment: "Comments", visit_photo: "Photo (optional)", visit_photo_add: "Add Photo", visit_save: "Save", visit_delete: "Delete", visit_empty: "No tea visits yet", visit_rating_err: "Please choose a rating", visit_drag_hint: "Hold ⠿ and drag to reorder photos", nav_visit: "Visits",
    nav_stats: "Stats", nav_feedback: "Feedback", nav_settings: "Settings",
    home_welcome: "Welcome back!", home_guest: "Guest Mode",
    home_recent: "Recent Records", home_fav: "Favorites", home_fav_empty: "No favorites yet", fav_toggle: "Favorite", home_viewAll: "View all",
    home_addBtn: "+ Add Record",
    home_empty: "No records yet — log your first bowl of matcha!",
    stat_total: "Total Records", stat_topBrand: "Top Brand",
    stat_topOccasion: "Top Occasion", stat_avg: "Average Rating",
    records_title: "Records",
    records_search: "Search brand, origin, store or notes...",
    filter_occasion: "Occasion", filter_rating: "Rating", filter_all: "All",
    filter_category: "Category",
    filter_price: "Price", price_asc: "Low to High", price_desc: "High to Low",
    records_totalUsed: "Total Used", records_usageCount: "Total Usage Count", records_countUnit: " times",
    usage_earliest: "Earliest Use", usage_latest: "Latest Use", filter_usageDate: "Usage Date",
    records_empty: "No matching records — try a different keyword or filter.",
    add_title: "Add Record", edit_title: "Edit Record", add_back: "← Back",
    add_photo: "Matcha Photo", add_photo_hint: "Upload a photo as the record icon (optional)",
    add_photo_remove: "Remove photo", photo_new: "Add Photo", photo_change: "Change Photo",
    add_brand: "Brand *", add_brand_ph: "Select a brand", add_brand_other_ph: "Enter brand name",
    add_category: "Tea Category", add_category_ph: "Select a category", add_category_other_ph: "Enter category",
    add_origin: "Origin", add_cultivar: "Cultivar / Product Name", add_origin_ph: "Enter origin",
    add_weight: "Initial Weight",
    add_openedDate: "Opened Date (YYYY/MM/DD)", add_expiryDays: "Days After Opening (max 30)",
    add_status: "Status", add_finishedDate: "Finished Date (YYYY/MM/DD)",
    add_suggestedExpiry: "Suggested Expiry After Opening",
    weight_remaining: "Remaining Weight", weight_log: "Usage Log", weight_add: "Log Usage", weight_add_title: "Add Usage Record",
    weight_amount: "Amount Used (g)", weight_save: "Save Usage", weight_empty: "No usage logged yet",
    action_edit: "Edit", action_save: "Save",
    weight_useDate: "Usage Date (YYYY/MM/DD)", weight_useTime: "Usage Time", weight_note: "Notes (optional)",
    weight_useDate_label: "Usage Date", weight_amount_label: "Amount Used", weight_maxPrefix: "Max",
    weight_afterPreview: "After this use, remaining weight will be",
    weight_note_ph: "e.g. Milk 200ml, less sugar, smooth taste!",
    weight_usedUp: "Used Up",
    status_all: "All", status_inUse: "In Use", status_unopened: "Unopened", status_used: "Used Up",
    status_openedDay: "Day ", status_openedDaySuffix: " opened",
    status_untilExpiry: "days until suggested expiry",
    status_daySuffix: "d",
    add_purchaseDate: "Purchase Date (YYYY/MM/DD)", add_store: "Store / Location",
    add_price: "Price",
    price_na: "N/A", add_priceSource: "Source",
    add_unsealedExpiry: "Unopened Validity (YYYY/MM/DD) *",
    add_rating: "Rating *",
    add_notes: "Notes (optional)",
    add_teaStyle: "Tea Style",
    add_occasion: "Occasion *", add_occasion_other_ph: "Enter occasion",
    add_usage: "Brewing Method", add_usage_ph: "Select a method", add_usage_other_ph: "Enter brewing method",
    add_cancel: "Cancel", add_save: "Save Record",
    date_err: "Please use the YYYY/MM/DD format",
    expiry_title: "Expiry Reminders",
    expiry_openedDate: "Opened Date", expiry_days: "Days Opened",
    expiry_markOpened: "Mark as Opened", expiry_markUnopened: "Mark as Unopened",
    expiry_noDate: "No expiry date set", expiry_today: "Expires today", expiry_dateLabel: "Expiry Date",
    expiry_empty: "No records yet.",
    stats_title: "Stats Dashboard",
    stats_filterYear: "Year", stats_filterMonth: "Month",
    stats_priceBreakdown: "Price Ranking (High to Low)", stats_priceTop: "Most expensive", stats_priceLow: "Cheapest", stats_brandBreakdown: "Brand Breakdown", stats_occasionBreakdown: "Occasion Breakdown",
    feedback_title: "Feedback", feedback_category: "Category",
    feedback_suggest: "Feature Suggestion", feedback_bug: "Bug Report", feedback_other: "Other",
    feedback_message: "Message", feedback_message_ph: "Tell us what you think...",
    feedback_email: "Contact Email (optional)", feedback_submit: "Submit Feedback",
    feedback_thanks: "Thanks for your feedback!", feedback_sending: "Sending...", feedback_error: "Failed to send. Please check your connection and try again.",
    settings_title: "Settings", settings_account: "Account",
    settings_guest_hint: "Data is stored only on this device. If you clear your browser data or remove the web app from your phone's home screen, your data will be erased too.",
    settings_login_btn: "Edit Nickname", settings_nick_label: "Nickname", settings_nick_save: "Save", settings_logout: "Log out",
    settings_language: "Language",
    settings_data: "Data Management",
    settings_export: "Export All Data", settings_import: "Import Data", settings_clear: "Clear All Data",
    settings_clear_confirm: "Are you sure you want to clear all records? This cannot be undone.",
    settings_clear_yes: "Confirm Clear",
    settings_storage_note: "Data is stored only on this device. If you clear your browser data or remove the web app from your phone's home screen, your data will be erased too.",
    auth_guest: "Continue as Guest",
    delete: "Delete record",
    delete_confirm_msg: "This cannot be undone once deleted",
    delete_cancel: "Cancel", delete_yes: "Confirm Delete",
    label_validUntil: "Valid until",
    status_finishedDate: "Finished on",
  },
  ja: {
    appName: "抹茶ログ", appSub: "Matcha Log",
    tagline: "抹茶一杯ごとの銘柄、風味、気分を記録しよう",
    nav_home: "ホーム", nav_records: "記録", nav_expiry: "賞味期限",
    visit_title: "お茶訪問", visit_add: "訪問を追加", visit_store: "お店", visit_address: "地域・住所", visit_date: "訪問日（年/月/日）", visit_comment: "コメント", visit_photo: "写真（任意）", visit_photo_add: "写真を追加", visit_save: "保存", visit_delete: "削除", visit_empty: "お茶訪問の記録はまだありません", visit_rating_err: "評価を選んでください", visit_drag_hint: "⠿ を押したままドラッグして写真の順番を変更", nav_visit: "訪問",
    nav_stats: "統計", nav_feedback: "フィードバック", nav_settings: "設定",
    home_welcome: "おかえりなさい！", home_guest: "ゲストモード",
    home_recent: "最近の記録", home_fav: "お気に入り", home_fav_empty: "お気に入りはまだありません", fav_toggle: "お気に入り", home_viewAll: "すべて見る",
    home_addBtn: "＋ 記録を追加",
    home_empty: "まだ記録がありません。最初の一杯を記録しましょう！",
    stat_total: "総記録数", stat_topBrand: "よく飲むブランド",
    stat_topOccasion: "よくある用途", stat_avg: "平均評価",
    records_title: "記録",
    records_search: "ブランド、産地、店舗、メモを検索...",
    filter_occasion: "用途", filter_rating: "評価", filter_all: "すべて",
    filter_category: "種類",
    filter_price: "価格", price_asc: "安い順", price_desc: "高い順",
    records_totalUsed: "累計使用量", records_usageCount: "総使用回数", records_countUnit: "回",
    usage_earliest: "開封が古い順", usage_latest: "開封が新しい順", filter_usageDate: "使用日",
    records_empty: "条件に合う記録が見つかりません。キーワードや条件を変えてみてください。",
    add_title: "記録を追加", edit_title: "記録を編集", add_back: "← 戻る",
    add_photo: "抹茶の写真", add_photo_hint: "写真をアイコンとしてアップロード（任意）",
    add_photo_remove: "写真を削除", photo_new: "写真を追加", photo_change: "写真を変更",
    add_brand: "ブランド *", add_brand_ph: "ブランドを選択", add_brand_other_ph: "ブランド名を入力",
    add_category: "茶の種類", add_category_ph: "種類を選択", add_category_other_ph: "種類を入力",
    add_origin: "産地", add_cultivar: "銘柄・商品名", add_origin_ph: "産地を入力",
    add_weight: "初期重量",
    add_openedDate: "開封日（年/月/日）", add_expiryDays: "開封後の日数（最大30日）",
    add_status: "状態", add_finishedDate: "使い切った日（年/月/日）",
    add_suggestedExpiry: "開封後の推奨賞味期限",
    weight_remaining: "残量", weight_log: "使用履歴", weight_add: "使用を記録", weight_add_title: "使用記録を追加",
    weight_amount: "使用量（g）", weight_save: "使用記録を保存", weight_empty: "まだ使用記録がありません",
    action_edit: "編集", action_save: "保存",
    weight_useDate: "使用日（年/月/日）", weight_useTime: "使用時間", weight_note: "メモ（任意）",
    weight_useDate_label: "使用日", weight_amount_label: "使用量", weight_maxPrefix: "最大",
    weight_afterPreview: "今回の使用後、残量は次のようになります：",
    weight_note_ph: "例：牛乳200ml、甘さ控えめ、なめらかな味！",
    weight_usedUp: "使い切りました",
    status_all: "すべて", status_inUse: "使用中", status_unopened: "未開封", status_used: "使い切り",
    status_openedDay: "開封", status_openedDaySuffix: "日目",
    status_untilExpiry: "推奨期限まで",
    status_daySuffix: "日",
    add_purchaseDate: "購入日（年/月/日）", add_store: "購入店舗・場所",
    add_price: "価格",
    price_na: "該当なし", add_priceSource: "入手元",
    add_unsealedExpiry: "未開封賞味期限（年/月/日）*",
    add_rating: "評価 *",
    add_notes: "メモ（任意）",
    add_teaStyle: "点前の種類",
    add_occasion: "用途 *", add_occasion_other_ph: "用途を入力",
    add_usage: "使用方法", add_usage_ph: "方法を選択", add_usage_other_ph: "使用方法を入力",
    add_cancel: "キャンセル", add_save: "記録を保存",
    date_err: "年/月/日の形式で入力してください",
    expiry_title: "賞味期限リマインダー",
    expiry_openedDate: "開封日", expiry_days: "開封日数",
    expiry_markOpened: "開封済みにする", expiry_markUnopened: "未開封に戻す",
    expiry_noDate: "期限が未設定です", expiry_today: "本日期限", expiry_dateLabel: "賞味期限日",
    expiry_empty: "現在、記録はありません。",
    stats_title: "統計",
    stats_filterYear: "年", stats_filterMonth: "月",
    stats_priceBreakdown: "価格ランキング（高い順）", stats_priceTop: "最も高い", stats_priceLow: "最も安い", stats_brandBreakdown: "ブランド別内訳", stats_occasionBreakdown: "用途別内訳",
    feedback_title: "フィードバック", feedback_category: "種類",
    feedback_suggest: "機能提案", feedback_bug: "不具合報告", feedback_other: "その他",
    feedback_message: "内容", feedback_message_ph: "ご意見をお聞かせください...",
    feedback_email: "連絡先メール（任意）", feedback_submit: "送信する",
    feedback_thanks: "フィードバックありがとうございます！", feedback_sending: "送信中...", feedback_error: "送信に失敗しました。接続を確認してもう一度お試しください。",
    settings_title: "設定", settings_account: "アカウント",
    settings_guest_hint: "データはこの端末にのみ保存されます。ブラウザの履歴を消去したり、ホーム画面からWebアプリを削除したりすると、データも一緒に消去されます。",
    settings_login_btn: "ニックネームを変更", settings_nick_label: "ニックネーム", settings_nick_save: "保存", settings_logout: "ログアウト",
    settings_language: "言語設定",
    settings_data: "データ管理",
    settings_export: "全データを書き出す", settings_import: "データを読み込む", settings_clear: "すべてのデータを削除",
    settings_clear_confirm: "本当にすべての記録を削除しますか？この操作は取り消せません。",
    settings_clear_yes: "削除する",
    settings_storage_note: "データはこの端末にのみ保存されます。ブラウザの履歴を消去したり、ホーム画面からWebアプリを削除したりすると、データも一緒に消去されます。",
    auth_guest: "ゲストとして続ける",
    delete: "記録を削除",
    delete_confirm_msg: "削除すると元に戻せません",
    delete_cancel: "キャンセル", delete_yes: "削除を確認",
    label_validUntil: "賞味期限",
    status_finishedDate: "使い切った日",
  },
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const seedData = [
  {
    id: 1, photo: null, category: "抹茶", brand: "丸久小山園", origin: "京都府 宇治", cultivar: "千木の白",
    purchaseDate: "2026/07/11", store: "丸久小山園Global官方網站", currency: "JPY¥", price: "2920",
    initialWeight: "40", unsealedExpiry: "", rating: 4,
    occasions: ["抹茶拿鐵", "純飲", "拍攝測試抹茶粉細緻度reels"], usage: "", teaStyle: "薄茶", notes: "",
    status: "已開封", openedDate: "2026/08/02", expiryDays: 30, finishedDate: "", usageLog: [],
  },
  {
    id: 2, photo: null, category: "抹茶", brand: "一保堂茶舖", origin: "京都府 京都市", cultivar: "初昔",
    purchaseDate: "2026/07/11", store: "淘寶（元氣茶舖日代）", currency: "CNY¥", price: "82",
    initialWeight: "20", unsealedExpiry: "", rating: 3,
    occasions: ["抹茶拿鐵"], usage: "", teaStyle: "", notes: "比較苦澀，不能單喝；配牛奶做成拿鐵不錯。",
    status: "已用完", openedDate: "", expiryDays: 30, finishedDate: "2026/07/26", usageLog: [],
  },
  {
    id: 3, photo: null, category: "焙茶", brand: "HOHO HOJICHA", origin: "京都府 京都市", cultivar: "淺煎",
    purchaseDate: "2026/07/11", store: "新宿車站地下街 抹茶店", currency: "JPY¥", price: "2100",
    initialWeight: "30", unsealedExpiry: "2027/03/01", rating: 1,
    occasions: ["焙茶拿鐵"], usage: "", teaStyle: "", notes: "粉比較粗，有焙茶香味但並不算香",
    status: "未開封", openedDate: "", expiryDays: 30, finishedDate: "", usageLog: [],
  },
  {
    id: 4, photo: null, category: "抹茶", brand: "YUGEN", origin: "京都府 宇治", cultivar: "0號",
    purchaseDate: "2026/07/11", store: "YUGEN website", currency: "USD$", price: "12",
    initialWeight: "30", unsealedExpiry: "", rating: 2,
    occasions: ["抹茶拿鐵", "烘焙"], usage: "", teaStyle: "", notes: "普通沒甚麼記憶點，下次不用買",
    status: "已開封", openedDate: "2026/08/05", expiryDays: 30, finishedDate: "", usageLog: [],
  },
];

/* ---------- svg: matcha bowl icon, encodes rating via colour + froth count ---------- */
function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}
function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function arcPath(cx, cy, r, startDeg, sweepDeg) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, startDeg + sweepDeg);
  const large = sweepDeg > 180 ? 1 : 0;
  return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
}
function MatchaBowl({ rating, seedKey, size = 56 }) {
  const seed = hashSeed(String(seedKey));
  const base = seed % 360;
  const cx = 32, cy = 32;
  const strokes = Array.from({ length: rating }).map((_, i) => {
    const start = base + i * (360 / Math.max(rating, 1)) + (seed % 17);
    return arcPath(cx, cy, 15 - (i % 2 ? 1 : 0), start, 34);
  });
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className="shrink-0" aria-hidden="true">
      <circle cx="32" cy="32" r="30" fill="#FAF7F0" stroke="#D9CBAE" strokeWidth="2" />
      <circle cx="32" cy="32" r="23" fill={RATING_FILL[rating] || RATING_FILL[3]} />
      <ellipse cx="25" cy="24" rx="7" ry="4" fill="#FFFFFF" opacity="0.18" />
      {strokes.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#F4F1E4" strokeOpacity="0.55" strokeWidth="1.6" strokeLinecap="round" />
      ))}
      <circle cx="32" cy="32" r="23" fill="none" stroke="#1B4A38" strokeOpacity="0.18" strokeWidth="1" />
    </svg>
  );
}
function RecordIcon({ record, size = 56 }) {
  if (record.photo) {
    return (
      <img
        src={record.photo}
        alt={record.brand}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 border border-[#E4DFCF]"
      />
    );
  }
  return <MatchaBowl rating={record.rating} seedKey={record.id} size={size} />;
}

function TrashIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}
function EditIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}
function RowIcon({ name, size = 16 }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "#6B6558", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "calendar": return <svg {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
    case "clock": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>;
    case "scale": return <svg {...p}><path d="M12 3v18M7 6h10M5 6l-2 5a2.5 2.5 0 005 0zM19 6l-2 5a2.5 2.5 0 005 0z" /></svg>;
    case "leaf": return <svg {...p}><path d="M5 21c0-8 5-15 14-16-1 9-8 14-14 16z" /><path d="M9 15c2-2 4-5 5-9" /></svg>;
    case "note": return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h5" /></svg>;
    default: return null;
  }
}

function Stars({ value, size = 14, onSelect }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <svg key={n} onClick={onSelect ? () => onSelect(n) : undefined} width={size} height={size}
          viewBox="0 0 20 20" className={onSelect ? "cursor-pointer" : ""} fill={n <= value ? "#C9A227" : "#E4DFCF"}>
          <path d="M10 1.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L10 14.8l-5.3 2.8 1.1-5.9L1.5 7.6l5.9-.7L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function NavIcon({ name, active }) {
  const stroke = active ? "#2B7056" : "#9C9484";
  const p = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home": return <svg {...p}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></svg>;
    case "records": return <svg {...p}><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>;
    case "expiry": return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>;
    case "stats": return <svg {...p}><path d="M4 19V5M4 19h16M8 15v4M12 11v8M16 7v12" /></svg>;
    case "visit": return <svg {...p}><path d="M5 9h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5V9z" /><path d="M16 10h1.5a2.5 2.5 0 010 5H16" /><path d="M9 3v2M12 3v2" /></svg>;
    case "feedback": return <svg {...p}><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" /></svg>;
    case "settings": return <svg {...p}><circle cx="12" cy="12" r="3.2" /><path d="M4 12h2M18 12h2M12 4v2M12 18v2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M6.3 17.7l1.4-1.4M16.3 7.7l1.4-1.4" /></svg>;
    default: return null;
  }
}

const PRICE_NA = "不適用";
const CURRENCY_OTHER = "其他貨幣";
const CURRENCIES = ["JPY¥", "CAD$", "CNY¥", "GBP£", "HKD$", "KRW₩", "USD$", CURRENCY_OTHER, PRICE_NA];
function currencyLabel(c, lang, other) {
  if (c === CURRENCY_OTHER && other) return other;
  if (c === CURRENCY_OTHER) return { zh: "其他貨幣", en: "Other currency", ja: "その他の通貨" }[lang] || c;
  return c;
}
const PRICE_SOURCES = ["親友贈送", "公關邀請/禮物"];
const PRICE_SOURCE_LABEL = {
  "親友贈送": { zh: "親友贈送", en: "Gift from friends/family", ja: "家族・友人からの贈り物" },
  "公關邀請/禮物": { zh: "公關邀請/禮物", en: "PR invitation / gift", ja: "PRご招待・ギフト" },
};
// Approximate static exchange rates to USD, for comparing prices across currencies.
// NOTE: this is a fixed reference table baked into the app, not a live/hourly feed —
// a frontend-only demo has no backend to call a real FX API from.
const EXCHANGE_RATES_TO_USD = {
  "JPY¥": 1 / 150,
  "CAD$": 1 / 1.38,
  "GBP£": 1.27,
  "HKD$": 1 / 7.8,
  "KRW₩": 1 / 1370,
  "USD$": 1,
  "CNY¥": 1 / 7.2,
};
function toUSD(price, currency) {
  // "不適用" (gifted / not purchased) and empty prices have no comparable value
  if (currency === PRICE_NA || currency === CURRENCY_OTHER || price === "" || price == null) return null;
  const n = Number(price);
  if (isNaN(n)) return null;
  const rate = EXCHANGE_RATES_TO_USD[currency] ?? 1;
  return n * rate;
}

// Suggested use-by date after opening: opened date + 30 days, e.g. "2026/09/01 (30天)"
function suggestedExpiryText(openedDate, lang) {
  const opened = parseDMY(openedDate);
  if (!opened) return "—";
  const target = new Date(opened.getTime() + 30 * 86400000);
  const pad = (n) => String(n).padStart(2, "0");
  const unit = { zh: "天", en: " days", ja: "日" }[lang] || " days";
  return `${target.getFullYear()}/${pad(target.getMonth() + 1)}/${pad(target.getDate())} (30${unit})`;
}

// Approximate HKD equivalent for display, e.g. "(約HKD$145.1)". Null for HKD itself / no price.
function hkdApprox(price, currency, lang) {
  if (currency === "HKD$") return null;
  const usd = toUSD(price, currency);
  if (usd === null || usd <= 0) return null;
  const hkd = Math.round(usd * 7.8 * 10) / 10;
  return `(${lang === "en" ? "approx. " : "約"}HKD$${hkd.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })})`;
}

const initialForm = {
  photo: null, category: "抹茶", categoryOther: "", brand: "", brandOther: "", origin: "", cultivar: "",
  purchaseDate: "", store: "", currency: "JPY¥", currencyOther: "", price: "", priceSource: "", initialWeight: "", unsealedExpiry: "", favorite: false,
  rating: 0,
  occasions: [], occasionOther: "",
  usage: "", usageOther: "", teaStyle: "", notes: "",
  status: "未開封", openedDate: "", expiryDays: 30, finishedDate: "",
};

function recordToForm(r) {
  const catKnown = TEA_CATEGORIES.includes(r.category) && r.category !== "其他";
  const categoryValue = catKnown ? r.category : (r.category ? "其他" : "抹茶");
  const brandList = BRANDS_BY_CATEGORY[categoryValue] || ALL_BRANDS;
  const brandKnown = brandList.includes(r.brand) && r.brand !== "其他";
  const knownOccasions = getOccasions(categoryValue);
  const legacyOccasions = r.occasions ? r.occasions : (r.occasion ? [r.occasion] : []);
  const known = legacyOccasions.filter((o) => knownOccasions.includes(o) && o !== "其他");
  const customVals = legacyOccasions.filter((o) => !knownOccasions.includes(o) || o === "其他");
  const hasOther = customVals.length > 0;
  const occasionsValue = hasOther ? [...new Set([...known, "其他"])] : known;
  const isPreset = occasionsValue.some((o) => LATTE_LABELS.includes(o)) || occasionsValue.includes("純飲");
  const usageKnown = isPreset && USAGE_PRESET.includes(r.usage);
  return {
    photo: r.photo || null,
    category: categoryValue,
    categoryOther: catKnown ? "" : (r.category && r.category !== "抹茶" ? r.category : ""),
    brand: brandKnown ? r.brand : "其他",
    brandOther: brandKnown ? "" : r.brand || "",
    origin: r.origin || "",
    cultivar: r.cultivar || "",
    purchaseDate: r.purchaseDate || "",
    store: r.store || "",
    currency: r.currency || "JPY¥",
    currencyOther: r.currencyOther || "",
    price: r.price || "",
    priceSource: r.priceSource || "",
    favorite: !!r.favorite,
    initialWeight: r.initialWeight || "",
    unsealedExpiry: r.unsealedExpiry || "",
    rating: r.rating || 0,
    occasions: occasionsValue,
    occasionOther: hasOther ? (customVals.find((o) => o !== "其他") || "") : "",
    usage: isPreset ? (usageKnown ? r.usage : "其他") : "",
    usageOther: isPreset ? (usageKnown ? "" : r.usage || "") : (r.usage || ""),
    teaStyle: r.teaStyle || "",
    notes: r.notes || "",
    status: r.status || "未開封",
    openedDate: r.openedDate || "",
    expiryDays: 30,
    finishedDate: r.finishedDate || "",
  };
}

// weight/status helpers (weight tracking is derived, not separately stored)
function roundG(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}
function computeRemaining(r) {
  const init = Number(r.initialWeight) || 0;
  const used = (r.usageLog || []).reduce((s, u) => s + (Number(u.amount) || 0), 0);
  return roundG(Math.max(0, init - used));
}
function computeStatus(r) {
  const init = Number(r.initialWeight) || 0;
  if (r.status === "已用完" || (init > 0 && computeRemaining(r) <= 0)) return "已用完";
  if (r.status === "未開封") return "未開封";
  if (r.status === "已開封") return "使用中";
  if (r.openedDate) return "使用中";
  return "未開封";
}
function daysSince(dmy) {
  const d = parseDMY(dmy);
  if (!d) return null;
  return -daysFromToday(d);
}
function usageDateRange(r) {
  const dates = (r.usageLog || []).map((u) => parseDMY(u.date)).filter(Boolean);
  if (dates.length === 0) return { earliest: null, latest: null };
  const times = dates.map((d) => d.getTime());
  return { earliest: new Date(Math.min(...times)), latest: new Date(Math.max(...times)) };
}
function firstUsageDate(r) {
  let best = null, bestStr = null;
  (r.usageLog || []).forEach((u) => {
    const d = parseDMY(u.date);
    if (d && (!best || d < best)) { best = d; bestStr = u.date; }
  });
  return bestStr;
}
// When logged usage uses up the whole initial weight, the record's stored status
// flips to 已用完 (finish date = last usage date). If a later edit/delete of a usage
// entry leaves grams remaining again, an auto-finished record goes back to 已開封.
function clampAmount(v, max) {
  if (v === "" || max === undefined) return v;
  const n = Number(v);
  if (isNaN(n)) return v;
  return n > max ? String(max) : v;
}
function applyFinishStep(rec, wasEmpty) {
  // first usage on an unopened record: it is now in use
  if (rec.status === "未開封" && (rec.usageLog || []).length > 0) {
    rec = { ...rec, status: "已開封", openedDate: rec.openedDate || firstUsageDate(rec) || todayDMY(), autoOpened: true };
  }
  const init = Number(rec.initialWeight) || 0;
  if (init <= 0) return rec;
  const remaining = computeRemaining(rec);
  if (remaining <= 0) {
    if (rec.status === "已用完") return rec;
    return { ...rec, status: "已用完", finishedDate: lastUsageDate(rec) || todayDMY(), autoFinished: true };
  }
  if (rec.status === "已用完" && (rec.autoFinished || wasEmpty)) {
    return { ...rec, status: "已開封", finishedDate: "", openedDate: rec.openedDate || firstUsageDate(rec) || todayDMY(), autoFinished: false };
  }
  return rec;
}
function applyAutoFinish(rec, wasEmpty) {
  const r = applyFinishStep(rec, wasEmpty);
  // all usage entries removed from a record that was auto-opened: back to 未開封
  if (r.status === "已開封" && r.autoOpened && (r.usageLog || []).length === 0) {
    return { ...r, status: "未開封", openedDate: "", autoOpened: false };
  }
  return r;
}
function lastUsageDate(r) {
  let best = null, bestStr = null;
  (r.usageLog || []).forEach((u) => {
    const d = parseDMY(u.date);
    if (d && (!best || d > best)) { best = d; bestStr = u.date; }
  });
  return bestStr;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ================= AUTH SCREEN ================= */
const LOGO_SRC = "data:image/png;base64,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";
const AUTH_STR = {
  zh: { nick: "暱稱", ph: "例：抹茶拿鐵愛好者", enter: "歡迎使用Matcha Log！", note: "資料只會儲存於本裝置", guest: "訪客" },
  en: { nick: "Nickname", ph: "e.g. Matcha latte lover", enter: "Welcome to Matcha Log!", note: "Data is stored on this device only", guest: "Guest" },
  ja: { nick: "ニックネーム", ph: "例：抹茶ラテ好き", enter: "Matcha Logへようこそ！", note: "データはこの端末にのみ保存されます", guest: "ゲスト" },
};

function AuthScreen({ onEnter, lang, setLang }) {
  const [nickname, setNickname] = useState("");
  const A = AUTH_STR[lang] || AUTH_STR.zh;

  const submit = (e) => {
    e.preventDefault();
    onEnter(nickname.trim() || A.guest);
  };

  return (
    <div className="min-h-screen w-full bg-[#E0E6DA] font-body text-[#2E2A24] flex items-center justify-center px-6" style={{ minHeight: "100dvh" }}>
      {FONT_STYLE}
      <div className="absolute right-4 flex rounded-full border border-[#E4DFCF] bg-white/70 p-1 gap-0.5" style={{ top: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        {[["zh", "中"], ["en", "EN"], ["ja", "あ"]].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setLang(k)} aria-label={k}
            style={lang === k ? { backgroundColor: "#2D3D2E", color: "#F3F0E8" } : { backgroundColor: "transparent", color: "#8F988A" }}
            className="min-w-[40px] h-8 px-2.5 rounded-full text-[14px] font-semibold !border-0 transition">
            {label}
          </button>
        ))}
      </div>
      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center absolute bottom-full left-0 right-0 mb-8">
          <img src={LOGO_SRC} alt="Matcha Log" width={80} height={80} style={{ width: 80, height: 80, objectFit: "contain" }} />
          <h1 className="font-display text-3xl font-700 text-[#1B4A38] mt-3 tracking-wide">抹茶ログ</h1>
          <p className="font-display text-[15px] text-[#6B6558] tracking-widest mt-0.5">Matcha Log</p>
        </div>

        <div className="rounded-3xl border border-[#E4DFCF] bg-white/70 p-7">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1 items-center">
              <label className="text-[16px] text-[#8A8371] text-center">{A.nick}</label>
              <input value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder={A.ph}
                className="w-full text-center rounded-lg border border-[#E4DFCF] px-3 py-2.5 !text-[17px] outline-none focus:border-[#8DC48D] focus:ring-2 focus:ring-[#BDDBBD] transition" />
            </div>
            <button type="submit" style={{ backgroundColor: "#D5F2DB" }}
              className="mt-1 rounded-full text-[#1B4A38] font-medium text-[16px] py-2 transition hover:brightness-95">
              {A.enter}
            </button>
          </form>
        </div>
        <p className="text-center text-[14px] text-[#B0A990] mt-5 absolute top-full left-0 right-0">{A.note}</p>
      </div>
    </div>
  );
}

/* ================= LOG USAGE SCREEN ================= */
const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES_60 = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const WHEEL_ITEM_H = 36;
// iOS-style scroll wheel: a snap-scrolling column with the chosen item centred in the band
function WheelColumn({ items, value, onChange }) {
  const ref = useRef(null);
  const timer = useRef(null);
  const valueRef = useRef(value);
  const changeRef = useRef(onChange);
  valueRef.current = value;
  changeRef.current = onChange;

  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = Math.max(0, items.indexOf(value)) * WHEEL_ITEM_H;
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const settle = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const i = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / WHEEL_ITEM_H)));
      if (items[i] !== valueRef.current) changeRef.current(items[i]);
    }, 90);
  };

  const pick = (it) => {
    if (ref.current) ref.current.scrollTo({ top: items.indexOf(it) * WHEEL_ITEM_H, behavior: "smooth" });
  };

  const mask = "linear-gradient(to bottom, transparent, #000 28%, #000 72%, transparent)";
  return (
    <div className="relative" style={{ height: WHEEL_ITEM_H * 5, width: 72 }}>
      <div className="pointer-events-none absolute left-1 right-1 rounded-lg bg-[#EAF3E8]"
        style={{ top: WHEEL_ITEM_H * 2, height: WHEEL_ITEM_H }} />
      <div ref={ref} onScroll={settle} className="wheel-col relative h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch", WebkitMaskImage: mask, maskImage: mask }}>
        <div style={{ height: WHEEL_ITEM_H * 2 }} />
        {items.map((it) => (
          <div key={it} onClick={() => pick(it)}
            style={{ height: WHEEL_ITEM_H, scrollSnapAlign: "center" }}
            className={`flex items-center justify-center text-[14px] tabular-nums cursor-pointer select-none ${it === value ? "text-[#1B4A38] font-medium" : "text-[#B0A990]"}`}>
            {it}
          </div>
        ))}
        <div style={{ height: WHEEL_ITEM_H * 2 }} />
      </div>
    </div>
  );
}

function LogUsageScreen({ lang, record, onCancel, onSave }) {
  const t = (k) => STR[lang][k] ?? k;
  const occasionsForCategory = getOccasions(record.category);
  const nowHM = currentTimeHHMM().split(":");
  const [date, setDate] = useState(todayDMY());
  const [hour, setHour] = useState(nowHM[0]);
  const [minute, setMinute] = useState(nowHM[1]);
  const [timeOpen, setTimeOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [purposes, setPurposes] = useState([]);
  const [purposeOther, setPurposeOther] = useState("");
  const [teaStyle, setTeaStyle] = useState("");
  const [usage, setUsage] = useState("");
  const [usageOther, setUsageOther] = useState("");
  const [note, setNote] = useState("");
  const [dateErr, setDateErr] = useState(false);

  const showTeaStyle = record.category === "抹茶" && purposes.includes("純飲");
  const isPresetUsage = purposes.some((p) => LATTE_LABELS.includes(p)) || purposes.includes("純飲");

  const togglePurpose = (o) => {
    setPurposes((ps) => (ps.length === 1 && ps[0] === o ? [] : [o]));
  };

  const currentRemaining = computeRemaining(record);
  const previewRemaining = roundG(Math.max(0, currentRemaining - (Number(amount) || 0)));

  const submit = () => {
    const dErr = !DATE_RE.test(date.trim());
    setDateErr(dErr);
    const amt = Number(amount);
    if (dErr || !amt || amt <= 0 || amt > currentRemaining) return;
    const finalPurposes = purposes.map((p) => (p === "其他" ? (purposeOther.trim() || "其他") : p));
    const finalUsage = isPresetUsage ? (usage === "其他" ? usageOther : usage) : usageOther;
    onSave({
      date: date.trim(), time: `${hour}:${minute}`, amount: roundG(amt), purposes: finalPurposes,
      teaStyle: showTeaStyle ? teaStyle : "", usage: finalUsage.trim(), note: note.trim(),
    });
  };

  const canSave = amount && Number(amount) > 0 && Number(amount) <= currentRemaining;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50" onClick={onCancel}>
      <div className="bg-white rounded-t-3xl w-full max-w-2xl h-[90vh] h-[90dvh] overflow-y-auto font-body text-[#2E2A24] safe-pb" onClick={(e) => e.stopPropagation()}>
        {FONT_STYLE}
        <div className="flex justify-center pt-3">
          <div className="w-10 h-1.5 rounded-full bg-[#D9D2C2]" />
        </div>

        <header className="flex items-center justify-between px-4 pt-3 pb-3">
          <button onClick={onCancel} className="text-[14px] px-4 py-1.5 rounded-full border">{t("add_cancel")}</button>
          <h1 className="font-display text-[16px] font-700 text-[#1B4A38]">{t("weight_add_title")}</h1>
          <button onClick={submit} disabled={!canSave} className="text-[14px] px-4 py-1.5 rounded-full border text-[#2B7056] disabled:opacity-40 disabled:cursor-not-allowed font-medium">
            {t("action_save")}
          </button>
        </header>

        <main className="px-4 pb-8">
          <div className="bg-white rounded-2xl border border-[#E4DFCF] overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F1EEE3]">
              <div className="flex items-center gap-2 text-[14px]">
                <RowIcon name="calendar" />
                <span>{t("weight_useDate_label")}</span>
              </div>
              <input value={date} onChange={(e) => setDate(formatDMYInput(e.target.value))} placeholder="例：2026/01/01"
                className="text-[14px] text-right bg-transparent outline-none w-32" />
            </div>
            {dateErr && <p className="text-[14px] text-[#A24B3A] px-4 pt-1">{t("date_err")}</p>}

            <div className="border-b border-[#F1EEE3]">
              <div role="button" tabIndex={0} onClick={() => setTimeOpen((o) => !o)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setTimeOpen((o) => !o); } }}
                className="flex items-center justify-between px-4 py-3.5 cursor-pointer select-none">
                <div className="flex items-center gap-2 text-[14px]">
                  <RowIcon name="clock" />
                  <span>{t("weight_useTime")}</span>
                </div>
                <span className={`text-[14px] tabular-nums ${timeOpen ? "text-[#2B7056] font-medium" : ""}`}>{hour}:{minute}</span>
              </div>
              {timeOpen && (
                <div className="flex items-center justify-center gap-1 pb-3">
                  <WheelColumn items={HOURS_24} value={hour} onChange={setHour} />
                  <span className="text-[14px] text-[#8A8371]">:</span>
                  <WheelColumn items={MINUTES_60} value={minute} onChange={setMinute} />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F1EEE3]">
              <div className="flex items-center gap-2 text-[14px]">
                <RowIcon name="scale" />
                <span>{t("weight_amount_label")}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[14px] text-[#B0A990] mr-1">{t("weight_maxPrefix")} {currentRemaining}g</span>
                <input type="number" min={0} max={currentRemaining} step="0.01" value={amount} onChange={(e) => setAmount(clampAmount(e.target.value, currentRemaining))}
                  className="w-16 text-[14px] text-right bg-transparent outline-none" />
                <span className="text-[14px] text-[#8A8371]">g</span>
              </div>
            </div>

            <div className="flex items-start justify-between px-4 py-3.5 gap-3 border-b border-[#F1EEE3]">
              <div className="flex items-center gap-2 text-[14px] pt-2 shrink-0">
                <RowIcon name="leaf" />
                <span>{t("add_occasion")}</span>
              </div>
              <div className="flex flex-wrap justify-end gap-2 py-1">
                {occasionsForCategory.map((o) => (
                  <button key={o} type="button" onClick={() => togglePurpose(o)}
                    className={`text-[14px] px-4 py-1.5 rounded-full border transition ${purposes.includes(o) ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
                    {OCC_LABEL[o][lang]}
                  </button>
                ))}
              </div>
            </div>
            {purposes.includes("其他") && (
              <div className="px-4 py-3 border-b border-[#F1EEE3]">
                <input value={purposeOther} onChange={(e) => setPurposeOther(e.target.value)} placeholder={t("add_occasion_other_ph")}
                  className="w-full rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
              </div>
            )}
            {showTeaStyle && (
              <div className="flex items-start justify-between px-4 py-3.5 gap-3">
                <div className="flex items-center gap-2 text-[14px] pt-2 shrink-0">
                  <span>{t("add_teaStyle")}</span>
                </div>
                <div className="flex flex-wrap justify-end gap-2 py-1">
                  {TEA_STYLES.map((s) => (
                    <button key={s} type="button" onClick={() => setTeaStyle(teaStyle === s ? "" : s)}
                      className={`text-[14px] px-4 py-1.5 rounded-full border transition ${teaStyle === s ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
                      {TEA_STYLE_LABEL[s][lang]}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#E4DFCF] overflow-hidden mb-4">
            <div className="flex items-start justify-between px-4 py-3.5 gap-3">
              <div className="flex items-center gap-2 text-[14px] pt-1 shrink-0">
                <span>{t("add_usage")}</span>
              </div>
              <div className="flex-1 flex flex-col items-end gap-2">
                {isPresetUsage ? (
                  <>
                    <select value={usage} onChange={(e) => setUsage(e.target.value)} className="text-[14px] text-right bg-transparent outline-none">
                      <option value="" disabled>{t("add_usage_ph")}</option>
                      {USAGE_PRESET.map((u) => <option key={u} value={u}>{USAGE_LABEL[u][lang]}</option>)}
                      <option value="其他">{USAGE_LABEL["其他"][lang]}</option>
                    </select>
                    {usage === "其他" && (
                      <input value={usageOther} onChange={(e) => setUsageOther(e.target.value)} placeholder={t("add_usage_other_ph")}
                        className="w-full rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
                    )}
                  </>
                ) : (
                  <input value={usageOther} onChange={(e) => setUsageOther(e.target.value)} placeholder={t("add_usage_other_ph")}
                    className="w-full rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] text-right" />
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E4DFCF] overflow-hidden mb-4 px-4 py-3.5">
            <div className="flex items-center gap-2 text-[14px] mb-2">
              <RowIcon name="note" />
              <span>{t("weight_note")}</span>
            </div>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t("weight_note_ph")}
              className="w-full text-[14px] outline-none resize-none placeholder:text-[#B0A990]" />
          </div>

          <p className="text-center text-[14px] text-[#6B6558]">
            {t("weight_afterPreview")} <span className="font-display font-700 text-[#2B7056]">{previewRemaining}g</span>
          </p>
        </main>
      </div>
    </div>
  );
}

/* ================= EDITABLE USAGE LOG ENTRY ================= */
function UsageLogItem({ lang, entry, category, maxAmount, onSave, onDelete }) {
  const t = (k) => STR[lang][k] ?? k;
  const occasionsForCategory = getOccasions(category);
  const [editing, setEditing] = useState(false);
  const entryHM = (entry.time || currentTimeHHMM()).split(":");
  const [date, setDate] = useState(entry.date || todayDMY());
  const [hour, setHour] = useState(entryHM[0]);
  const [minute, setMinute] = useState(entryHM[1]);
  const [timeOpen, setTimeOpen] = useState(false);
  const [amount, setAmount] = useState(entry.amount);
  const entryPurposes = entry.purposes || (entry.purpose ? [entry.purpose] : []);
  const [purposes, setPurposes] = useState(entryPurposes);
  const [purposeOther, setPurposeOther] = useState("");
  const [teaStyle, setTeaStyle] = useState(entry.teaStyle || "");
  const knownUsage = entry.usage && USAGE_PRESET.includes(entry.usage);
  const [usage, setUsage] = useState(knownUsage ? entry.usage : (entry.usage ? "其他" : ""));
  const [usageOther, setUsageOther] = useState(knownUsage ? "" : entry.usage || "");
  const [note, setNote] = useState(entry.note || "");
  const [dateErr, setDateErr] = useState(false);

  const showTeaStyle = category === "抹茶" && purposes.includes("純飲");
  const isPresetUsage = purposes.some((p) => LATTE_LABELS.includes(p)) || purposes.includes("純飲");

  const togglePurpose = (o) => {
    setPurposes((ps) => (ps.length === 1 && ps[0] === o ? [] : [o]));
  };

  if (!editing) {
    return (
      <div className="flex flex-col text-[14px] text-[#6B6558] border-b border-[#F1EEE3] pb-1.5 gap-0.5">
        <div className="flex justify-between items-center">
          <span>{entry.time ? `${entry.date} ${entry.time}` : entry.date}</span>
          <div className="flex items-center gap-2">
            <span className="font-medium">{entry.amount}g</span>
            <button onClick={() => setEditing(true)} aria-label={t("action_edit")} className="btn-plain text-[#8A8371] hover:text-[#2B7056]"><EditIcon size={12} /></button>
            <button onClick={() => onDelete(entry.id)} className="btn-plain text-[#B08A6A] hover:text-[#8a4a3a]"><TrashIcon size={12} /></button>
          </div>
        </div>
        {entryPurposes.length > 0 && (
          <span className="text-[#8A8371]">{entryPurposes.map((o) => (OCC_LABEL[o] ? OCC_LABEL[o][lang] : o)).join("、")}</span>
        )}
        {entry.teaStyle && <span className="text-[#8A8371]">{TEA_STYLE_LABEL[entry.teaStyle] ? TEA_STYLE_LABEL[entry.teaStyle][lang] : entry.teaStyle}</span>}
        {entry.usage && <span className="text-[#8A8371]">{USAGE_LABEL[entry.usage] ? USAGE_LABEL[entry.usage][lang] : entry.usage}</span>}
        {entry.note && <span className="text-[#8A8371]">{entry.note}</span>}
      </div>
    );
  }

  const submit = () => {
    const dErr = !DATE_RE.test(date.trim());
    setDateErr(dErr);
    const amt = Number(amount);
    if (dErr || !amt || amt <= 0 || (maxAmount !== undefined && amt > maxAmount)) return;
    const finalPurposes = purposes.map((p) => (p === "其他" ? (purposeOther.trim() || "其他") : p));
    const finalUsage = isPresetUsage ? (usage === "其他" ? usageOther : usage) : usageOther;
    onSave(entry.id, {
      date: date.trim(), time: `${hour}:${minute}`, amount: roundG(amt), purposes: finalPurposes,
      teaStyle: showTeaStyle ? teaStyle : "", usage: finalUsage.trim(), note: note.trim(),
    });    setEditing(false);
  };

  return (
    <div className="flex flex-col gap-2 border-b border-[#F1EEE3] pb-3">
      <div className="flex flex-col gap-1">
        <input value={date} onChange={(e) => setDate(formatDMYInput(e.target.value))} placeholder="例：2026/01/01"
          className={`rounded-lg border px-2 py-1.5 text-[14px] outline-none ${dateErr ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
        {dateErr && <p className="text-[14px] text-[#A24B3A]">{t("date_err")}</p>}
      </div>
      <div className="flex gap-2 items-center">
        <button type="button" onClick={() => setTimeOpen((o) => !o)} className={`btn-plain rounded-lg border border-[#E4DFCF] px-2 py-1.5 text-[14px] tabular-nums bg-white ${timeOpen ? "text-[#2B7056] font-medium" : ""}`}>{hour}:{minute}</button>
        <div className="relative flex-1">
          <input type="number" min={0} max={maxAmount} step="0.01" value={amount} onChange={(e) => setAmount(clampAmount(e.target.value, maxAmount))}
            className="w-full rounded-lg border border-[#E4DFCF] pl-2 pr-6 py-1.5 text-[14px] outline-none" />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[14px] text-[#B0A990]">g</span>
        </div>
      </div>
      {maxAmount !== undefined && <p className="text-[14px] text-[#B0A990]">{t("weight_maxPrefix")} {maxAmount}g</p>}
      {timeOpen && (
        <div className="flex items-center justify-center gap-1">
          <WheelColumn items={HOURS_24} value={hour} onChange={setHour} />
          <span className="text-[14px] text-[#8A8371]">:</span>
          <WheelColumn items={MINUTES_60} value={minute} onChange={setMinute} />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {occasionsForCategory.map((o) => (
          <button key={o} type="button" onClick={() => togglePurpose(o)}
            className={`text-[14px] px-3 py-1 rounded-full border transition ${purposes.includes(o) ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558]"}`}>
            {OCC_LABEL[o][lang]}
          </button>
        ))}
      </div>
      {purposes.includes("其他") && (
        <input value={purposeOther} onChange={(e) => setPurposeOther(e.target.value)} placeholder={t("add_occasion_other_ph")}
          className="rounded-lg border border-[#E4DFCF] px-2 py-1.5 text-[14px] outline-none" />
      )}

      {showTeaStyle && (
        <select value={teaStyle} onChange={(e) => setTeaStyle(e.target.value)} className="rounded-lg border border-[#E4DFCF] px-2 py-1.5 text-[14px] outline-none bg-white">
          <option value="" disabled>{t("add_category_ph")}</option>
          {TEA_STYLES.map((s) => <option key={s} value={s}>{TEA_STYLE_LABEL[s][lang]}</option>)}
        </select>
      )}

      {isPresetUsage ? (
        <>
          <select value={usage} onChange={(e) => setUsage(e.target.value)} className="rounded-lg border border-[#E4DFCF] px-2 py-1.5 text-[14px] outline-none bg-white">
            <option value="" disabled>{t("add_usage_ph")}</option>
            {USAGE_PRESET.map((u) => <option key={u} value={u}>{USAGE_LABEL[u][lang]}</option>)}
            <option value="其他">{USAGE_LABEL["其他"][lang]}</option>
          </select>
          {usage === "其他" && (
            <input value={usageOther} onChange={(e) => setUsageOther(e.target.value)} placeholder={t("add_usage_other_ph")}
              className="rounded-lg border border-[#E4DFCF] px-2 py-1.5 text-[14px] outline-none" />
          )}
        </>
      ) : (
        <input value={usageOther} onChange={(e) => setUsageOther(e.target.value)} placeholder={t("add_usage_other_ph")}
          className="rounded-lg border border-[#E4DFCF] px-2 py-1.5 text-[14px] outline-none" />
      )}

      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t("weight_note")}
        className="rounded-lg border border-[#E4DFCF] px-2 py-1.5 text-[14px] outline-none resize-none" />
      <div className="flex justify-end gap-2">
        <button onClick={() => setEditing(false)} className="text-[14px] px-3 py-1 rounded-full">{t("add_cancel")}</button>
        <button onClick={submit} className="text-[14px] px-3 py-1 rounded-full bg-[#EAF3E8]">{t("action_save")}</button>
      </div>
    </div>
  );
}

/* ================= ADD / EDIT RECORD SCREEN ================= */
function AddRecordScreen({ lang, onCancel, onSave, onDelete, initialRecord, onLogUsage, onUpdateUsage, onDeleteUsage }) {
  const t = (k) => STR[lang][k] ?? k;
  const [form, setForm] = useState(initialRecord ? recordToForm(initialRecord) : initialForm);
  const [dateErr, setDateErr] = useState({ purchase: false, unsealed: false, opened: false, finished: false });
  const [liveRecord, setLiveRecord] = useState(initialRecord || null);
  const [showUsageLog, setShowUsageLog] = useState(false);
  const [editingUsageId, setEditingUsageId] = useState(null);
  const [subScreen, setSubScreen] = useState("main"); // "main" | "logUsage"
  const [screenMode, setScreenMode] = useState(initialRecord ? "view" : "edit"); // "view" | "edit"
  const [confirmDelete, setConfirmDelete] = useState(false);
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  // no more usage can be added once the record is 已用完 or has 0g left
  const canAddUsage = !!liveRecord && liveRecord.status !== "已用完" && !(Number(liveRecord.initialWeight) > 0 && computeRemaining(liveRecord) <= 0);

  // usage logging can flip the status (用完 / 回復使用中); mirror that into the edit form
  const applyLive = (updated) => {
    const statusChanged = liveRecord && updated.status !== liveRecord.status;
    setLiveRecord(updated);
    if (statusChanged) {
      setForm((f) => ({ ...f, status: updated.status, finishedDate: updated.finishedDate || "", openedDate: updated.openedDate || f.openedDate }));
    }
  };

  const saveUsageEntry = (entry) => {
    if (!liveRecord || !canAddUsage) return;
    const updated = onLogUsage(liveRecord.id, entry);
    if (updated) applyLive(updated);
    setSubScreen("main");
  };

  const saveUsageEdit = (entryId, patch) => {
    if (!liveRecord) return;
    const updated = onUpdateUsage(liveRecord.id, entryId, patch);
    if (updated) applyLive(updated);
    setEditingUsageId(null);
  };

  const removeUsageEntry = (entryId) => {
    if (!liveRecord) return;
    const updated = onDeleteUsage(liveRecord.id, entryId);
    if (updated) applyLive(updated);
    setEditingUsageId(null);
  };

  const usageSheet = subScreen === "logUsage" && liveRecord && (
    <LogUsageScreen
      lang={lang}
      record={liveRecord}
      onCancel={() => setSubScreen("main")}
      onSave={saveUsageEntry}
    />
  );

  const isPresetUsage = form.occasions.some((o) => LATTE_LABELS.includes(o)) || form.occasions.includes("純飲");
  const currentBrandList = BRANDS_BY_CATEGORY[form.category] || null;
  const occasionsForCategory = getOccasions(form.category);
  const brandValid = currentBrandList
    ? (form.brand !== "" && (form.brand !== "其他" || form.brandOther.trim() !== ""))
    : form.brandOther.trim() !== "";
  const occasionValid = form.occasions.length > 0 && (!form.occasions.includes("其他") || form.occasionOther.trim() !== "");

  const handleCategory = (val) => {
    setForm((f) => ({
      ...f,
      category: val,
      brand: "", brandOther: "", origin: "",
      occasions: [...new Set(f.occasions.map((o) => (LATTE_LABELS.includes(o) ? getLatteLabel(val) : o)))],
    }));
  };

  const toggleOccasion = (o) => {
    setForm((f) => ({
      ...f,
      occasions: f.occasions.includes(o) ? f.occasions.filter((x) => x !== o) : [...f.occasions, o],
    }));
  };

  const handleBrand = (val) => {
    update("brand", val);
    if (val !== "其他" && ORIGIN_MAP[val]) update("origin", ORIGIN_MAP[val][lang] || ORIGIN_MAP[val].en);
  };

  const handlePhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 400;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
      update("photo", canvas.toDataURL("image/jpeg", 0.92));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      // fallback for formats the browser can't decode into <img> (e.g. some HEIC cases)
      const reader = new FileReader();
      reader.onload = () => update("photo", reader.result);
      reader.readAsDataURL(file);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const weightSection = liveRecord && Number(liveRecord.initialWeight) > 0 && (
    <div className="mt-2 pt-6 border-t border-[#E4DFCF]">
      <h2 className="font-display text-[16px] text-[#1B4A38] mb-4">{t("weight_remaining")}</h2>
      {(() => {
        const initW = Number(liveRecord.initialWeight) || 0;
        const remaining = computeRemaining(liveRecord);
        const usedPct = initW > 0 ? Math.min(100, ((initW - remaining) / initW) * 100) : 0;
        return (
          <div className="flex items-center gap-6 mb-5">
            <div className="w-28 h-28 rounded-full shrink-0 relative"
              style={{ background: `conic-gradient(#8DC48D 0% ${100 - usedPct}%, #E4DFCF ${100 - usedPct}% 100%)` }}>
              <div className="absolute inset-3 rounded-full bg-white flex flex-col items-center justify-center">
                <span className="font-display text-[15px] text-[#2B7056]">{remaining}g</span>
                <span className="text-[14px] text-[#B0A990]">/ {initW}g</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 flex-1 min-w-0 max-w-[140px]">
              <button onClick={() => setShowUsageLog((v) => !v)} className="btn-brown text-[14px] px-4 py-2 rounded-full border w-full whitespace-nowrap">
                {t("weight_log")}
              </button>
              <button onClick={() => canAddUsage && setSubScreen("logUsage")} disabled={!canAddUsage} className="text-[14px] px-4 py-2 rounded-full border w-full whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed">
                {t("weight_add")}
              </button>
              {remaining <= 0 && (
                <span className="text-[14px] text-[#BA0F0F] text-center">{t("weight_usedUp")}</span>
              )}
            </div>
          </div>
        );
      })()}

      {showUsageLog && (
        (liveRecord.usageLog || []).length === 0 ? (
          <p className="text-[14px] text-[#8A8371]">{t("weight_empty")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {[...liveRecord.usageLog].reverse().map((u) => (
              <UsageLogItem
                key={u.id}
                lang={lang}
                entry={u}
                category={liveRecord.category}
                maxAmount={Number(liveRecord.initialWeight) > 0 ? roundG(computeRemaining(liveRecord) + (Number(u.amount) || 0)) : undefined}
                onSave={saveUsageEdit}
                onDelete={removeUsageEntry}
              />
            ))}
          </div>
        )
      )}
    </div>
  );

  if (initialRecord && screenMode === "view") {
    const statusText = liveRecord.status === "已開封" ? t("status_inUse") : liveRecord.status === "已用完" ? t("status_used") : t("status_unopened");
    return (
      <>
      <div className="min-h-screen w-full bg-[#E0E6DA] font-body text-[#2E2A24]">
        {FONT_STYLE}
        <header className="max-w-2xl mx-auto px-6 pt-[25px] pb-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start gap-3">
              <button onClick={onCancel} className="btn-plain text-[14px] text-[#6B6558] hover:text-[#2B7056] flex items-center gap-1">
                {t("add_back")}
              </button>
              <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700">{t("records_title")}</h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => setScreenMode("edit")} className="text-[14px] px-4 py-1 rounded-full border flex items-center gap-1.5">
                <EditIcon size={12} /> {t("action_edit")}
              </button>
              <button onClick={() => setConfirmDelete(true)} className="btn-danger text-[14px] px-4 py-1 rounded-full border flex items-center gap-1.5">
                <TrashIcon size={12} /> {t("delete")}
              </button>
            </div>
          </div>
          <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
        </header>

        <main className="max-w-2xl mx-auto px-6 pb-24">
          <section className="relative rounded-3xl border border-[#E4DFCF] bg-white/70 p-6">
            {liveRecord.favorite && <span className="absolute top-4 right-4"><FavStar on size={22} /></span>}
            <div className="flex flex-col items-center text-center mb-5">
              {liveRecord.photo ? (
                <img src={liveRecord.photo} alt="" style={{ width: 88, height: 88 }} className="rounded-full object-cover border border-[#E4DFCF]" />
              ) : (
                <MatchaBowl rating={liveRecord.rating || 3} seedKey={liveRecord.id} size={88} />
              )}
            </div>

            <div className="flex flex-col divide-y divide-[#E4DFCF]">
              <ViewField label={t("add_category")} value={CATEGORY_LABEL[liveRecord.category] ? CATEGORY_LABEL[liveRecord.category][lang] : liveRecord.category} />
              <ViewField label={t("add_brand")} value={liveRecord.brand} />
              <ViewField label={t("add_origin")} value={liveRecord.origin || "—"} />
              <ViewField label={t("add_cultivar")} value={liveRecord.cultivar || "—"} />
              {Number(liveRecord.initialWeight) > 0 && <ViewField label={t("add_weight")} value={`${liveRecord.initialWeight} g`} />}
              <ViewField label={t("add_purchaseDate")} value={liveRecord.purchaseDate || "—"} />
              <ViewField label={t("add_store")} value={liveRecord.store || "—"} />
              {liveRecord.currency === PRICE_NA ? (
                <>
                  <ViewField label={t("add_price")} value={t("price_na")} />
                  <ViewField label={t("add_priceSource")} value={liveRecord.priceSource ? (PRICE_SOURCE_LABEL[liveRecord.priceSource] ? PRICE_SOURCE_LABEL[liveRecord.priceSource][lang] : liveRecord.priceSource) : "—"} />
                </>
              ) : (
                liveRecord.price && <ViewField label={t("add_price")} value={<>{`${currencyLabel(liveRecord.currency, lang, liveRecord.currencyOther) || ""} ${liveRecord.price}`}{hkdApprox(liveRecord.price, liveRecord.currency, lang) && <span className="font-normal text-[#B0A990] ml-1.5">{hkdApprox(liveRecord.price, liveRecord.currency, lang)}</span>}</>} />
              )}
              <ViewField label={t("add_status")} value={statusText} />
              {liveRecord.status === "未開封" && <ViewField label={t("add_unsealedExpiry")} value={liveRecord.unsealedExpiry || "—"} />}
              {liveRecord.status === "已開封" && <ViewField label={t("add_openedDate")} value={liveRecord.openedDate || "—"} />}
              {liveRecord.status === "已開封" && <ViewField label={t("add_suggestedExpiry")} value={suggestedExpiryText(liveRecord.openedDate, lang)} />}
              {liveRecord.status === "已用完" && <ViewField label={t("add_finishedDate")} value={liveRecord.finishedDate || lastUsageDate(liveRecord) || "—"} />}
              <div className="flex items-center justify-between gap-4 text-[14px] py-3">
                <span className="shrink-0 text-[#8A8371]">{t("add_rating")}</span>
                <Stars value={liveRecord.rating} size={14} />
              </div>
              <div className="flex items-center justify-between gap-4 text-[14px] py-3">
                <span className="shrink-0 text-[#8A8371]">{t("add_occasion")}</span>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {(liveRecord.occasions || []).map((o) => <Tag key={o}>{OCC_LABEL[o] ? OCC_LABEL[o][lang] : o}</Tag>)}
                </div>
              </div>
              {liveRecord.teaStyle && <ViewField label={t("add_teaStyle")} value={TEA_STYLE_LABEL[liveRecord.teaStyle] ? TEA_STYLE_LABEL[liveRecord.teaStyle][lang] : liveRecord.teaStyle} />}
              {liveRecord.usage && <ViewField label={t("add_usage")} value={USAGE_LABEL[liveRecord.usage] ? USAGE_LABEL[liveRecord.usage][lang] : liveRecord.usage} />}
              {liveRecord.notes && (
                <div className="md:col-span-2">
                  <ViewField label={t("add_notes")} value={liveRecord.notes} />
                </div>
              )}
            </div>

            {weightSection}
          </section>
        </main>
      </div>
      {usageSheet}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white rounded-3xl border border-[#E4DFCF] p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] text-[#2E2A24] mb-5 text-center">{t("delete_confirm_msg")}</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => { onDelete(liveRecord.id); onCancel(); }} className="btn-danger text-[14px] px-5 py-1.5 rounded-full border">
                {t("delete_yes")}
              </button>
              <button onClick={() => setConfirmDelete(false)} className="text-[14px] px-5 py-1.5 rounded-full border border-[#E4DFCF] text-[#6B6558]">
                {t("delete_cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  }

  const submit = () => {
    const pErr = form.purchaseDate.trim() !== "" && !DATE_RE.test(form.purchaseDate.trim());
    const uErr = form.status === "未開封" && !DATE_RE.test(form.unsealedExpiry.trim());
    const oErr = form.status === "已開封" && !DATE_RE.test(form.openedDate.trim());
    const fErr = form.status === "已用完" && !DATE_RE.test(form.finishedDate.trim());
    setDateErr({ purchase: pErr, unsealed: uErr, opened: oErr, finished: fErr });
    if (pErr || uErr || oErr || fErr) return;
    if (!brandValid || !occasionValid || form.rating === 0) return;

    const finalCategory = form.category === "其他" ? (form.categoryOther.trim() || "其他") : form.category;
    const finalBrand = currentBrandList ? (form.brand === "其他" ? form.brandOther.trim() : form.brand) : form.brandOther.trim();
    const finalOccasions = form.occasions.map((o) => (o === "其他" ? (form.occasionOther.trim() || "其他") : o));
    const finalUsage = isPresetUsage ? (form.usage === "其他" ? form.usageOther : form.usage) : form.usageOther;

    const payload = {
      ...form,
      id: initialRecord ? initialRecord.id : Date.now(),
      usageLog: (liveRecord && liveRecord.usageLog) || (initialRecord && initialRecord.usageLog) || [],
      autoFinished: !!(liveRecord && liveRecord.autoFinished && form.status === "已用完"),
      autoOpened: !!(liveRecord && liveRecord.autoOpened && form.status === "已開封"),
      openedDate: form.status === "未開封" ? "" : form.openedDate,
      finishedDate: form.status === "已用完" ? form.finishedDate : "",
      category: finalCategory,
      brand: finalBrand,
      origin: form.origin.trim(),
      currencyOther: form.currency === CURRENCY_OTHER ? (form.currencyOther || "").trim() : "",
      cultivar: form.cultivar.trim(),
      store: form.store.trim(),
      price: form.currency === PRICE_NA || form.price === "" ? "" : String(roundG(Number(form.price))),
      priceSource: form.currency === PRICE_NA ? form.priceSource : "",
      favorite: !!form.favorite,
      occasions: finalOccasions,
      usage: finalUsage.trim(),
      teaStyle: form.category === "抹茶" && form.occasions.includes("純飲") ? form.teaStyle : "",
      notes: form.notes.trim(),
    };
    if (initialRecord) {
      // editing an existing record: save, then return to its read-only view with the new data
      onSave(payload, true);
      setLiveRecord(payload);
      setForm(recordToForm(payload));
      setScreenMode("view");
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } else {
      onSave(payload);
    }
  };

  const cancelEdit = () => {
    if (initialRecord) {
      // discard unsaved changes and go back to the record's read-only view
      setForm(recordToForm(liveRecord || initialRecord));
      setDateErr({ purchase: false, unsealed: false, opened: false, finished: false });
      setScreenMode("view");
      if (typeof window !== "undefined") window.scrollTo(0, 0);
    } else {
      onCancel();
    }
  };

  const isSheet = !initialRecord;
  const formValid = brandValid && occasionValid && form.rating !== 0 &&
    !(form.status === "未開封" && !form.unsealedExpiry.trim()) &&
    !(form.status === "已開封" && !form.openedDate.trim()) &&
    !(form.status === "已用完" && !form.finishedDate.trim());

  return (
    <>
    <div className={isSheet ? "fixed inset-0 bg-black/30 flex items-end justify-center z-50" : "min-h-screen w-full bg-[#E0E6DA] font-body text-[#2E2A24]"}
      onClick={isSheet ? onCancel : undefined}>
      {FONT_STYLE}
      <div className={isSheet ? "bg-white rounded-t-3xl w-full max-w-2xl h-[90vh] h-[90dvh] overflow-y-auto font-body text-[#2E2A24] safe-pb" : "contents"}
        onClick={isSheet ? (e) => e.stopPropagation() : undefined}>
      {isSheet ? (
        <>
          <div className="flex justify-center pt-3"><div className="w-10 h-1.5 rounded-full bg-[#D9D2C2]" /></div>
          <header className="flex items-center justify-between px-4 pt-3 pb-3">
            <button onClick={onCancel} className="text-[14px] px-4 py-1.5 rounded-full border">{t("add_cancel")}</button>
            <h1 className="font-display text-[16px] font-700 text-[#1B4A38]">{t("add_title")}</h1>
            <button onClick={submit} disabled={!formValid} className="text-[14px] px-4 py-1.5 rounded-full border text-[#2B7056] disabled:opacity-40 disabled:cursor-not-allowed font-medium">
              {t("action_save")}
            </button>
          </header>
        </>
      ) : (
      <header className="max-w-2xl mx-auto px-6 pt-[25px] pb-6">
        <button onClick={onCancel} className="btn-plain text-[14px] text-[#6B6558] hover:text-[#2B7056] flex items-center gap-1 mb-4">
          {t("add_back")}
        </button>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
      </header>
      )}

      <main className={isSheet ? "px-4 pb-8" : "max-w-2xl mx-auto px-6 pb-24"}>
        <section className={isSheet ? "relative p-2" : "relative rounded-3xl border border-[#E4DFCF] bg-white/70 p-6"}>
          <button type="button" onClick={() => update("favorite", !form.favorite)} aria-label={t("fav_toggle")} aria-pressed={!!form.favorite}
            className="btn-plain absolute top-4 right-4 p-1"><FavStar on={!!form.favorite} size={24} /></button>
          {/* photo — always centered, for both add and edit */}
          <div className="flex flex-col items-center text-center mb-5 gap-4">
            {form.photo ? (
              <img src={form.photo} alt="" style={{ width: 88, height: 88 }} className="rounded-full object-cover border border-[#E4DFCF]" />
            ) : (
              <MatchaBowl rating={form.rating || 3} seedKey="preview" size={88} />
            )}
            <div className="flex flex-col gap-1 items-center">
              <label className="text-[14px] text-[#8A8371]">{t("add_photo")}</label>
              <p className="text-[14px] text-[#B0A990]">{t("add_photo_hint")}</p>
              <div className="flex gap-3 items-center mt-1">
                <label className="text-[14px] px-3 py-1 rounded-full bg-[#EAF3E8] text-[#2B7056] border-[1.5px] border-[#BDDBBD] cursor-pointer hover:bg-[#D5F2DB] transition">
                  <input type="file" accept="image/jpeg,image/png,image/heic,image/heif" onChange={handlePhoto} className="hidden" />
                  {form.photo ? t("photo_change") : t("photo_new")}
                </label>
                {form.photo && (
                  <button onClick={() => update("photo", null)} className="text-[14px] px-3 py-1 rounded-full">
                    {t("add_photo_remove")}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_category")}</label>
              <select value={form.category} onChange={(e) => handleCategory(e.target.value)}
                className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] bg-white">
                <option value="" disabled>{t("add_category_ph")}</option>
                {TEA_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c][lang]}</option>)}
              </select>
              {form.category === "其他" && (
                <input value={form.categoryOther} onChange={(e) => update("categoryOther", e.target.value)}
                  placeholder={t("add_category_other_ph")}
                  className="mt-1 rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_brand")}</label>
              {currentBrandList ? (
                <>
                  <select value={form.brand} onChange={(e) => handleBrand(e.target.value)}
                    className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] bg-white">
                    <option value="" disabled>{t("add_brand_ph")}</option>
                    {currentBrandList.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                  {form.brand === "其他" && (
                    <input value={form.brandOther} onChange={(e) => update("brandOther", e.target.value)}
                      placeholder={t("add_brand_other_ph")}
                      className="mt-1 rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
                  )}
                </>
              ) : (
                <input value={form.brandOther} onChange={(e) => update("brandOther", e.target.value)}
                  placeholder={t("add_brand_other_ph")}
                  className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_origin")}</label>
              <input value={form.origin} onChange={(e) => update("origin", e.target.value)}
                placeholder={form.brand === "其他" ? t("add_origin_ph") : "例：京都 宇治"}
                className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_cultivar")}</label>
              <input value={form.cultivar} onChange={(e) => update("cultivar", e.target.value)}
                className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_weight")}</label>
              <div className="relative">
                <input type="number" min={0} step="0.01" value={form.initialWeight} onChange={(e) => update("initialWeight", e.target.value)}
                  className="w-full rounded-lg border border-[#E4DFCF] pl-3 pr-8 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[14px] text-[#B0A990]">g</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_purchaseDate")}</label>
              <input value={form.purchaseDate} onChange={(e) => update("purchaseDate", formatDMYInput(e.target.value))} placeholder="例：2026/01/01"
                className={`rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] ${dateErr.purchase ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
              {dateErr.purchase && <p className="text-[14px] text-[#A24B3A]">{t("date_err")}</p>}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_store")}</label>
              <input value={form.store} onChange={(e) => update("store", e.target.value)}
                className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_price")}</label>
              <div className="flex gap-2">
                <select value={form.currency}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, currency: v, price: v === PRICE_NA ? "" : f.price }));
                  }}
                  className="rounded-lg border border-[#E4DFCF] px-2 py-2 text-[14px] outline-none focus:border-[#8DC48D] bg-white w-28">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c === PRICE_NA ? t("price_na") : currencyLabel(c, lang)}</option>)}
                </select>
                <input type="number" min={0} step="0.01" value={form.price}
                  disabled={form.currency === PRICE_NA}
                  onChange={(e) => update("price", e.target.value)}
                  className="flex-1 min-w-0 rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] disabled:bg-[#F1EEE3] disabled:opacity-60 disabled:cursor-not-allowed" />
              </div>
              {form.currency === CURRENCY_OTHER && (
                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[14px] text-[#8A8371]">{{ zh: "貨幣名稱 / 符號", en: "Currency name / symbol", ja: "通貨名・記号" }[lang]}</label>
                  <input value={form.currencyOther || ""} onChange={(e) => update("currencyOther", e.target.value)}
                    placeholder={{ zh: "例：EUR€、AUD$", en: "e.g. EUR€, AUD$", ja: "例：EUR€、AUD$" }[lang]}
                    className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
                </div>
              )}
              {form.currency === PRICE_NA && (
                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-[14px] text-[#8A8371]">{t("add_priceSource")}</label>
                  <div className="flex flex-wrap gap-2">
                    {PRICE_SOURCES.map((s) => (
                      <button key={s} type="button" onClick={() => update("priceSource", form.priceSource === s ? "" : s)}
                        className={`text-[14px] px-3 py-1 rounded-full border transition ${form.priceSource === s ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
                        {PRICE_SOURCE_LABEL[s][lang]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_status")}</label>
              <div className="flex gap-2">
                {["未開封", "已開封", "已用完"].map((s) => (
                  <button key={s} type="button" onClick={() => update("status", s)}
                    className={`text-[14px] px-4 py-1.5 rounded-full border transition ${form.status === s ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
                    {s === "未開封" ? t("status_unopened") : s === "已開封" ? t("status_inUse") : t("status_used")}
                  </button>
                ))}
              </div>
            </div>

            {form.status === "未開封" && (
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("add_unsealedExpiry")}</label>
                <input value={form.unsealedExpiry} onChange={(e) => update("unsealedExpiry", formatDMYInput(e.target.value))} placeholder="例：2026/01/01"
                  className={`rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] ${dateErr.unsealed ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
                {dateErr.unsealed && <p className="text-[14px] text-[#A24B3A]">{t("date_err")}</p>}
              </div>
            )}

            {form.status === "已開封" && (
              <>
                <div className="flex flex-col gap-1">
                  <label className="text-[14px] text-[#8A8371]">{t("add_openedDate")}</label>
                  <input value={form.openedDate} onChange={(e) => update("openedDate", formatDMYInput(e.target.value))} placeholder="例：2026/01/01"
                    className={`rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] ${dateErr.opened ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
                  {dateErr.opened && <p className="text-[14px] text-[#A24B3A]">{t("date_err")}</p>}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[14px] text-[#8A8371]">{t("add_suggestedExpiry")}</label>
                  <div className="rounded-lg border border-[#E4DFCF] bg-[#F1EEE3] px-3 py-2 text-[14px] text-[#6B6558]">
                    {suggestedExpiryText(form.openedDate, lang)}
                  </div>
                </div>
              </>
            )}

            {form.status === "已用完" && (
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("add_finishedDate")}</label>
                <input value={form.finishedDate} onChange={(e) => update("finishedDate", formatDMYInput(e.target.value))} placeholder="例：2026/01/01"
                  className={`rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] ${dateErr.finished ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
                {dateErr.finished && <p className="text-[14px] text-[#A24B3A]">{t("date_err")}</p>}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_rating")}</label>
              <div className="py-1.5"><Stars value={form.rating} size={22} onSelect={(n) => update("rating", n)} /></div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_occasion")}</label>
              <div className="flex flex-wrap gap-2">
                {occasionsForCategory.map((o) => (
                  <button key={o} type="button" onClick={() => toggleOccasion(o)}
                    className={`text-[14px] px-4 py-1.5 rounded-full border transition ${form.occasions.includes(o) ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
                    {OCC_LABEL[o][lang]}
                  </button>
                ))}
              </div>
              {form.occasions.includes("其他") && (
                <input value={form.occasionOther} onChange={(e) => update("occasionOther", e.target.value)}
                  placeholder={t("add_occasion_other_ph")}
                  className="mt-1 rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_usage")}</label>
              {isPresetUsage ? (
                <>
                  <select value={form.usage} onChange={(e) => update("usage", e.target.value)}
                    className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] bg-white">
                    <option value="" disabled>{t("add_usage_ph")}</option>
                    {USAGE_PRESET.map((u) => <option key={u} value={u}>{USAGE_LABEL[u][lang]}</option>)}
                    <option value="其他">{USAGE_LABEL["其他"][lang]}</option>
                  </select>
                  {form.usage === "其他" && (
                    <input value={form.usageOther} onChange={(e) => update("usageOther", e.target.value)}
                      placeholder={t("add_usage_other_ph")}
                      className="mt-1 rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
                  )}
                </>
              ) : (
                <input value={form.usageOther} onChange={(e) => update("usageOther", e.target.value)}
                  placeholder={t("add_usage_other_ph")}
                  className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
              )}
            </div>

            {form.category === "抹茶" && form.occasions.includes("純飲") && (
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("add_teaStyle")}</label>
                <select value={form.teaStyle} onChange={(e) => update("teaStyle", e.target.value)}
                  className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] bg-white">
                  <option value="" disabled>{t("add_category_ph")}</option>
                  {TEA_STYLES.map((s) => <option key={s} value={s}>{TEA_STYLE_LABEL[s][lang]}</option>)}
                </select>
              </div>
            )}

            <div className="md:col-span-2 flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_notes")}</label>
              <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3}
                className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] resize-none" />
            </div>
          </div>

          {weightSection}

          {!isSheet && <div className="flex justify-end gap-2 mt-6">
            <button onClick={cancelEdit} className="text-[14px] px-4 py-1.5 rounded-full text-[#6B6558] hover:bg-[#F1EEE3] transition">{t("add_cancel")}</button>
            <button onClick={submit} disabled={!formValid}
              className="text-[14px] px-5 py-1.5 rounded-full bg-[#2B7056] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1B4A38] transition">
              {t("add_save")}
            </button>
          </div>}
        </section>
      </main>
      </div>
    </div>
    {usageSheet}
    </>
  );
}

function FavStar({ on, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={on ? "#C9A227" : "none"} stroke={on ? "#C9A227" : "#8A8371"} strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 3 1.1-6.1L3.2 9.6l6.1-.8L12 3.2z" />
    </svg>
  );
}

/* ================= TAG helpers ================= */
function Tag({ children, tone = "green", style, className = "" }) {
  const tones = {
    green: "bg-[#EAF3E8] text-[#2B7056] border-[#BDDBBD]",
    gold: "bg-[#F5EFE0] text-[#9C7A2E] border-[#E4D6AE]",
    neutral: "bg-[#F1EEE3] text-[#6B6558] border-[#E4DFCF]",
  };
  return <span style={style} className={`text-[14px] px-2 py-0.5 rounded-full border ${style ? "" : tones[tone]} ${className}`}>{children}</span>;
}
// 茶品類別 label colours: 抹茶 = emerald green, 焙茶 = medium brown, 玄米茶 = muddy yellow
const CATEGORY_TAG_STYLE = {
  "抹茶": { color: "#1F8A5B", backgroundColor: "#E4F4EB", borderColor: "#A8D8BF" },
  "焙茶": { color: "#8B5A2B", backgroundColor: "#F3E9DE", borderColor: "#D9BFA2" },
  "玄米茶": { color: "#A8913A", backgroundColor: "#F6F1DC", borderColor: "#E2D6A0" },
};
function ViewField({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-[14px] py-3">
      <span className="shrink-0 text-[#8A8371]">{label}</span>
      <span className="text-[#2E2A24] font-semibold text-right break-words min-w-0">{value}</span>
    </div>
  );
}

/* ================= HOME TAB ================= */
function HomeTab({ lang, records, userEmail, nickname, isGuest, onAdd, onGoRecords }) {
  const t = (k) => STR[lang][k] ?? k;
  const recent = records.slice(0, 3);
  // most recently starred first (legacy favourites without a timestamp keep list order after them)
  const favorites = records.map((r, i) => ({ r, i })).filter(({ r }) => r.favorite)
    .sort((a, b) => (b.r.favoriteAt || 0) - (a.r.favoriteAt || 0) || a.i - b.i).map(({ r }) => r);
  return (
    <div>
      <header className="pt-[25px] pb-6">
        <p className="text-[16px] text-[#8A8371]">{t("home_welcome")}</p>
        <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700 mt-1">
          {nickname || (isGuest ? t("home_guest") : userEmail)}
        </h1>
        <p className="mt-2 text-[14px] text-[#6B6558]">{t("tagline")}</p>
        <button onClick={onAdd} className="mt-4 rounded-full bg-[#2B7056] hover:bg-[#1B4A38] text-white text-[14px] px-5 py-2 transition">
          {t("home_addBtn")}
        </button>
        <div className="mt-6 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
      </header>

      <div className="mb-8">
        <h2 className="font-display text-[17px] text-[#1B4A38] mb-3">{t("home_fav")}</h2>
        {favorites.length === 0 ? (
          <p className="text-[14px] text-[#8A8371] py-4 text-center">{t("home_fav_empty")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {favorites.slice(0, 2).map((r) => <RecordListCard key={r.id} r={r} lang={lang} t={t} compact favInline />)}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-[17px] text-[#1B4A38]">{t("home_recent")}</h2>
        {records.length > 0 && (
          <button onClick={onGoRecords} className="text-[14px] px-4 py-1.5 hover:bg-[#EAF3E8] transition">{t("home_viewAll")}</button>
        )}
      </div>

      {recent.length === 0 ? (
        <p className="text-[14px] text-[#8A8371] py-10 text-center">{t("home_empty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {recent.map((r) => <RecordListCard key={r.id} r={r} lang={lang} t={t} compact />)}
        </div>
      )}
    </div>
  );
}

function topOf(records, key) {
  if (records.length === 0) return "—";
  const m = new Map();
  records.forEach((r) => m.set(r[key], (m.get(r[key]) || 0) + 1));
  let best = null;
  m.forEach((v, k) => { if (!best || v > best[1]) best = [k, v]; });
  return best[0];
}
function topOccasion(records) {
  if (records.length === 0) return "—";
  const m = new Map();
  records.forEach((r) => (r.occasions || []).forEach((o) => m.set(o, (m.get(o) || 0) + 1)));
  let best = null;
  m.forEach((v, k) => { if (!best || v > best[1]) best = [k, v]; });
  return best ? best[0] : "—";
}
function avgRating(records) {
  if (records.length === 0) return "—";
  return (records.reduce((s, r) => s + r.rating, 0) / records.length).toFixed(1);
}

/* shared list card: used by the Records tab and the Home "recent" list so both look identical */
function RecordListCard({ r, lang, t, onClick, compact = false, favInline = false }) {
  const status = computeStatus(r);
  const statusLabel = status === "使用中" ? t("status_inUse") : status === "已用完" ? t("status_used") : t("status_unopened");

  // Left cells (one per row) and right cells (status + info) are laid out in the same grid,
  // so each right-hand item sits on the same line as its left-hand row, with even row spacing.
  const left = [];
  left.push(<p key="title" className="font-display text-[18px] text-[#1B4A38] break-words leading-snug">{r.cultivar || r.brand}</p>);
  left.push(<p key="brand" className="text-[13px] text-[#8A8371] break-words leading-snug">{r.brand}</p>);
  left.push(<div key="stars"><Stars value={r.rating} size={16} /></div>);
  left.push(
    <div key="cat" className="flex flex-nowrap gap-1.5 min-w-0">
      {r.category && <Tag tone="neutral" style={CATEGORY_TAG_STYLE[r.category]} className="whitespace-nowrap shrink-0 !text-[13px]">{CATEGORY_LABEL[r.category] ? CATEGORY_LABEL[r.category][lang] : r.category}</Tag>}
      {r.usage && <Tag tone="gold" className="whitespace-nowrap !text-[13px]">{USAGE_LABEL[r.usage] ? USAGE_LABEL[r.usage][lang] : r.usage}</Tag>}
      {!compact && r.teaStyle && <Tag tone="gold" className="whitespace-nowrap !text-[13px]">{TEA_STYLE_LABEL[r.teaStyle] ? TEA_STYLE_LABEL[r.teaStyle][lang] : r.teaStyle}</Tag>}
      {compact && (r.occasions || []).length > 0 && (() => { const o = r.occasions[0]; return <Tag key="occ1" tone="neutral" className="min-w-0 truncate whitespace-nowrap !text-[13px]">{OCC_LABEL[o] ? OCC_LABEL[o][lang] : o}</Tag>; })()}
    </div>
  );
  if (!compact && (r.occasions || []).length > 0) {
    left.push(
      <div key="occ" className="flex flex-nowrap gap-1.5 min-w-0">
        {(r.occasions || []).slice(0, 2).map((o) => <Tag key={o} tone="neutral" className="min-w-0 truncate whitespace-nowrap !text-[13px]">{OCC_LABEL[o] ? OCC_LABEL[o][lang] : o}</Tag>)}
      </div>
    );
  }
  if (!compact) {
    const srcLabel = r.priceSource ? (PRICE_SOURCE_LABEL[r.priceSource] ? PRICE_SOURCE_LABEL[r.priceSource][lang] : r.priceSource) : "";
    const priceText = r.currency === PRICE_NA
      ? `${t("price_na")}${srcLabel ? ` (${srcLabel})` : ""}`
      : (r.price ? `${currencyLabel(r.currency, lang, r.currencyOther) || ""} ${r.price}` : "");
    const approx = r.currency === PRICE_NA ? null : hkdApprox(r.price, r.currency, lang);
    if (priceText) {
      left.push(<p key="price" className="text-[13px] text-[#8A8371] whitespace-nowrap">{priceText}{approx && <span className="text-[#B0A990] ml-1.5">{approx}</span>}</p>);
    }
  }

  const infoCls = "text-[13px] text-[#B0A990] whitespace-nowrap";
  const right = [<div key="status" className="flex items-center gap-2">{r.favorite && favInline && <FavStar on size={18} />}<Tag tone="gold" className="!text-[13px]">{statusLabel}</Tag></div>];
  if (status === "未開封" && r.unsealedExpiry) {
    right.push(<span key="exp" className={infoCls}>{t("label_validUntil")} {r.unsealedExpiry}</span>);
  }
  if (status === "已用完" && !compact) {
    const finished = r.finishedDate || lastUsageDate(r);
    if (finished) right.push(<span key="fin" className={infoCls}>{t("status_finishedDate")} {finished}</span>);
  }
  if (status === "使用中") {
    const remaining = computeRemaining(r);
    const openedDay = daysSince(r.openedDate);
    if (Number(r.initialWeight) > 0) right.push(<span key="rem" className="text-[13px] text-[#B0A990] whitespace-nowrap">{remaining}g</span>);
    if (openedDay !== null) {
      right.push(<span key="day" className={`text-[13px] whitespace-nowrap ${openedDay + 1 >= 31 ? "text-[#C0392B]" : "text-[#B0A990]"}`}>{t("status_openedDay")}{openedDay + 1}{t("status_openedDaySuffix")}</span>);
    }
  }

  const rows = Math.max(left.length, right.length);
  const cells = [];
  const favRow = r.favorite && !favInline;
  if (favRow) {
    cells.push(<div key="fav-l" className="h-5" />);
    cells.push(<div key="fav-r" className="h-5 flex items-center justify-end"><FavStar on size={18} /></div>);
  }
  for (let i = 0; i < rows; i++) {
    const l = left[i], rr = right[i];
    cells.push(
      <div key={`l${i}`} className={`min-h-[28px] flex items-center min-w-0 ${rr ? "" : "col-span-2"}`}>{l}</div>
    );
    if (rr) cells.push(<div key={`r${i}`} className="min-h-[28px] flex items-center justify-end text-right">{rr}</div>);
    if (!l && rr) { /* right-only row: leave left cell empty (already pushed) */ }
  }

  return (
    <article onClick={onClick}
      className="group relative rounded-2xl border border-[#E4DFCF] bg-white/70 p-4 hover:shadow-md hover:border-[#8DC48D] transition cursor-pointer">
      <div className="flex items-start gap-4">
        <div style={{ marginTop: favRow ? 24 : 0 }}><RecordIcon record={r} size={72} /></div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 flex-1 min-w-0 items-center">
          {cells}
        </div>
      </div>
    </article>
  );
}

/* ================= RECORDS TAB ================= */
function RecordsTab({ lang, records, onAdd, onEdit, onDelete }) {
  const t = (k) => STR[lang][k] ?? k;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("全部");
  const [occFilter, setOccFilter] = useState("全部");
  const [priceSort, setPriceSort] = useState(null); // null | "asc" | "desc"
  const [usageSort, setUsageSort] = useState(null); // null | "earliest" | "latest"
  const [statusFilter, setStatusFilter] = useState("全部");

  const occasionChoices = ["抹茶", "焙茶", "玄米茶"].includes(categoryFilter)
    ? getOccasions(categoryFilter)
    : OCCASIONS.filter((o) => !LATTE_LABELS.includes(o));

  const totalUsedGrams = useMemo(
    () => roundG(records.reduce((sum, r) => sum + (r.usageLog || []).reduce((s, u) => s + (Number(u.amount) || 0), 0), 0)),
    [records]
  );
  const totalUsageCount = useMemo(() => records.reduce((sum, r) => sum + (r.usageLog || []).length, 0), [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = records
      .filter((r) => {
        if (categoryFilter === "全部") return true;
        if (categoryFilter === "其他") return !["抹茶", "焙茶", "玄米茶"].includes(r.category);
        return r.category === categoryFilter;
      })
      .filter((r) => occFilter === "全部" || (r.occasions || []).includes(occFilter))
      .filter((r) => statusFilter === "全部" || computeStatus(r) === statusFilter)
      .filter((r) => !q || `${r.brand}${r.origin}${r.store}${r.cultivar}`.toLowerCase().includes(q));

    if (usageSort && statusFilter === "使用中") {
      const withOpened = base.filter((r) => parseDMY(r.openedDate));
      const withoutOpened = base.filter((r) => !parseDMY(r.openedDate));
      withOpened.sort((a, b) => {
        const da = parseDMY(a.openedDate);
        const db = parseDMY(b.openedDate);
        return usageSort === "earliest" ? da - db : db - da;
      });
      return [...withOpened, ...withoutOpened];
    }
    if (priceSort) {
      const withPrice = base.filter((r) => toUSD(r.price, r.currency) !== null);
      const withoutPrice = base.filter((r) => toUSD(r.price, r.currency) === null);
      withPrice.sort((a, b) => {
        const ua = toUSD(a.price, a.currency);
        const ub = toUSD(b.price, b.currency);
        return priceSort === "asc" ? ua - ub : ub - ua;
      });
      return [...withPrice, ...withoutPrice];
    }
    const rank = { "使用中": 0, "未開封": 1, "已用完": 2 };
    // newest first within each status: 使用中 = 開封日, 未開封 = 購入日, 已用完 = 用完日
    const keyDate = (r) => {
      const st = computeStatus(r);
      const str = st === "使用中" ? r.openedDate : st === "已用完" ? (r.finishedDate || lastUsageDate(r)) : r.purchaseDate;
      const d = parseDMY(str);
      return d ? d.getTime() : -Infinity;
    };
    return base.sort((a, b) => (rank[computeStatus(a)] - rank[computeStatus(b)]) || (keyDate(b) - keyDate(a)) || (b.id - a.id));
  }, [records, search, categoryFilter, occFilter, priceSort, usageSort, statusFilter]);

  return (
    <div>
      <header className="pt-[25px] pb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700">{t("records_title")}</h1>
          <button onClick={onAdd} className="rounded-full bg-[#2B7056] hover:bg-[#1B4A38] text-white text-[14px] px-4 py-1.5 transition shrink-0">
            {t("home_addBtn")}
          </button>
        </div>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
      </header>

      <section className="grid grid-cols-2 gap-3 mb-6">
        <div className="rounded-2xl border border-[#E4DFCF] bg-white/60 px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[17px] tracking-wider text-[#8A8371]">{t("records_totalUsed")}</span>
          <span className="font-display text-[17px] text-[#2B7056]">{totalUsedGrams}g</span>
        </div>
        <div className="rounded-2xl border border-[#E4DFCF] bg-white/60 px-4 py-3 flex flex-col gap-0.5">
          <span className="text-[17px] tracking-wider text-[#8A8371]">{t("records_usageCount")}</span>
          <span className="font-display text-[17px] text-[#2B7056]">{totalUsageCount}{t("records_countUnit")}</span>
        </div>
      </section>

      <section className="flex flex-col gap-3 mb-6">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("records_search")}
          className="w-full rounded-full border border-[#E4DFCF] bg-white px-4 py-2.5 text-[14px] outline-none focus:border-[#8DC48D] focus:ring-2 focus:ring-[#BDDBBD] transition" />

        <div className="flex flex-wrap gap-2 items-center">
          {["全部", "使用中", "未開封", "已用完"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`text-[14px] px-3 py-1 rounded-full border transition ${statusFilter === s ? "btn-brown" : ""}`}>
              {s === "全部" ? t("status_all") : s === "使用中" ? t("status_inUse") : s === "未開封" ? t("status_unopened") : t("status_used")}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[14px] text-[#8A8371] mr-1">{t("filter_category")}</span>
          {["全部", "抹茶", "焙茶", "玄米茶", "其他"].map((c) => (
            <button key={c} onClick={() => { setCategoryFilter(c); setOccFilter("全部"); }}
              className={`text-[14px] px-3 py-1 rounded-full border transition ${categoryFilter === c ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
              {c === "全部" ? t("filter_all") : (CATEGORY_LABEL[c] ? CATEGORY_LABEL[c][lang] : c)}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[14px] text-[#8A8371] mr-1">{t("filter_occasion")}</span>
          {["全部", ...occasionChoices].map((o) => (
            <button key={o} onClick={() => setOccFilter(o)}
              className={`text-[14px] px-3 py-1 rounded-full border transition ${occFilter === o ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
              {o === "全部" ? t("filter_all") : OCC_LABEL[o][lang]}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-[14px] text-[#8A8371] mr-1">{t("filter_price")}</span>
          <button onClick={() => { setPriceSort(priceSort === "asc" ? null : "asc"); setUsageSort(null); }}
            className={`text-[14px] px-3 py-1 rounded-full border transition ${priceSort === "asc" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
            {t("price_asc")}
          </button>
          <button onClick={() => { setPriceSort(priceSort === "desc" ? null : "desc"); setUsageSort(null); }}
            className={`text-[14px] px-3 py-1 rounded-full border transition ${priceSort === "desc" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
            {t("price_desc")}
          </button>
        </div>

        {statusFilter === "使用中" && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[14px] text-[#8A8371] mr-1">{t("filter_usageDate")}</span>
            <button onClick={() => { setUsageSort(usageSort === "earliest" ? null : "earliest"); setPriceSort(null); }}
              className={`text-[14px] px-3 py-1 rounded-full border transition ${usageSort === "earliest" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
              {t("usage_earliest")}
            </button>
            <button onClick={() => { setUsageSort(usageSort === "latest" ? null : "latest"); setPriceSort(null); }}
              className={`text-[14px] px-3 py-1 rounded-full border transition ${usageSort === "latest" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
              {t("usage_latest")}
            </button>
          </div>
        )}
      </section>

      {filtered.length === 0 ? (
        <p className="text-center py-20 text-[#8A8371] text-[14px]">{t("records_empty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((r) => <RecordListCard key={r.id} r={r} lang={lang} t={t} onClick={() => onEdit(r)} />)}
        </div>
      )}

    </div>
  );
}

/* ================= EXPIRY TAB ================= */
function ExpiryTab({ lang, records, onUpdate }) {
  const t = (k) => STR[lang][k] ?? k;

  const rows = useMemo(() => {
    return records
      .filter((r) => computeStatus(r) !== "已用完")
      .map((r) => {
        let target = null;
        if (r.openedDate) {
          const opened = parseDMY(r.openedDate) || new Date();
          target = new Date(opened.getTime() + (Number(r.expiryDays) || 30) * 86400000);
        } else {
          target = parseDMY(r.unsealedExpiry);
        }
        return { r, target, days: target ? daysFromToday(target) : null };
      })
      .sort((a, b) => {
        if (a.days === null) return 1;
        if (b.days === null) return -1;
        return a.days - b.days;
      });
  }, [records]);

  const toggleStatus = (r) => {
    if (r.openedDate) {
      onUpdate(r.id, { status: "未開封", openedDate: "" });
    } else {
      onUpdate(r.id, { status: "已開封", openedDate: todayDMY(), expiryDays: r.expiryDays || 30 });
    }
  };

  const overdueText = (n) => ({
    zh: `已過期 ${n} 天`, en: `Overdue ${n}d`, ja: `期限切れ ${n}日`,
  }[lang] || `Overdue ${n}d`);
  const leftText = (n) => ({
    zh: `剩餘 ${n} 天`, en: `${n}d left`, ja: `残り ${n}日`,
  }[lang] || `${n}d left`);

  const badge = (days) => {
    if (days === null) return { text: t("expiry_noDate"), cls: "bg-[#F1EEE3] text-[#8A8371] border-[#E4DFCF]" };
    if (days < 0) return { text: overdueText(Math.abs(days)), cls: "bg-[#F7EAE6] text-[#BA0F0F] border-[#EBCFC6]" };
    if (days === 0) return { text: t("expiry_today"), cls: "bg-[#FBEFD0] text-[#9C7A2E] border-[#E4D6AE]" };
    if (days <= 7) return { text: leftText(days), cls: "bg-[#FBEFD0] text-[#9C7A2E] border-[#E4D6AE]" };
    return { text: leftText(days), cls: "bg-[#EAF3E8] text-[#2B7056] border-[#BDDBBD]" };
  };

  return (
    <div>
      <header className="pt-[25px] pb-6">
        <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700">{t("expiry_title")}</h1>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
      </header>

      {rows.length === 0 ? (
        <p className="text-center py-20 text-[#8A8371] text-[14px]">{t("expiry_empty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(({ r, target, days }) => {
            const b = badge(days);
            const pad = (n) => String(n).padStart(2, "0");
            const targetStr = target ? `${target.getFullYear()}/${pad(target.getMonth() + 1)}/${pad(target.getDate())}` : null;
            return (
              <article key={r.id} className="rounded-2xl border border-[#E4DFCF] bg-white/70 p-4">
                <div className="flex gap-4 items-start">
                  <RecordIcon record={r} size={48} />
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[18px] text-[#1B4A38] truncate">{r.cultivar || r.brand}</p>
                    <p className="text-[13px] text-[#8A8371] truncate">{r.brand}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {r.category && <Tag tone="neutral" style={CATEGORY_TAG_STYLE[r.category]} className="!text-[13px]">{CATEGORY_LABEL[r.category] ? CATEGORY_LABEL[r.category][lang] : r.category}</Tag>}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className={`inline-block text-[14px] px-2 py-0.5 rounded-full border ${b.cls}`}>{b.text}</span>
                      {targetStr && (
                        <span className="text-[14px] text-[#45320F]">{t("expiry_dateLabel")} {targetStr}</span>
                      )}
                      {Number(r.initialWeight) > 0 && (
                        <span className="text-[14px] text-[#8A8371]">{t("weight_remaining")} {computeRemaining(r)}g</span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => toggleStatus(r)}
                    className="text-[14px] px-3 py-1 rounded-full border border-[#8DC48D] text-[#2B7056] hover:bg-[#EAF3E8] transition shrink-0">
                    {r.openedDate ? t("expiry_markUnopened") : t("expiry_markOpened")}
                  </button>
                </div>

                {r.openedDate && (
                  <div className="grid grid-cols-2 gap-3 mt-3 pl-[64px]">
                    <div className="flex flex-col gap-1">
                      <label className="text-[14px] text-[#8A8371]">{t("expiry_openedDate")}</label>
                      <input value={r.openedDate} onChange={(e) => onUpdate(r.id, { openedDate: formatDMYInput(e.target.value) })}
                        className="rounded-lg border border-[#E4DFCF] px-2 py-1.5 text-[14px] outline-none focus:border-[#8DC48D]" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[14px] text-[#8A8371]">{t("expiry_days")}</label>
                      {(() => {
                        const od = daysSince(r.openedDate);
                        const n = od === null ? null : od + 1;
                        return (
                          <div className={`rounded-lg border border-[#E4DFCF] bg-[#F1EEE3] px-2 py-1.5 text-[13px] ${n !== null && n >= 31 ? "text-[#C0392B]" : "text-[#6B6558]"}`}>
                            {n === null ? "—" : `${n}${{ zh: "天", en: " days", ja: "日" }[lang] || " days"}`}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================= STATS TAB ================= */
const PIE_COLORS = ["#2B7056", "#8DC48D", "#BDDBBD", "#C9A227", "#A9825A", "#6B8F73", "#4F6B57", "#D98C5F", "#7FB7BE", "#B5838D", "#8E9AAF", "#E0B84C", "#5E8C61", "#C7A98A"];
function pieGradient(rows) {
  const total = rows.reduce((s, [, c]) => s + c, 0) || 1;
  let cursor = 0;
  return rows
    .map(([, count], i) => {
      const start = (cursor / total) * 100;
      cursor += count;
      const end = (cursor / total) * 100;
      return `${PIE_COLORS[i % PIE_COLORS.length]} ${start}% ${end}%`;
    })
    .join(", ");
}
// wrap a brand name into lines that fit a given pixel width (13px text); breaks at spaces when possible
function wrapBrand(name, maxW) {
  const cw = (c) => (/[\u2e80-\u9fff\uff00-\uffef]/.test(c) ? 14 : 9.2);
  const lines = [];
  let cur = "", w = 0;
  for (const ch of name) {
    const cwid = cw(ch);
    if (w + cwid > maxW && cur) {
      const sp = cur.lastIndexOf(" ");
      if (sp > 0 && ch !== " ") {
        lines.push(cur.slice(0, sp));
        cur = cur.slice(sp + 1);
        w = [...cur].reduce((a, c) => a + cw(c), 0);
      } else {
        lines.push(cur);
        cur = ""; w = 0;
      }
    }
    if (ch === " " && !cur) continue;
    cur += ch; w += cwid;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [name];
}

function PieBreakdown({ rows, labelOf, lang, centerText }) {
  const total = rows.reduce((s, [, c]) => s + c, 0) || 1;
  const unit = lang === "en" ? "uses" : lang === "ja" ? "回" : "次";
  let cursor = 0;
  return (
    <div className="flex items-center justify-center gap-6">
      <svg width="128" height="128" viewBox="0 0 128 128" className="shrink-0">
        {rows.length === 1 ? (
          <circle cx="64" cy="64" r="64" fill={PIE_COLORS[0]}><title>{`${labelOf(rows[0][0])}: ${rows[0][1]}`}</title></circle>
        ) : rows.map(([name, count], i) => {
          const startDeg = (cursor / total) * 360;
          cursor += count;
          const endDeg = (cursor / total) * 360;
          const sweep = endDeg - startDeg;
          const start = polar(64, 64, 64, startDeg);
          const end = polar(64, 64, 64, endDeg);
          const largeArc = sweep > 180 ? 1 : 0;
          const d = `M 64 64 L ${start.x.toFixed(1)} ${start.y.toFixed(1)} A 64 64 0 ${largeArc} 1 ${end.x.toFixed(1)} ${end.y.toFixed(1)} Z`;
          return (
            <path key={name} d={d} fill={PIE_COLORS[i % PIE_COLORS.length]}>
              <title>{`${labelOf(name)}: ${count} ${unit}`}</title>
            </path>
          );
        })}
        <circle cx="64" cy="64" r="41" fill="#FFFFFF" />
        <text x="64" y="69" textAnchor="middle" className="font-display" fontSize="16" fill="#2B7056">{centerText}</text>
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {rows.map(([name, count], i) => (
          <div key={name} className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
            <span className="text-[14px] text-[#6B6558] break-words min-w-0">{labelOf(name)}</span>
            <span className="text-[14px] text-[#B0A990] shrink-0">({count})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= TEA VISIT TAB ================= */
function isValidYMD(s) {
  const m = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(s || "");
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
}
function todayYMD() {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}
const EMPTY_VISIT = { store: "", address: "", rating: 0, date: "", comment: "", photos: [] };

function TeaVisitTab({ lang, visits, setVisits }) {
  const t = (k) => STR[lang][k] ?? k;
  const [editing, setEditing] = useState(null); // null | visit being added / edited
  const [viewingId, setViewingId] = useState(null); // read-only detail
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errs, setErrs] = useState({});
  const [dragIdx, setDragIdx] = useState(null);

  const normPhotos = (v) => v.photos || (v.photo ? [v.photo] : []);
  const viewing = visits.find((v) => v.id === viewingId) || null;

  const startAdd = () => { setErrs({}); setViewingId(null); setEditing({ ...EMPTY_VISIT, id: Date.now(), date: todayYMD(), _new: true }); };
  const startEdit = (v) => { setErrs({}); setEditing({ ...v, photos: normPhotos(v) }); };
  const upd = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  const addPhotoData = (data) => setEditing((e) => ({ ...e, photos: [...(e.photos || []), data] }));
  const handlePhoto = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    files.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        addPhotoData(canvas.toDataURL("image/jpeg", 0.85));
        URL.revokeObjectURL(url);
      };
      img.onerror = () => {
        const reader = new FileReader();
        reader.onload = () => addPhotoData(reader.result);
        reader.readAsDataURL(file);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    });
  };
  const removePhoto = (idx) => setEditing((e) => ({ ...e, photos: e.photos.filter((_, k) => k !== idx) }));

  // drag-to-reorder (pointer events, so it works with both mouse and touch)
  const onDragStart = (e, k) => { e.preventDefault(); try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } setDragIdx(k); };
  const onDragMove = (e) => {
    if (dragIdx === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const target = el && el.closest ? el.closest("[data-pidx]") : null;
    if (!target) return;
    const to = Number(target.getAttribute("data-pidx"));
    if (Number.isNaN(to) || to === dragIdx) return;
    setEditing((cur) => {
      const arr = [...cur.photos];
      const [moved] = arr.splice(dragIdx, 1);
      arr.splice(to, 0, moved);
      return { ...cur, photos: arr };
    });
    setDragIdx(to);
  };
  const onDragEnd = () => setDragIdx(null);

  const save = () => {
    const e = {};
    if (!editing.store.trim()) e.store = true;
    if (!editing.rating) e.rating = true;
    if (editing.date && !isValidYMD(editing.date)) e.date = true;
    setErrs(e);
    if (Object.keys(e).length) return;
    const { _new, photo, ...v } = editing;
    setVisits((vs) => (vs.some((x) => x.id === v.id) ? vs.map((x) => (x.id === v.id ? v : x)) : [v, ...vs]));
    setEditing(null);
    setViewingId(v.id);
  };
  const cancelEdit = () => { const wasNew = editing && editing._new; setEditing(null); if (wasNew) setViewingId(null); };
  const doDelete = () => {
    setVisits((vs) => vs.filter((v) => v.id !== viewingId));
    setConfirmDelete(false);
    setViewingId(null);
  };

  const sorted = [...visits].sort((a, b) => ((a.date || "") < (b.date || "") ? 1 : -1));
  const inputCls = "rounded-lg border px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]";
  const PhotoStack = ({ list }) => list.length > 0 && (
    <div className="flex flex-col gap-3 mt-3">
      {list.map((p, k) => <img key={k} src={p} alt="" className="w-full h-auto rounded-xl border border-[#E4DFCF] block" />)}
    </div>
  );

  const ThumbRow = ({ list }) => list.length > 0 && (
    <div className="flex gap-2 mt-3">
      {list.slice(0, 3).map((p, k) => (
        <div key={k} className="relative w-16 h-16 shrink-0">
          <img src={p} alt="" className="w-full h-full object-cover rounded-lg border border-[#E4DFCF] block" />
          {k === 2 && list.length > 3 && (
            <div className="absolute inset-0 rounded-lg bg-black/45 flex items-center justify-center text-white text-[14px] font-semibold">+{list.length - 3}</div>
          )}
        </div>
      ))}
    </div>
  );

  /* ---------- read-only detail ---------- */
  if (viewing && !editing) {
    const ph = normPhotos(viewing);
    return (
      <div className="pt-[25px] pb-8 max-w-2xl mx-auto">
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex flex-col items-start gap-3">
              <button onClick={() => setViewingId(null)} className="btn-plain text-[14px] text-[#6B6558] hover:text-[#2B7056] flex items-center gap-1">{t("add_back")}</button>
              <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700">{t("visit_title")}</h1>
            </div>
            <div className="flex flex-col items-end gap-2">
              <button onClick={() => startEdit(viewing)} className="text-[14px] px-4 py-1 rounded-full border flex items-center gap-1.5">
                <EditIcon size={12} /> {t("action_edit")}
              </button>
              <button onClick={() => setConfirmDelete(true)} className="btn-danger text-[14px] px-4 py-1 rounded-full border flex items-center gap-1.5">
                <TrashIcon size={12} /> {t("delete")}
              </button>
            </div>
          </div>
          <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
        </header>
        <section className="rounded-3xl border border-[#E4DFCF] bg-white/70 p-6">
          <div className="flex flex-col divide-y divide-[#E4DFCF]">
            <ViewField label={t("visit_store")} value={viewing.store} />
            <ViewField label={t("visit_address")} value={viewing.address || "—"} />
            <div className="flex items-center justify-between gap-4 text-[14px] py-3">
              <span className="shrink-0 text-[#8A8371]">{t("add_rating")}</span>
              <Stars value={viewing.rating} size={18} />
            </div>
            <ViewField label={t("visit_date")} value={viewing.date || "—"} />
            {viewing.comment && (
              <div className="py-3 text-[14px]">
                <p className="text-[#8A8371] mb-1.5">{t("visit_comment")}</p>
                <p className="text-[#2E2A24] whitespace-pre-wrap break-words">{viewing.comment}</p>
              </div>
            )}
          </div>
          <PhotoStack list={ph} />
        </section>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-6" onClick={() => setConfirmDelete(false)}>
            <div className="bg-white rounded-3xl border border-[#E4DFCF] p-6 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
              <p className="text-[14px] text-[#2E2A24] mb-5 text-center">{t("delete_confirm_msg")}</p>
              <div className="flex justify-center gap-3">
                <button onClick={doDelete} className="btn-danger text-[14px] px-5 py-1.5 rounded-full border">{t("delete_yes")}</button>
                <button onClick={() => setConfirmDelete(false)} className="text-[14px] px-5 py-1.5 rounded-full border border-[#E4DFCF] text-[#6B6558]">{t("delete_cancel")}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-[25px] pb-8 max-w-2xl mx-auto">
      <header className="mb-6 flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700">{t("visit_title")}</h1>
        {(!editing || editing._new) && (
          <button onClick={startAdd} className="text-[14px] px-4 py-1.5 rounded-full bg-[#EAF3E8] text-[#2B7056] border-[1.5px] border-[#BDDBBD] hover:bg-[#D5F2DB] transition">
            {t("visit_add")}
          </button>
        )}
      </header>

      {editing && !editing._new && (
        <section className="rounded-3xl border border-[#E4DFCF] bg-white/70 p-6 mb-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("visit_store")}</label>
              <input value={editing.store} onChange={(e) => upd("store", e.target.value)}
                className={`${inputCls} ${errs.store ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("visit_address")}</label>
              <input value={editing.address} onChange={(e) => upd("address", e.target.value)}
                className={`${inputCls} border-[#E4DFCF]`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("add_rating")}</label>
              <div className="py-1.5"><Stars value={editing.rating} size={22} onSelect={(n) => upd("rating", n)} /></div>
              {errs.rating && <p className="text-[14px] text-[#A24B3A]">{t("visit_rating_err")}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("visit_date")}</label>
              <input value={editing.date} onChange={(e) => upd("date", formatDMYInput(e.target.value))} placeholder="例：2026/01/01"
                className={`${inputCls} ${errs.date ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
              {errs.date && <p className="text-[14px] text-[#A24B3A]">{t("date_err")}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("visit_comment")}</label>
              <textarea value={editing.comment} onChange={(e) => upd("comment", e.target.value)} rows={3}
                className={`${inputCls} border-[#E4DFCF] resize-none`} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[14px] text-[#8A8371]">{t("visit_photo")}</label>
              {(editing.photos || []).length > 1 && <p className="text-[13px] text-[#B0A990]">{t("visit_drag_hint")}</p>}
              {(editing.photos || []).length > 0 && (
                <div className="flex flex-col gap-3 mb-1">
                  {editing.photos.map((p, k) => (
                    <div key={p.length + "-" + k} data-pidx={k} className={`relative ${dragIdx === k ? "opacity-70 ring-2 ring-[#8DC48D] rounded-xl" : ""}`}>
                      <img src={p} alt="" draggable={false} className="w-full h-auto rounded-xl border border-[#E4DFCF] block select-none" />
                      {editing.photos.length > 1 && (
                        <button type="button" aria-label="drag"
                          onPointerDown={(e) => onDragStart(e, k)} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
                          style={{ touchAction: "none", cursor: "grab", textShadow: "0 0 3px rgba(0,0,0,0.6)" }}
                          className="absolute top-2 left-2 w-8 h-8 !bg-transparent !border-0 text-white text-[20px] leading-none flex items-center justify-center">⠿</button>
                      )}
                      <button type="button" onClick={() => removePhoto(k)} aria-label={t("add_photo_remove")}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-[#6B6558] text-[16px] leading-none flex items-center justify-center border border-[#E4DFCF]">×</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-3 items-center">
                <label className="text-[14px] px-3 py-1 rounded-full bg-[#EAF3E8] text-[#2B7056] border-[1.5px] border-[#BDDBBD] cursor-pointer hover:bg-[#D5F2DB] transition">
                  <input type="file" multiple accept="image/jpeg,image/png,image/heic,image/heif" onChange={handlePhoto} className="hidden" />
                  {t("visit_photo_add")}
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button onClick={cancelEdit} className="text-[14px] px-4 py-1.5 rounded-full text-[#6B6558] hover:bg-[#F1EEE3] transition">{t("add_cancel")}</button>
            <button onClick={save} className="btn-brown text-[14px] px-5 py-1.5 rounded-full transition">{t("visit_save")}</button>
          </div>
        </section>
      )}
      {editing && editing._new && (
        <div className="fixed inset-0 bg-black/30 flex items-end justify-center z-50" onClick={cancelEdit}>
          <div className="bg-white rounded-t-3xl w-full max-w-2xl h-[90vh] h-[90dvh] overflow-y-auto font-body text-[#2E2A24] safe-pb" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-center pt-3"><div className="w-10 h-1.5 rounded-full bg-[#D9D2C2]" /></div>
            <header className="flex items-center justify-between px-4 pt-3 pb-3">
              <button onClick={cancelEdit} className="text-[14px] px-4 py-1.5 rounded-full border">{t("add_cancel")}</button>
              <h1 className="font-display text-[16px] font-700 text-[#1B4A38]">{t("visit_add")}</h1>
              <button onClick={save} className="text-[14px] px-4 py-1.5 rounded-full border text-[#2B7056] font-medium">{t("action_save")}</button>
            </header>
            <div className="px-6 pb-8">
          <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("visit_store")}</label>
                <input value={editing.store} onChange={(e) => upd("store", e.target.value)}
                  className={`${inputCls} ${errs.store ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("visit_address")}</label>
                <input value={editing.address} onChange={(e) => upd("address", e.target.value)}
                  className={`${inputCls} border-[#E4DFCF]`} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("add_rating")}</label>
                <div className="py-1.5"><Stars value={editing.rating} size={22} onSelect={(n) => upd("rating", n)} /></div>
                {errs.rating && <p className="text-[14px] text-[#A24B3A]">{t("visit_rating_err")}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("visit_date")}</label>
                <input value={editing.date} onChange={(e) => upd("date", formatDMYInput(e.target.value))} placeholder="例：2026/01/01"
                  className={`${inputCls} ${errs.date ? "border-[#D98C7A]" : "border-[#E4DFCF]"}`} />
                {errs.date && <p className="text-[14px] text-[#A24B3A]">{t("date_err")}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("visit_comment")}</label>
                <textarea value={editing.comment} onChange={(e) => upd("comment", e.target.value)} rows={3}
                  className={`${inputCls} border-[#E4DFCF] resize-none`} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[14px] text-[#8A8371]">{t("visit_photo")}</label>
                {(editing.photos || []).length > 1 && <p className="text-[13px] text-[#B0A990]">{t("visit_drag_hint")}</p>}
                {(editing.photos || []).length > 0 && (
                  <div className="flex flex-col gap-3 mb-1">
                    {editing.photos.map((p, k) => (
                      <div key={p.length + "-" + k} data-pidx={k} className={`relative ${dragIdx === k ? "opacity-70 ring-2 ring-[#8DC48D] rounded-xl" : ""}`}>
                        <img src={p} alt="" draggable={false} className="w-full h-auto rounded-xl border border-[#E4DFCF] block select-none" />
                        {editing.photos.length > 1 && (
                          <button type="button" aria-label="drag"
                            onPointerDown={(e) => onDragStart(e, k)} onPointerMove={onDragMove} onPointerUp={onDragEnd} onPointerCancel={onDragEnd}
                            style={{ touchAction: "none", cursor: "grab", textShadow: "0 0 3px rgba(0,0,0,0.6)" }}
                            className="absolute top-2 left-2 w-8 h-8 !bg-transparent !border-0 text-white text-[20px] leading-none flex items-center justify-center">⠿</button>
                        )}
                        <button type="button" onClick={() => removePhoto(k)} aria-label={t("add_photo_remove")}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-[#6B6558] text-[16px] leading-none flex items-center justify-center border border-[#E4DFCF]">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-3 items-center">
                  <label className="text-[14px] px-3 py-1 rounded-full bg-[#EAF3E8] text-[#2B7056] border-[1.5px] border-[#BDDBBD] cursor-pointer hover:bg-[#D5F2DB] transition">
                    <input type="file" multiple accept="image/jpeg,image/png,image/heic,image/heif" onChange={handlePhoto} className="hidden" />
                    {t("visit_photo_add")}
                  </label>
                </div>
              </div>
            </div>
              </div>
          </div>
        </div>
      )}

      {(!editing || editing._new) && sorted.length === 0 && (
        <p className="text-center text-[14px] text-[#B0A990] py-16">{t("visit_empty")}</p>
      )}

      {(!editing || editing._new) && (
        <div className="flex flex-col gap-3">
          {sorted.map((v) => (
            <article key={v.id} onClick={() => setViewingId(v.id)}
              className="rounded-2xl border border-[#E4DFCF] bg-white/70 p-4 hover:shadow-md hover:border-[#8DC48D] transition cursor-pointer">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 items-center">
                <p className="min-h-[28px] flex items-center font-display text-[18px] text-[#1B4A38] break-words leading-snug">{v.store}</p>
                <span className="text-[13px] text-[#B0A990] whitespace-nowrap text-right">{v.date}</span>
                {v.address && <p className="col-span-2 text-[13px] text-[#8A8371] break-words leading-snug">{v.address}</p>}
                <div className="col-span-2 min-h-[28px] flex items-center"><Stars value={v.rating} size={16} /></div>
                {v.comment && <p className="col-span-2 text-[13px] text-[#6B6558] whitespace-pre-wrap break-words">{v.comment}</p>}
              </div>
              <ThumbRow list={normPhotos(v)} />
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StatsTab({ lang, records }) {
  const t = (k) => STR[lang][k] ?? k;
  const [periodYear, setPeriodYear] = useState("全部");
  const [periodMonth, setPeriodMonth] = useState("全部");

  const years = useMemo(() => {
    const set = new Set();
    records.forEach((r) => {
      const m = /^(\d{4})\/(\d{2})/.exec(r.purchaseDate || "");
      if (m) set.add(m[1]);
    });
    return [...set].sort((a, b) => (a < b ? 1 : -1));
  }, [records]);
  const months = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const m = /^(\d{4})\/(\d{2})/.exec(r.purchaseDate || "");
      if (periodYear !== "全部" && (!m || m[1] !== periodYear)) return false;
      if (periodMonth !== "全部" && (!m || m[2] !== periodMonth)) return false;
      return true;
    });
  }, [records, periodYear, periodMonth]);

  const breakdown = (key) => {
    const m = new Map();
    filteredRecords.forEach((r) => m.set(r[key], (m.get(r[key]) || 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const brandRows = breakdown("brand");
  const occRows = useMemo(() => {
    const m = new Map();
    filteredRecords.forEach((r) => (r.occasions || []).forEach((o) => m.set(o, (m.get(o) || 0) + 1)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredRecords]);
  const max = (rows) => Math.max(1, ...rows.map((r) => r[1]));
  // price ranking: highest first, compared via an approximate USD value (same basis as the Records price sort)
  const priceRows = records
    .map((r) => ({ r, usd: toUSD(r.price, r.currency) }))
    .filter((x) => x.usd !== null && x.usd > 0)
    .sort((a, b) => b.usd - a.usd);
  const maxUsd = Math.max(1e-9, ...priceRows.map((x) => x.usd));
  // 3 most expensive + 2 cheapest (all records); everything if there are 5 or fewer
  const priceSplit = priceRows.length > 5;
  const priceTop = priceSplit ? priceRows.slice(0, 3) : priceRows;
  const priceLow = priceSplit ? priceRows.slice(-2) : [];
  const totalOcc = occRows.reduce((s, [, c]) => s + c, 0) || 1;

  return (
    <div>
      <header className="pt-[25px] pb-6">
        <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700">{t("stats_title")}</h1>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
      </header>

      <div className="flex flex-wrap gap-2 items-center mb-2">
        <span className="text-[14px] text-[#8A8371] mr-1">{t("stats_filterYear")}</span>
        <button onClick={() => setPeriodYear("全部")}
          className={`text-[14px] px-3 py-1 rounded-full border transition ${periodYear === "全部" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
          {t("filter_all")}
        </button>
        {years.map((y) => (
          <button key={y} onClick={() => setPeriodYear(y)}
            className={`text-[14px] px-3 py-1 rounded-full border transition ${periodYear === y ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
            {y}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 items-center mb-6">
        <span className="text-[14px] text-[#8A8371] mr-1">{t("stats_filterMonth")}</span>
        <button onClick={() => setPeriodMonth("全部")}
          className={`text-[14px] px-3 py-1 rounded-full border transition ${periodMonth === "全部" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
          {t("filter_all")}
        </button>
        {months.map((m) => (
          <button key={m} onClick={() => setPeriodMonth(m)}
            className={`text-[14px] px-3 py-1 rounded-full border transition ${periodMonth === m ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
            {m}
          </button>
        ))}
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: t("stat_total"), value: filteredRecords.length },
          { label: t("stat_topBrand"), value: topOf(filteredRecords, "brand") },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-[#E4DFCF] bg-white/60 px-4 py-4 flex flex-col gap-1">
            <span className="text-[17px] tracking-wider text-[#8A8371]">{s.label}</span>
            <span className="font-display text-[17px] text-[#2B7056] truncate">{s.value}</span>
          </div>
        ))}
      </section>

      {filteredRecords.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="font-display text-[17px] text-[#1B4A38] mb-3">{t("stats_brandBreakdown")}</h2>
            <PieBreakdown rows={brandRows} labelOf={(n) => n} lang={lang} centerText={filteredRecords.length} />
          </div>
          <div>
            <h2 className="font-display text-[17px] text-[#1B4A38] mb-3">{t("stats_occasionBreakdown")}</h2>
            {(() => {
              const BAR_COLORS = ["#E8DCC2", "#C8A882", "#A9825A", "#6B4A2B"]; // beige, light brown, brown, dark brown
              const maxCount = Math.max(1, ...occRows.map((x) => x[1]));
              const niceMax = Math.max(4, Math.ceil(maxCount / 2) * 2);
              const barW = 38, gap = 22, leftPad = 24, topPad = 18, chartH = 110;
              const wrapped = occRows.map(([n]) => wrapBrand(OCC_LABEL[n] ? OCC_LABEL[n][lang] : n, (barW + gap - 4) * (14 / 12)));
              const maxLines = Math.max(1, ...wrapped.map((l) => l.length));
              const bottomPad = 14 + maxLines * 15 + 6;
              const svgW = leftPad + occRows.length * (barW + gap) + gap;
              const svgH = topPad + chartH + bottomPad;
              const ticks = 4;
              return (
                <div className="overflow-x-auto">
                  <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ minWidth: "100%" }}>
                    {Array.from({ length: ticks + 1 }).map((_, i) => {
                      const val = Math.round((niceMax / ticks) * i);
                      const y = topPad + chartH - (val / niceMax) * chartH;
                      return (
                        <g key={i}>
                          <line x1={leftPad} y1={y} x2={svgW} y2={y} stroke="#E4DFCF" strokeWidth="1" />
                          <text x={leftPad - 6} y={y + 4} textAnchor="end" fontSize="12" fill="#8A8371">{val}</text>
                        </g>
                      );
                    })}
                    {occRows.map(([name, count], i) => {
                      const x = leftPad + gap + i * (barW + gap);
                      const barH = (count / niceMax) * chartH;
                      const y = topPad + chartH - barH;
                      return (
                        <g key={name}>
                          <rect x={x} y={y} width={barW} height={Math.max(1, barH)} rx="4" fill={BAR_COLORS[i % BAR_COLORS.length]} stroke="#D9CBA8" strokeWidth="0.5" />
                          <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize="12" fill="#6B4A2B" fontWeight="600">{count}</text>
                          <text x={x + barW / 2} y={topPad + chartH + 16} textAnchor="middle" fontSize="12" fill="#6B6558">
                            {wrapped[i].map((ln, k) => <tspan key={k} x={x + barW / 2} dy={k === 0 ? 0 : 15}>{ln}</tspan>)}
                          </text>
                        </g>
                      );
                    })}
                    <line x1={leftPad} y1={topPad + chartH} x2={svgW} y2={topPad + chartH} stroke="#D9D2C2" strokeWidth="1.5" />
                  </svg>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {priceRows.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-[17px] text-[#1B4A38] mb-3">{t("stats_priceBreakdown")}</h2>
          {[[priceTop, priceSplit ? t("stats_priceTop") : null], [priceLow, priceSplit ? t("stats_priceLow") : null]].map(([group, caption], gi) => group.length > 0 && (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {caption && <p className="text-[14px] text-[#9C7A2E] mb-2">{caption}</p>}
              <div className="flex flex-col gap-3">
                {group.map(({ r, usd }) => {
                  const approx = hkdApprox(r.price, r.currency, lang);
                  return (
                    <div key={r.id}>
                      <div className="flex items-baseline justify-between gap-3 text-[14px]">
                        <span className="text-[#6B6558] break-words min-w-0">{r.cultivar || r.brand}</span>
                        <span className="text-[#2B7056] font-semibold whitespace-nowrap shrink-0">
                          {currencyLabel(r.currency, lang, r.currencyOther)} {r.price}
                          {approx && <span className="font-normal text-[#B0A990] ml-1.5">{approx}</span>}
                        </span>
                      </div>
                      <div className="mt-1 h-3 rounded-full bg-[#EFEBDD] overflow-hidden">
                        <div className="h-full rounded-full bg-[#8DC48D]" style={{ width: `${Math.max(2, (usd / maxUsd) * 100)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= FEEDBACK TAB ================= */
function FeedbackTab({ lang }) {
  const t = (k) => STR[lang][k] ?? k;
  const CATS = [
    { key: "suggest", label: t("feedback_suggest") },
    { key: "bug", label: t("feedback_bug") },
    { key: "other", label: t("feedback_other") },
  ];
  const [cat, setCat] = useState("suggest");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  // Google Form 設定（類型 / 內容 / 聯絡 Email）
  const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdBFRy7MJCZNz5XnePmDXZB_HiU2GWcBr8A_2BDn16NNp_vfQ/formResponse";
  const ENTRY_CATEGORY = "entry.398945593";
  const ENTRY_MESSAGE = "entry.1921811668";
  const ENTRY_EMAIL = "entry.753501976";
  // 送出給表單的「類型」文字（需與 Google Form 的選項文字一致）
  const CATEGORY_VALUE = { suggest: "功能建議", bug: "問題回報", other: "其他" };

  const submit = async () => {
    if (sending || !message.trim()) return;
    setSending(true);
    setSent(false);
    setFailed(false);
    try {
      const body = new URLSearchParams();
      body.append(ENTRY_CATEGORY, CATEGORY_VALUE[cat] || cat);
      body.append(ENTRY_MESSAGE, message.trim());
      body.append(ENTRY_EMAIL, email.trim());
      await fetch(FORM_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      setSent(true);
      setCat("suggest");
      setMessage("");
      setEmail("");
    } catch (err) {
      setFailed(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <header className="pt-[25px] pb-6">
        <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700">{t("feedback_title")}</h1>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
      </header>

      <section className="rounded-3xl border border-[#E4DFCF] bg-white/70 p-6 max-w-xl">
        {sent && (
          <p className="text-[14px] text-[#2B7056] bg-[#EAF3E8] border border-[#BDDBBD] rounded-lg px-3 py-2 mb-4">{t("feedback_thanks")}</p>
        )}
        {failed && (
          <p className="text-[14px] text-[#A24B3A] bg-[#F7EAE6] border border-[#EBCFC6] rounded-lg px-3 py-2 mb-4">{t("feedback_error")}</p>
        )}
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-[14px] text-[#8A8371]">{t("feedback_category")}</label>
          <div className="flex gap-2">
            {CATS.map((c) => (
              <button key={c.key} onClick={() => setCat(c.key)}
                className={`text-[14px] px-3 py-1 rounded-full border transition ${cat === c.key ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1 mb-4">
          <label className="text-[14px] text-[#8A8371]">{t("feedback_message")}</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={t("feedback_message_ph")}
            className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D] resize-none" />
        </div>
        <div className="flex flex-col gap-1 mb-5">
          <label className="text-[14px] text-[#8A8371]">{t("feedback_email")}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="rounded-lg border border-[#E4DFCF] px-3 py-2 text-[14px] outline-none focus:border-[#8DC48D]" />
        </div>
        <button onClick={submit} disabled={sending || !message.trim()}
          className="rounded-full bg-[#2B7056] text-white text-[14px] px-5 py-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#1B4A38] transition">
          {sending ? t("feedback_sending") : t("feedback_submit")}
        </button>
      </section>
    </div>
  );
}

/* ================= SETTINGS TAB ================= */
function SettingsTab({ lang, setLang, userEmail, nickname, isGuest, onGoToAuth, onLogout, onSetNickname, records, setRecords }) {
  const t = (k) => STR[lang][k] ?? k;
  const [editingNick, setEditingNick] = useState(false);
  const [nickDraft, setNickDraft] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(records, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "matcha-log-export.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (Array.isArray(parsed)) {
          setRecords((rs) => {
            const existingIds = new Set(rs.map((r) => r.id));
            const incoming = parsed.map((r, i) => (existingIds.has(r.id) ? { ...r, id: Date.now() + i } : r));
            return [...incoming, ...rs];
          });
        }
      } catch (err) {
        /* ignore invalid file */
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div>
      <header className="pt-[25px] pb-6">
        <h1 className="font-display text-2xl md:text-3xl text-[#1B4A38] font-700">{t("settings_title")}</h1>
        <div className="mt-5 h-px w-full bg-gradient-to-r from-[#8DC48D] via-[#E4DFCF] to-transparent" />
      </header>

      <section className="rounded-3xl border border-[#E4DFCF] bg-white/70 p-6 max-w-xl mb-6">
        <h2 className="font-display text-[17px] text-[#1B4A38] mb-3">{t("settings_account")}</h2>
        {isGuest ? (
          <>
            <p className="text-[14px] text-[#6B6558] mb-4">{t("settings_guest_hint")}</p>
            {editingNick ? (
              <div className="flex flex-col gap-3">
                <label className="text-[17px] text-[#8A8371]">{t("settings_nick_label")}</label>
                <input value={nickDraft} onChange={(e) => setNickDraft(e.target.value)} placeholder="例：抹茶拿鐵愛好者" autoFocus
                  className="rounded-lg border border-[#E4DFCF] px-3 py-2.5 text-[14px] outline-none focus:border-[#8DC48D] focus:ring-2 focus:ring-[#BDDBBD] transition" />
                <div className="flex gap-2">
                  <button onClick={() => { onSetNickname(nickDraft.trim() || "訪客"); setEditingNick(false); }} className="btn-brown text-[14px] px-5 py-1.5 rounded-full border">{t("settings_nick_save")}</button>
                  <button onClick={() => setEditingNick(false)} className="text-[14px] px-5 py-1.5 rounded-full border">{t("add_cancel")}</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-[17px] text-[#1B4A38] font-medium mb-4">{nickname || "訪客"}</p>
                <button onClick={() => { setNickDraft(nickname || ""); setEditingNick(true); }} className="text-[14px] px-5 py-2 rounded-full border">
                  {t("settings_login_btn")}
                </button>
              </>
            )}
          </>
        ) : (
          <>
            {nickname && <p className="text-[14px] text-[#1B4A38] font-medium">{nickname}</p>}
            <p className="text-[14px] text-[#2E2A24] mb-4">{userEmail}</p>
            <button onClick={onLogout} className="text-[14px] px-4 py-1.5 rounded-full border border-[#E4DFCF] text-[#A24B3A] hover:border-[#A24B3A] transition">{t("settings_logout")}</button>
          </>
        )}
      </section>

      <section className="rounded-3xl border border-[#E4DFCF] bg-white/70 p-6 max-w-xl">
        <h2 className="font-display text-[17px] text-[#1B4A38] mb-3">{t("settings_language")}</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setLang("zh")}
            className={`text-[14px] px-4 py-1.5 rounded-full border transition ${lang === "zh" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
            繁體中文
          </button>
          <button onClick={() => setLang("en")}
            className={`text-[14px] px-4 py-1.5 rounded-full border transition ${lang === "en" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
            English
          </button>
          <button onClick={() => setLang("ja")}
            className={`text-[14px] px-4 py-1.5 rounded-full border transition ${lang === "ja" ? "btn-brown" : "border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D]"}`}>
            日本語
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-[#E4DFCF] bg-white/70 p-6 max-w-xl mt-6">
        <h2 className="font-display text-[17px] text-[#1B4A38] mb-3">{t("settings_data")}</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <button onClick={exportData}
            className="text-[14px] px-4 py-1.5 rounded-full border border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D] transition">
            {t("settings_export")}
          </button>
          <label className="text-[14px] px-4 py-1.5 rounded-full border border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D] transition cursor-pointer">
            <input type="file" accept=".json,application/json" onChange={importData} className="hidden" />
            {t("settings_import")}
          </label>
        </div>

        {!confirmClear ? (
          <button onClick={() => setConfirmClear(true)}
            className="btn-danger text-[14px] px-4 py-1 rounded-full border transition hover:bg-[#F7EAE6]">
            {t("settings_clear")}
          </button>
        ) : (
          <div className="rounded-lg bg-[#F7EAE6] border border-[#EBCFC6] p-3">
            <p className="text-[14px] text-[#BA0F0F] mb-3">{t("settings_clear_confirm")}</p>
            <div className="flex gap-2">
              <button
                onClick={() => { setRecords([]); setConfirmClear(false); }}
                className="btn-danger text-[14px] px-4 py-1 rounded-full border transition hover:bg-[#F7EAE6]"
              >
                {t("settings_clear_yes")}
              </button>
              <button onClick={() => setConfirmClear(false)} className="text-[14px] px-4 py-1 rounded-full border border-[#E4DFCF] text-[#6B6558] hover:border-[#8DC48D] transition">
                {t("add_cancel")}
              </button>
            </div>
          </div>
        )}
      </section>

    </div>
  );
}

/* ================= MAIN APP (bottom nav host) ================= */
function MatchaApp({ lang, setLang, records, setRecords, visits, setVisits, userEmail, nickname, isGuest, onGoToAuth, onLogout, onSetNickname }) {
  const t = (k) => STR[lang][k] ?? k;
  const [tab, setTab] = useState("home");
  const [screen, setScreen] = useState("main"); // "main" | "form"
  const [editingRecord, setEditingRecord] = useState(null);

  const openAdd = () => { setEditingRecord(null); setScreen("form"); };
  const openEdit = (r) => { setEditingRecord(r); setScreen("form"); };
  const closeForm = () => { setEditingRecord(null); setScreen("main"); };

  const saveRecord = (recIn, stay) => {
    // remember when a record was starred, so Home can show the most recently starred ones
    const prev = records.find((r) => r.id === recIn.id);
    const rec = { ...recIn, favoriteAt: recIn.favorite ? (prev && prev.favorite ? (prev.favoriteAt || 0) : Date.now()) : null };
    setRecords((rs) => (rs.some((r) => r.id === rec.id) ? rs.map((r) => (r.id === rec.id ? rec : r)) : [rec, ...rs]));
    if (stay) { setEditingRecord(rec); return; }
    setEditingRecord(null);
    setScreen("main");
  };
  const deleteRecord = (id) => setRecords((rs) => rs.filter((r) => r.id !== id));
  const updateRecord = (id, patch) => setRecords((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const logUsage = (id, entry) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return null;
    const updated = applyAutoFinish({ ...rec, usageLog: [...(rec.usageLog || []), { id: Date.now(), ...entry }] }, computeRemaining(rec) <= 0);
    setRecords((rs) => rs.map((r) => (r.id === id ? updated : r)));
    return updated;
  };
  const updateUsageEntry = (id, entryId, patch) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return null;
    const updated = applyAutoFinish({ ...rec, usageLog: (rec.usageLog || []).map((u) => (u.id === entryId ? { ...u, ...patch } : u)) }, computeRemaining(rec) <= 0);
    setRecords((rs) => rs.map((r) => (r.id === id ? updated : r)));
    return updated;
  };
  const deleteUsageEntry = (id, entryId) => {
    const rec = records.find((r) => r.id === id);
    if (!rec) return null;
    const updated = applyAutoFinish({ ...rec, usageLog: (rec.usageLog || []).filter((u) => u.id !== entryId) }, computeRemaining(rec) <= 0);
    setRecords((rs) => rs.map((r) => (r.id === id ? updated : r)));
    return updated;
  };

  if (screen === "form" && editingRecord) {
    return (
      <AddRecordScreen
        lang={lang} onCancel={closeForm} onSave={saveRecord} onDelete={deleteRecord} initialRecord={editingRecord}
        onLogUsage={logUsage} onUpdateUsage={updateUsageEntry} onDeleteUsage={deleteUsageEntry}
      />
    );
  }

  const TABS = [
    { key: "home", icon: "home", label: t("nav_home") },
    { key: "records", icon: "records", label: t("nav_records") },
    { key: "expiry", icon: "expiry", label: t("nav_expiry") },
    { key: "stats", icon: "stats", label: t("nav_stats") },
    { key: "visit", icon: "visit", label: t("nav_visit") },
    { key: "feedback", icon: "feedback", label: t("nav_feedback") },
    { key: "settings", icon: "settings", label: t("nav_settings") },
  ];

  return (
    <div className="min-h-screen w-full bg-[#E0E6DA] font-body text-[#2E2A24] content-safe-pb">
      {FONT_STYLE}
      <main className="max-w-3xl mx-auto px-6">
        {tab === "home" && (
          <HomeTab lang={lang} records={records} userEmail={userEmail} nickname={nickname} isGuest={isGuest}
            onAdd={openAdd} onGoRecords={() => setTab("records")} />
        )}
        {tab === "records" && (
          <RecordsTab lang={lang} records={records} onAdd={openAdd} onEdit={openEdit} onDelete={deleteRecord} />
        )}
        {tab === "expiry" && <ExpiryTab lang={lang} records={records} onUpdate={updateRecord} />}
        {tab === "stats" && <StatsTab lang={lang} records={records} />}
        {tab === "visit" && <TeaVisitTab lang={lang} visits={visits} setVisits={setVisits} />}
        {tab === "feedback" && <FeedbackTab lang={lang} />}
        {tab === "settings" && (
          <SettingsTab lang={lang} setLang={setLang} userEmail={userEmail} nickname={nickname} isGuest={isGuest} onGoToAuth={onGoToAuth} onLogout={onLogout} onSetNickname={onSetNickname} records={records} setRecords={setRecords} />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur z-10 nav-safe-pb">
        <div className="max-w-3xl mx-auto grid grid-cols-7">
          {TABS.map((tb) => (
            <button key={tb.key} onClick={() => setTab(tb.key)} className="btn-nav flex flex-col items-center gap-0.5 py-2.5">
              <NavIcon name={tb.icon} active={tab === tb.key} />
              <span className={`text-[11px] whitespace-nowrap ${tab === tb.key ? "text-[#2B7056] font-medium" : "text-[#9C9484]"}`}>{tb.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {screen === "form" && !editingRecord && (
        <AddRecordScreen
          lang={lang} onCancel={closeForm} onSave={saveRecord} onDelete={deleteRecord} initialRecord={null}
          onLogUsage={logUsage} onUpdateUsage={updateUsageEntry} onDeleteUsage={deleteUsageEntry}
        />
      )}
    </div>
  );
}

/* ================= ROOT ================= */
export default function App() {
  const STORAGE_KEY = "matchaLogState";
  const loadSaved = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  };
  const saved = loadSaved();
  if (saved && Array.isArray(saved.records)) {
    saved.records = saved.records.map((r) => (r && Array.isArray(r.occasions) ? { ...r, occasions: r.occasions.filter((o) => o !== "甜點") } : r));
  }

  // iOS ignores user-scalable=no, so block pinch gestures explicitly to keep the page at 100%
  useEffect(() => {
    const stop = (e) => e.preventDefault();
    document.addEventListener("gesturestart", stop);
    document.addEventListener("gesturechange", stop);
    return () => { document.removeEventListener("gesturestart", stop); document.removeEventListener("gesturechange", stop); };
  }, []);

  const [lang, setLang] = useState(saved && saved.lang && STR[saved.lang] ? saved.lang : "zh");
  const [records, setRecords] = useState(saved && saved.records ? saved.records : seedData);
  const [visits, setVisits] = useState(saved && Array.isArray(saved.visits) ? saved.visits : []);
  const [userEmail, setUserEmail] = useState(saved && saved.userEmail !== undefined ? saved.userEmail : null);
  const [nickname, setNickname] = useState(saved && saved.nickname ? saved.nickname : "");
  const [isGuest, setIsGuest] = useState(saved && saved.isGuest ? saved.isGuest : false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lang, records, visits, userEmail, nickname, isGuest }));
    } catch (e) {
      // localStorage unavailable (e.g. private browsing) - fail silently
    }
  }, [lang, records, visits, userEmail, nickname, isGuest]);

  const handleSignup = (email, nick) => { setUserEmail(email); setNickname(nick || ""); setIsGuest(false); };
  const handleLogin = (email) => { setUserEmail(email); setIsGuest(false); };
  const handleGuest = () => { setIsGuest(true); setUserEmail(null); setNickname(""); };
  const handleLogout = () => { setUserEmail(null); setNickname(""); setIsGuest(false); };
  const handleGoToAuth = () => { setIsGuest(false); setUserEmail(null); setNickname(""); };

  if (!userEmail && !isGuest) {
    return <AuthScreen lang={lang} setLang={setLang} onEnter={(nick) => { setIsGuest(true); setUserEmail(null); setNickname(nick); }} />;
  }

  return (
    <MatchaApp
      lang={lang} setLang={setLang}
      records={records} setRecords={setRecords}
      visits={visits} setVisits={setVisits}
      userEmail={userEmail} nickname={nickname} isGuest={isGuest}
      onGoToAuth={handleGoToAuth} onLogout={handleLogout} onSetNickname={setNickname}
    />
  );
}
