## Chinese Vocabulary Flashcards v1.3

Package name: chinese-vocabulary-flashcards-v1.3

### Version 1.3 updates
- Replaced the vocabulary data with the shared vocabulary structure from the companion app.
- Added populated vocabulary lists for Year 7 Greetings, Introducing Names, and Chinese Numbers & Age.
- Updated Year 8 My Family vocabulary lists.
- Added six Year 9 Appearances vocabulary lists.
- Updated Year 10 My Home vocabulary.
- Added `Version 1.3` beside the footer credit.
- Preserved the existing flashcard design, reveal controls, navigation, shuffle, restart, responsive layout, and normal-weight Hanzi.

### App features
- Students choose a year level, unit topic, and one or multiple vocabulary lists.
- Vocabulary lists must come from one selected unit topic.
- Topics with no vocabulary lists still appear but are greyed out.
- Flashcards show Hanzi by default.
- Pinyin and English are revealed separately.
- Students can move to previous or next cards, shuffle cards, restart the selected set, or return to setup.
- Responsive layout for student laptops and mobile devices.

### Files included

- `index.html`
- `flashcards-style.css`
- `flashcards-script.js`
- `vocabulary-data.js`
- `site.webmanifest`
- `images/` containing the logo, favicon, touch icon, and app icons
- `README.md`

### How to update vocabulary

Open `vocabulary-data.js` and edit the data inside `window.CHINESE_VOCAB_DATA`.
Keep the same structure: years > topics > lists > words.
