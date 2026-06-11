// Vocab data for Chinese Vocab Challenge
// Rule: pinyin must be lower case with tone marks and spaced between syllables.
// Example: 再见 => zài jiàn
// Format: { hanzi: '汉字', pinyin: 'pīn yīn', english: 'meaning' }
// Multiple accepted English meanings:
//   - Use | to separate answers, e.g. 'yes|correct'
//   - Answers are case-insensitive in the app.

const vocabData = [
  // ===== Core classroom words (including single-character words) =====
  { hanzi: '这', pinyin: 'zhè', english: 'this' },
  { hanzi: '是', pinyin: 'shì', english: 'be' },
  { hanzi: '家', pinyin: 'jiā', english: 'home|house|family' },
  { hanzi: '有', pinyin: 'yǒu', english: 'have|to have|has' },
  { hanzi: '两', pinyin: 'liǎng', english: 'two|two (quantity)' },
  { hanzi: '间', pinyin: 'jiān', english: 'measure word for rooms|room measure word|measure word' },
  { hanzi: '个', pinyin: 'gè', english: 'general measure word|measure word|generic measure word' },
  { hanzi: '卧室', pinyin: 'wò shì', english: 'bedroom' },
  { hanzi: '书房', pinyin: 'shū fáng', english: 'study|study room' },
  { hanzi: '客厅', pinyin: 'kè tīng', english: 'living room|lounge room' },
  { hanzi: '餐厅', pinyin: 'cān tīng', english: 'dining room|restaurant' },
  { hanzi: '厨房', pinyin: 'chú fáng', english: 'kitchen' },
  { hanzi: '和', pinyin: 'hé', english: 'and' },
  { hanzi: '浴室', pinyin: 'yù shì', english: 'bathroom|shower|shower room' },
  { hanzi: '房间', pinyin: 'fáng jiān', english: 'room' },
  { hanzi: '太', pinyin: 'tài', english: 'too|too much' },
  { hanzi: '大', pinyin: 'dà', english: 'big|large' },

  // ===== Words / phrases students are tested on (not individual characters) =====
  { hanzi: '你们', pinyin: 'nǐ men', english: 'you (plural)|you all|you' },
  { hanzi: '搬家', pinyin: 'bān jiā', english: 'to move house|move house|move home' },
  { hanzi: '了', pinyin: 'le', english: 'completed action particle|particle|-ed' },
  { hanzi: '对', pinyin: 'duì', english: 'yes|correct' },
  { hanzi: '我们', pinyin: 'wǒ men', english: 'we|us' },
  { hanzi: '上个', pinyin: 'shàng gè', english: 'last|previous|last time' },
  { hanzi: '周末', pinyin: 'zhōu mò', english: 'weekend' },
  { hanzi: '搬到', pinyin: 'bān dào', english: 'move to|to move to' },
  { hanzi: '哪儿', pinyin: 'nǎr', english: 'where' },
  { hanzi: '进', pinyin: 'jìn', english: 'enter|to enter|into' },
  { hanzi: '幢', pinyin: 'zhuàng', english: 'building measure word|measure word for buildings' },
  { hanzi: '楼房', pinyin: 'lóu fáng', english: 'building|high-rise building|apartment building' },
  { hanzi: '那', pinyin: 'nà', english: 'that' },
  { hanzi: '一共', pinyin: 'yí gòng', english: 'in total|altogether|total|totally' },
  { hanzi: '多少', pinyin: 'duō shǎo', english: 'how many|how much|what number' },
  { hanzi: '层', pinyin: 'céng', english: 'floor|storey|layer' },
  { hanzi: '新家', pinyin: 'xīn jiā', english: 'new home|new house|new family' },
  { hanzi: '在', pinyin: 'zài', english: 'located at|at|in|in/at|on' },
  { hanzi: '几', pinyin: 'jǐ', english: 'how many|how much' },
  { hanzi: '楼', pinyin: 'lóu', english: 'floor|storey' },
  { hanzi: '还', pinyin: 'hái', english: 'also|still' },
  { hanzi: '喜欢', pinyin: 'xǐ huan', english: 'to like|like' },
  { hanzi: '很', pinyin: 'hěn', english: 'very' }
];
