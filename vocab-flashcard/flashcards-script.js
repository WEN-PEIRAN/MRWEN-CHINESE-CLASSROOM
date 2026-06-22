const $ = id => document.getElementById(id);

const els = {
  setupScreen: $('setupScreen'),
  flashcardScreen: $('flashcardScreen'),
  yearButtons: $('yearButtons'),
  topicButtons: $('topicButtons'),
  listButtons: $('listButtons'),
  topicSection: $('topicSection'),
  listSection: $('listSection'),
  setupSummary: $('setupSummary'),
  startFlashcardsBtn: $('startFlashcardsBtn'),
  dataStatus: $('dataStatus'),
  flashcardMeta: $('flashcardMeta'),
  progressBar: $('progressBar'),
  progressText: $('progressText'),
  cardNumber: $('cardNumber'),
  listBadge: $('listBadge'),
  cardContent: $('cardContent'),
  hanziDisplay: $('hanziDisplay'),
  pinyinDisplay: $('pinyinDisplay'),
  englishDisplay: $('englishDisplay'),
  revealPinyinBtn: $('revealPinyinBtn'),
  revealEnglishBtn: $('revealEnglishBtn'),
  prevBtn: $('prevBtn'),
  nextBtn: $('nextBtn'),
  shuffleBtn: $('shuffleBtn'),
  restartBtn: $('restartBtn'),
  backToSetupBtn: $('backToSetupBtn')
};

const state = {
  data: null,
  selection: { yearId: '', topicId: '', listIds: [] },
  originalCards: [],
  activeCards: [],
  index: 0,
  isShuffled: false,
  isAnimating: false
};

function normalise(text) {
  return String(text || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function primaryAnswer(item) {
  return String(item.english || '').split('|').map(answer => answer.trim()).filter(Boolean)[0] || '';
}

function showScreen(screenName) {
  [els.setupScreen, els.flashcardScreen].forEach(screen => screen.classList.remove('screen-active'));
  els[screenName].classList.add('screen-active');
}

function loadData() {
  try {
    if (!window.CHINESE_VOCAB_DATA || !Array.isArray(window.CHINESE_VOCAB_DATA.years)) {
      throw new Error('vocabulary-data.js did not provide valid data');
    }
    state.data = window.CHINESE_VOCAB_DATA;
    renderSetup();
  } catch (error) {
    els.dataStatus.textContent = `Data could not be loaded. Check that vocabulary-data.js is in the same folder as index.html. (${error.message})`;
  }
}

function renderSetup() {
  renderYearButtons();
  updateSetupState();
}

function createChoiceButton({ title, subtitle = '', selected = false, multi = false, unavailable = false, onClick }) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'choice-btn';
  if (selected) button.classList.add(multi ? 'multi-selected' : 'selected');
  if (unavailable) button.classList.add('unavailable-topic');
  button.innerHTML = `<span class="choice-title">${title}</span>${subtitle ? `<span class="choice-subtitle">${subtitle}</span>` : ''}`;
  button.addEventListener('click', onClick);
  return button;
}

function hasPlayableLists(topic) {
  if (!topic || !Array.isArray(topic.lists)) return false;
  return topic.lists.some(list => Array.isArray(list.words) && list.words.length > 0);
}

function renderYearButtons() {
  els.yearButtons.innerHTML = '';
  state.data.years.forEach(year => {
    els.yearButtons.appendChild(createChoiceButton({
      title: year.name,
      selected: state.selection.yearId === year.id,
      onClick: () => {
        state.selection.yearId = year.id;
        state.selection.topicId = '';
        state.selection.listIds = [];
        renderYearButtons();
        renderTopicButtons();
        renderListButtons();
        updateSetupState();
      }
    }));
  });
}

function selectedYear() {
  return state.data?.years.find(year => year.id === state.selection.yearId);
}

function selectedTopic() {
  return selectedYear()?.topics.find(topic => topic.id === state.selection.topicId);
}

function selectedLists() {
  const topic = selectedTopic();
  if (!topic) return [];
  return topic.lists.filter(list => state.selection.listIds.includes(list.id));
}

function renderTopicButtons() {
  els.topicButtons.innerHTML = '';
  const year = selectedYear();
  if (!year) return;
  year.topics.forEach(topic => {
    const available = hasPlayableLists(topic);
    els.topicButtons.appendChild(createChoiceButton({
      title: topic.name,
      subtitle: available ? '' : 'No vocab lists yet',
      unavailable: !available,
      selected: state.selection.topicId === topic.id,
      onClick: () => {
        state.selection.topicId = topic.id;
        state.selection.listIds = [];
        renderTopicButtons();
        renderListButtons();
        updateSetupState();
      }
    }));
  });
}

function renderListButtons() {
  els.listButtons.innerHTML = '';
  const topic = selectedTopic();
  if (!topic) return;
  const playableLists = topic.lists.filter(list => Array.isArray(list.words) && list.words.length > 0);
  if (playableLists.length === 0) {
    const message = document.createElement('div');
    message.className = 'empty-list-message';
    message.textContent = 'There are no vocabulary lists available yet.';
    els.listButtons.appendChild(message);
    return;
  }
  playableLists.forEach(list => {
    const selected = state.selection.listIds.includes(list.id);
    els.listButtons.appendChild(createChoiceButton({
      title: list.name,
      subtitle: `${list.words.length} words`,
      selected,
      multi: true,
      onClick: () => {
        if (selected) {
          state.selection.listIds = state.selection.listIds.filter(id => id !== list.id);
        } else {
          state.selection.listIds.push(list.id);
        }
        renderListButtons();
        updateSetupState();
      }
    }));
  });
}

function updateSetupState() {
  els.topicSection.classList.toggle('disabled-section', !state.selection.yearId);
  els.listSection.classList.toggle('disabled-section', !state.selection.topicId);
  const year = selectedYear();
  const topic = selectedTopic();
  const lists = selectedLists();
  const wordCount = lists.reduce((sum, list) => sum + list.words.length, 0);
  const ready = Boolean(year && topic && lists.length > 0 && wordCount > 0);

  if (!year) {
    els.setupSummary.textContent = 'Choose a year level, topic and vocab list to begin.';
  } else if (!topic) {
    els.setupSummary.textContent = `${year.name} selected. Now choose a unit topic.`;
  } else if (!hasPlayableLists(topic)) {
    els.setupSummary.textContent = `${year.name} · ${topic.name}. There are no vocabulary lists available yet.`;
  } else if (lists.length === 0) {
    els.setupSummary.textContent = `${year.name} · ${topic.name}. Choose one or multiple vocab lists.`;
  } else {
    els.setupSummary.textContent = `${year.name} · ${topic.name} · ${lists.map(list => list.name).join(', ')} · ${wordCount} words`;
  }
  els.startFlashcardsBtn.disabled = !ready;
}

function buildFlashcards() {
  const combinedWords = selectedLists().flatMap(list => list.words.map(word => ({
    hanzi: word.hanzi,
    pinyin: word.pinyin,
    english: primaryAnswer(word),
    sourceList: list.name
  })));
  const uniqueWords = [];
  const seen = new Set();
  combinedWords.forEach(word => {
    const key = `${normalise(word.hanzi)}|${normalise(word.english)}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueWords.push(word);
    }
  });
  return uniqueWords;
}

function startFlashcards() {
  state.originalCards = buildFlashcards();
  state.activeCards = state.originalCards.slice();
  state.index = 0;
  state.isShuffled = false;
  updateFlashcardMeta();
  showScreen('flashcardScreen');
  renderCurrentCard();
}

function updateFlashcardMeta() {
  const year = selectedYear();
  const topic = selectedTopic();
  const lists = selectedLists();
  els.flashcardMeta.textContent = `${year.name} · ${topic.name} · ${lists.map(list => list.name).join(', ')}`;
}

function updateProgress() {
  const total = state.activeCards.length || 0;
  const current = total ? state.index + 1 : 0;
  const percent = total ? Math.round((current / total) * 100) : 0;
  els.progressBar.style.width = `${percent}%`;
  els.progressText.textContent = `${current}/${total}`;
}

function resetRevealAreas() {
  els.revealPinyinBtn.classList.remove('hidden-button');
  els.revealEnglishBtn.classList.remove('hidden-button');
  els.pinyinDisplay.classList.remove('visible');
  els.englishDisplay.classList.remove('visible');
}

function renderCurrentCard() {
  if (state.activeCards.length === 0) return;
  const card = state.activeCards[state.index];
  els.cardNumber.textContent = `Card ${state.index + 1} of ${state.activeCards.length}`;
  els.listBadge.textContent = state.isShuffled ? `${card.sourceList} · Shuffled` : card.sourceList;
  els.hanziDisplay.textContent = card.hanzi || '—';
  els.pinyinDisplay.textContent = String(card.pinyin || '').toLowerCase();
  els.englishDisplay.textContent = card.english || '—';
  resetRevealAreas();
  updateProgress();
}

function animateCardChange(direction, updateCard) {
  if (state.isAnimating) return;
  state.isAnimating = true;
  const outClass = direction === 'prev' ? 'slide-out-prev' : 'slide-out-next';
  const inClass = direction === 'prev' ? 'slide-in-prev' : 'slide-in-next';
  els.cardContent.classList.remove('slide-out-prev', 'slide-out-next', 'slide-in-prev', 'slide-in-next');
  els.cardContent.classList.add(outClass);
  window.setTimeout(() => {
    updateCard();
    els.cardContent.classList.remove(outClass);
    void els.cardContent.offsetWidth;
    els.cardContent.classList.add(inClass);
    window.setTimeout(() => {
      els.cardContent.classList.remove(inClass);
      state.isAnimating = false;
    }, 190);
  }, 140);
}

function nextCard() {
  if (state.activeCards.length === 0) return;
  animateCardChange('next', () => {
    state.index += 1;
    if (state.index >= state.activeCards.length) state.index = 0;
    renderCurrentCard();
  });
}

function previousCard() {
  if (state.activeCards.length === 0) return;
  animateCardChange('prev', () => {
    state.index -= 1;
    if (state.index < 0) state.index = state.activeCards.length - 1;
    renderCurrentCard();
  });
}

function shuffle(array) {
  const a = array.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleCards() {
  if (state.originalCards.length === 0) return;
  state.activeCards = shuffle(state.originalCards);
  state.index = 0;
  state.isShuffled = true;
  renderCurrentCard();
}

function restartSet() {
  if (state.originalCards.length === 0) return;
  state.activeCards = state.originalCards.slice();
  state.index = 0;
  state.isShuffled = false;
  renderCurrentCard();
}

function backToSetup() {
  showScreen('setupScreen');
}

els.startFlashcardsBtn.addEventListener('click', startFlashcards);
els.backToSetupBtn.addEventListener('click', backToSetup);
els.prevBtn.addEventListener('click', previousCard);
els.nextBtn.addEventListener('click', nextCard);
els.shuffleBtn.addEventListener('click', shuffleCards);
els.restartBtn.addEventListener('click', restartSet);

els.revealPinyinBtn.addEventListener('click', () => {
  els.revealPinyinBtn.classList.add('hidden-button');
  els.pinyinDisplay.classList.add('visible');
});

els.revealEnglishBtn.addEventListener('click', () => {
  els.revealEnglishBtn.classList.add('hidden-button');
  els.englishDisplay.classList.add('visible');
});

document.addEventListener('keydown', event => {
  if (!els.flashcardScreen.classList.contains('screen-active')) return;
  if (event.target && (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); nextCard(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); previousCard(); }
  if (event.key === 'p' || event.key === 'P') { event.preventDefault(); els.revealPinyinBtn.click(); }
  if (event.key === 'e' || event.key === 'E') { event.preventDefault(); els.revealEnglishBtn.click(); }
});

loadData();
