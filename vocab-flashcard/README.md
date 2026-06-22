# Chinese Vocabulary Flashcards v1.2

Package name: chinese-vocabulary-flashcards-v1.2

## Version 1.2 updates
- Scaled down the flashcard practice screen so the full page fits better at normal browser zoom on student laptops.
- Removed the larger "Practise your vocabulary" heading from the flashcard screen.
- The flashcard screen now uses "Chinese Vocabulary Flashcards" as the main title.
- Changed revealed pinyin colour to match the English answer colour.
- Kept Hanzi unbolded with `font-weight: 400`.
- Kept all images and icons inside the `images/` folder.

## App features
- Students choose year level, unit topic, and one or multiple vocabulary lists.
- Vocabulary lists must come from one selected unit topic.
- Topics with no vocabulary lists still appear but are greyed out.
- Flashcards show Hanzi by default.
- Pinyin and English are revealed separately.
- After a reveal button is clicked, the button disappears and the answer is shown.
- Students can move to previous/next cards, shuffle cards, restart the selected set, or return to setup.
- Light blue visual style inspired by the Chinese Vocab Challenge app.
- Responsive layout for student laptops and mobile devices.
- Footer copyright: © 2026 Mr Peiran Wen. All rights reserved.

## Files included
chinese-vocabulary-flashcards-v1.2/
├── index.html
├── flashcards-style.css
├── flashcards-script.js
├── vocabulary-data.js
├── site.webmanifest
├── images/
│   ├── logo.png
│   ├── favicon.ico
│   ├── apple-touch-icon.png
│   ├── icon-16.png
│   ├── icon-32.png
│   ├── icon-48.png
│   ├── icon-192.png
│   └── icon-512.png
└── README.md

## How to update vocabulary
Open `vocabulary-data.js` and edit the data inside:

```js
window.CHINESE_VOCAB_DATA = {
  ...
};
```

Keep the same structure:

```text
years > topics > lists > words
```
