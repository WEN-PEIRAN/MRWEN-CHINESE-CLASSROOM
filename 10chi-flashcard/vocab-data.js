// Vocabulary list (edit this file to update the deck)

// ===== Separate vocabulary sets =====

const vocab1 = [
  { hanzi: "这", pinyin: "zhè", english: "this" },
  { hanzi: "是", pinyin: "shì", english: "be" },
  { hanzi: "家", pinyin: "jiā", english: "home" },
  { hanzi: "有", pinyin: "yǒu", english: "have" },
  { hanzi: "两", pinyin: "liǎng", english: "two (quantity)" },
  { hanzi: "间", pinyin: "jiān", english: "measure word for rooms" },
  { hanzi: "个", pinyin: "gè", english: "general measure word" },
  { hanzi: "卧室", pinyin: "wò shì", english: "bedroom" },
  { hanzi: "书房", pinyin: "shū fáng", english: "study" },
  { hanzi: "客厅", pinyin: "kè tīng", english: "living room" },
  { hanzi: "餐厅", pinyin: "cān tīng", english: "dining room" },
  { hanzi: "厨房", pinyin: "chú fáng", english: "kitchen" },
  { hanzi: "和", pinyin: "hé", english: "and" },
  { hanzi: "浴室", pinyin: "yù shì", english: "bathroom" },
  { hanzi: "房间", pinyin: "fáng jiān", english: "room" },
  { hanzi: "太", pinyin: "tài", english: "too" },
  { hanzi: "大", pinyin: "dà", english: "big" }
];

const vocab2 = [
  { hanzi: "你们", pinyin: "nǐ men", english: "you (plural)" },
  { hanzi: "搬家", pinyin: "bān jiā", english: "to move house" },
  { hanzi: "了", pinyin: "le", english: "completed action particle" },
  { hanzi: "对", pinyin: "duì", english: "yes; correct" },
  { hanzi: "我们", pinyin: "wǒ men", english: "we; us" },
  { hanzi: "上个", pinyin: "shàng gè", english: "last (time)" },
  { hanzi: "周末", pinyin: "zhōu mò", english: "weekend" },
  { hanzi: "搬到", pinyin: "bān dào", english: "move to" },
  { hanzi: "哪儿", pinyin: "nǎr", english: "where" },
  { hanzi: "进", pinyin: "jìn", english: "enter" },
  { hanzi: "幢", pinyin: "zhuàng", english: "building measure word" },
  { hanzi: "楼房", pinyin: "lóu fáng", english: "(high-rise) building" },
  { hanzi: "那", pinyin: "nà", english: "that" },
  { hanzi: "一共", pinyin: "yí gòng", english: "in total" },
  { hanzi: "多少", pinyin: "duō shǎo", english: "how many" },
  { hanzi: "层", pinyin: "céng", english: "floor/storey/layer" },
  { hanzi: "新家", pinyin: "xīn jiā", english: "new home" },
  { hanzi: "在", pinyin: "zài", english: "located at" },
  { hanzi: "几", pinyin: "jǐ", english: "how many" },
  { hanzi: "楼", pinyin: "lóu", english: "floor/storey" },
  { hanzi: "还", pinyin: "hái", english: "also; still" },
  { hanzi: "喜欢", pinyin: "xǐ huān", english: "to like" },
  { hanzi: "很", pinyin: "hěn", english: "very" }
];

const vocab3 = [
  { hanzi: "我们", pinyin: "wǒ men", english: "we / us" },
  { hanzi: "新家", pinyin: "xīn jiā", english: "new home" },
  { hanzi: "昨天", pinyin: "zuó tiān", english: "yesterday" },
  { hanzi: "搬进", pinyin: "bān jìn", english: "to move into" },
  { hanzi: "洋房", pinyin: "yáng fáng", english: "(western-style) house" },
  { hanzi: "外面", pinyin: "wài miàn", english: "outside" },
  { hanzi: "花园", pinyin: "huā yuán", english: "garden" },
  { hanzi: "车库", pinyin: "chē kù", english: "garage" },
  { hanzi: "游泳池", pinyin: "yóu yǒng chí", english: "swimming pool" },
  { hanzi: "房子", pinyin: "fáng zi", english: "house" },
  { hanzi: "前面", pinyin: "qián miàn", english: "in front" },
  { hanzi: "后面", pinyin: "hòu miàn", english: "behind" },
  { hanzi: "左边", pinyin: "zuǒ biān", english: "left side" },
  { hanzi: "右边", pinyin: "yòu biān", english: "right side" },
  { hanzi: "洗手间", pinyin: "xǐ shǒu jiān", english: "bathroom / toilet" },
  { hanzi: "客房", pinyin: "kè fáng", english: "guest room" },
  { hanzi: "时候", pinyin: "shí hòu", english: "time; when" },
  { hanzi: "祝好", pinyin: "zhù hǎo", english: "best wishes" }
];

// ===== Combined list (used by your current app) =====
// This keeps your tool working exactly as before
const vocabulary = [
  ...vocab1,
  ...vocab2,
  ...vocab3
];

// Make available globally
window.vocabulary = vocabulary;

// (Optional) expose sets for future features
window.vocabSets = {
  vocab1: vocab1,
  vocab2: vocab2,
  vocab3: vocab3
};