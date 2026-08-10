// Pinyin and English notes are on by default for Chinese reading.
const screens = document.querySelectorAll('.screen');
const state = { mode: 'en', selectedId: 'mooncakes', pinyin: true, notes: true, largeText: false };

function showScreen(id) {
  screens.forEach(function (screen) { screen.classList.toggle('active', screen.id === id); });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function currentCollection() { return articles[state.mode]; }
function currentArticle() { return currentCollection().find(function (article) { return article.id === state.selectedId; }); }

// Counts are calculated from the actual article, so the label stays correct after edits.
function wordCount(article) {
  return article.paragraphs.join(' ').trim().split(/\s+/).filter(Boolean).length;
}
function characterCount(article) {
  return article.sentences.map(function (sentence) { return sentence.hanzi; }).join('').match(/[\u3400-\u9fff]/g).length;
}
function lengthLabel(article) {
  return state.mode === 'en' ? wordCount(article) + ' words' : characterCount(article) + ' characters';
}
function bookHtml(article) {
  return '<button class="book-card book-' + article.colour + '" type="button" data-article-id="' + article.id + '">' +
    '<span class="book-spine"></span><span class="book-cover-icon">' + article.emoji + '</span>' +
    '<span class="book-title ' + (state.mode === 'zh' ? 'hanzi' : '') + '">' + article.title + '</span>' +
    '<span class="book-meta"><span>' + article.category + '</span><span>' + lengthLabel(article) + '</span></span>' +
    '<span class="open-label">OPEN BOOK</span></button>';
}
function shelfRowHtml(row) { return '<div class="shelf-row">' + row.map(bookHtml).join('') + '</div>'; }
function updateShelf() {
  document.querySelector('#shelfTitle').textContent = state.mode === 'en' ? 'English Bookshelf' : 'Chinese Bookshelf';
  document.querySelector('#shelfSubtitle').textContent = state.mode === 'en' ? 'Choose from ten extended reads about Chinese culture.' : 'Choose a Chinese text with pinyin and English notes.';
  const collection = currentCollection();
  const rows = [];
  for (let index = 0; index < collection.length; index += 5) rows.push(collection.slice(index, index + 5));
  document.querySelector('#bookshelf').innerHTML = rows.map(shelfRowHtml).join('');
  document.querySelectorAll('[data-article-id]').forEach(function (book) {
    book.addEventListener('click', function () { state.selectedId = book.dataset.articleId; updateReader(); showScreen('readerScreen'); });
  });
}
function sentenceHtml(sentence) {
  return '<div class="sentence-block"><p class="pinyin-line">' + sentence.pinyin + '</p><p class="hanzi-line hanzi">' + sentence.hanzi + '</p><p class="translation-line">' + sentence.note + '</p></div>';
}
function updateReader() {
  const article = currentArticle();
  document.querySelector('#articleEmoji').textContent = article.emoji;
  document.querySelector('#articleCategory').textContent = article.category.toUpperCase() + ' · ' + lengthLabel(article).toUpperCase();
  document.querySelector('#articleTitle').textContent = article.title;
  document.querySelector('#articleTitle').classList.toggle('hanzi', state.mode === 'zh');
  document.querySelector('#articleSummary').textContent = article.summary;
  document.querySelector('#articleBody').innerHTML = state.mode === 'en' ? article.paragraphs.map(function (paragraph) { return '<p>' + paragraph + '</p>'; }).join('') : article.sentences.map(sentenceHtml).join('');
  document.querySelector('#cultureNote').innerHTML = '<h3>✦ ' + (state.mode === 'en' ? 'Chinese Words to Discover' : 'Key Words') + '</h3><div class="word-list">' + article.words.map(function (word) { return '<div class="word-chip"><b class="hanzi">' + word.hanzi + '</b><span class="pinyin">' + word.pinyin + '</span><small>' + word.meaning + '</small></div>'; }).join('') + '</div>';
  document.querySelector('#readerTools').classList.toggle('english-tools', state.mode === 'en');
  applyTools();
}
function applyTools() {
  document.body.classList.toggle('show-pinyin', state.pinyin);
  document.body.classList.toggle('show-notes', state.notes);
  document.querySelector('#pinyinToggle').classList.toggle('selected', state.pinyin);
  document.querySelector('#notesToggle').classList.toggle('selected', state.notes);
  document.querySelector('#pinyinToggle').setAttribute('aria-pressed', String(state.pinyin));
  document.querySelector('#notesToggle').setAttribute('aria-pressed', String(state.notes));
  document.querySelector('#articleContainer').classList.toggle('large-text', state.largeText);
}

document.querySelectorAll('[data-mode]').forEach(function (button) {
  button.addEventListener('click', function () { state.mode = button.dataset.mode; state.selectedId = currentCollection()[0].id; updateShelf(); showScreen('shelfScreen'); });
});
document.querySelectorAll('[data-back]').forEach(function (button) {
  button.addEventListener('click', function () { showScreen(button.dataset.back === 'welcome' ? 'welcomeScreen' : 'shelfScreen'); });
});
document.querySelector('#homeButton').addEventListener('click', function () { showScreen('welcomeScreen'); });
document.querySelector('#pinyinToggle').addEventListener('click', function () { state.pinyin = !state.pinyin; applyTools(); });
document.querySelector('#notesToggle').addEventListener('click', function () { state.notes = !state.notes; applyTools(); });
document.querySelector('#fontButton').addEventListener('click', function () { state.largeText = !state.largeText; applyTools(); document.querySelector('#fontButton').textContent = state.largeText ? 'A−' : 'A+'; });
