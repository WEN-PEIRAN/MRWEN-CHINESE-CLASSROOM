// Chinese Vocab Challenge (Typing Test) — with Timer + Start Screen
// ------------------------------------------------------------
// Timer rules:
// - 10 seconds per word
// - Total time = vocabData.length * 10 seconds
// - If time runs out (per-word OR total), game is over and must restart.
//
// This updated version:
// ✅ DOES NOT start the timer on page load
// ✅ Shows a start screen first (if startModal + startBtn exist)
// ✅ Starts the game only when Start is clicked

// ====== Grab UI elements ======
const hanziEl = document.getElementById('hanzi');
const pinyinEl = document.getElementById('pinyin');
const togglePinyinBtn = document.getElementById('togglePinyinBtn');
const formEl = document.getElementById('answerForm');
const inputEl = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const nextBtn = document.getElementById('nextBtn');
const restartBtn = document.getElementById('restartBtn');
const feedbackEl = document.getElementById('feedback');
const correctCountEl = document.getElementById('correctCount');
const wordIndexEl = document.getElementById('wordIndex');
const wordTotalEl = document.getElementById('wordTotal');

// Timer UI
const totalTimeEl = document.getElementById('totalTime');
const wordTimeEl = document.getElementById('wordTime');

// Start modal UI (optional but recommended)
const startModalEl = document.getElementById('startModal');
const startBtnEl = document.getElementById('startBtn');

// ====== One easy setting (change this anytime) ======
const SECONDS_PER_WORD = 10;

// ====== Game state ======
const state = {
  order: [],
  index: 0,
  correctTotal: 0,
  gameOver: true,          // start locked until student clicks Start
  waitingForNext: false,

  // Timer state
  timerId: null,
  totalSecondsRemaining: 0,
  wordSecondsRemaining: SECONDS_PER_WORD,
  secondsPerWord: SECONDS_PER_WORD
};

// ====== Helpers ======
function normalise(text) {
  // Trim, collapse multiple spaces, lower-case.
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function getAcceptedAnswers(item) {
  // Allow multiple correct answers using | in english.
  const raw = Array.isArray(item.english) ? item.english : String(item.english).split('|');
  return raw.map(normalise).filter(Boolean);
}

function shuffle(array) {
  // Fisher–Yates shuffle
  const a = array.slice();
  for (var i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = a[i];
    a[i] = a[j];
    a[j] = temp;
  }
  return a;
}

function setFeedback(message, kind) {
  feedbackEl.textContent = message;
  feedbackEl.className = 'feedback' + (kind ? ' ' + kind : '');
}

function revealPinyin(show) {
  if (show) {
    pinyinEl.hidden = false;
    togglePinyinBtn.textContent = 'Hide pinyin';
  } else {
    pinyinEl.hidden = true;
    togglePinyinBtn.textContent = 'Reveal pinyin';
  }
}

function formatMMSS(totalSeconds) {
  const s = Math.max(0, Number(totalSeconds) || 0);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return mm + ':' + ss;
}

function updateTimerUI() {
  totalTimeEl.textContent = formatMMSS(state.totalSecondsRemaining);
  wordTimeEl.textContent = String(Math.max(0, state.wordSecondsRemaining));
}

function clearTimer() {
  if (state.timerId) {
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function startTimer() {
  clearTimer();
  updateTimerUI();

  state.timerId = setInterval(function () {
    if (state.gameOver) return;

    // Total time always counts down
    state.totalSecondsRemaining -= 1;

    // Word timer counts down only while the student is answering
    // (i.e. not after correct when waiting for Next)
    if (!state.waitingForNext) {
      state.wordSecondsRemaining -= 1;
    }

    updateTimerUI();

    // Time out conditions
    if (state.totalSecondsRemaining <= 0) {
      timeUp('Time is up ⏰  Total time limit reached.');
      return;
    }
    if (!state.waitingForNext && state.wordSecondsRemaining <= 0) {
      timeUp('Time is up ⏰  You ran out of time for this word.');
      return;
    }
  }, 1000);
}

function timeUp(message) {
  // Game over: must restart
  state.gameOver = true;
  state.waitingForNext = false;

  inputEl.disabled = true;
  submitBtn.disabled = true;
  nextBtn.hidden = true;

  restartBtn.hidden = false;
  restartBtn.textContent = 'Restart';

  setFeedback(message + ' Press Restart to try again.', 'bad');
  clearTimer();
}

// ====== Core game functions ======
function currentItem() {
  const idx = state.order[state.index];
  return vocabData[idx];
}

function render() {
  const item = currentItem();

  // Show ONLY Hanzi first.
  hanziEl.textContent = item.hanzi;

  // Pinyin hidden until revealed. Force lower-case display.
  pinyinEl.textContent = String(item.pinyin).toLowerCase();
  revealPinyin(false);

  // Reset per-word timer display (timer will only tick once started)
  state.wordSecondsRemaining = state.secondsPerWord;
  updateTimerUI();

  // Reset input + buttons + feedback
  inputEl.value = '';
  inputEl.disabled = false;

  submitBtn.disabled = false;
  nextBtn.hidden = true;

  restartBtn.hidden = true;

  state.waitingForNext = false;
  setFeedback('', '');

  // Update status
  correctCountEl.textContent = String(state.correctTotal);
  wordIndexEl.textContent = String(state.index + 1);
  wordTotalEl.textContent = String(state.order.length);

  inputEl.focus();
}

function buildNewGameState() {
  // Create a new random order
  const indices = [];
  for (var i = 0; i < vocabData.length; i++) indices.push(i);

  state.order = shuffle(indices);
  state.index = 0;
  state.correctTotal = 0;

  // Timer reset: total = words * seconds-per-word
  state.secondsPerWord = SECONDS_PER_WORD;
  state.totalSecondsRemaining = state.order.length * state.secondsPerWord;
  state.wordSecondsRemaining = state.secondsPerWord;

  correctCountEl.textContent = '0';
  wordTotalEl.textContent = String(state.order.length);
  updateTimerUI();
}

function startNewGame() {
  // Called after Start button OR Restart button
  buildNewGameState();
  state.gameOver = false;
  render();
  startTimer();
}

function preparePreStartScreen() {
  // Show a calm "ready" screen without starting timers
  clearTimer();

  state.gameOver = true;
  state.waitingForNext = false;

  // Set timer display values (but do not count down)
  state.secondsPerWord = SECONDS_PER_WORD;
  state.totalSecondsRemaining = (Array.isArray(vocabData) ? vocabData.length : 0) * state.secondsPerWord;
  state.wordSecondsRemaining = state.secondsPerWord;
  updateTimerUI();

  // Clear the prompt area
  hanziEl.textContent = '—';
  pinyinEl.textContent = '—';
  revealPinyin(false);

  // Lock inputs until Start
  inputEl.value = '';
  inputEl.disabled = true;
  submitBtn.disabled = true;

  nextBtn.hidden = true;

  // Hide restart by default on the pre-start screen
  restartBtn.hidden = true;
  restartBtn.textContent = 'Restart';

  correctCountEl.textContent = '0';
  wordIndexEl.textContent = '0';
  wordTotalEl.textContent = String(Array.isArray(vocabData) ? vocabData.length : 0);

  setFeedback('Click Start Challenge to begin.', '');
}

function endGameWithFailure(item) {
  // Wrong answer -> reveal answer + pinyin, restart required
  revealPinyin(true);

  const accepted = getAcceptedAnswers(item);
  const shownAnswer = accepted.length ? accepted[0] : normalise(item.english);

  setFeedback('Not quite ❌  Answer: ' + shownAnswer, 'bad');

  inputEl.disabled = true;
  submitBtn.disabled = true;
  nextBtn.hidden = true;

  restartBtn.hidden = false;
  restartBtn.textContent = 'Restart';

  state.gameOver = true;
  state.waitingForNext = false;

  clearTimer();
}

function handleCorrect() {
  state.correctTotal += 1;
  correctCountEl.textContent = String(state.correctTotal);

  // Milestone message every 5
  if (state.correctTotal % 5 === 0 && state.correctTotal !== vocabData.length) {
    setFeedback('Congratulations! ✅ You have ' + state.correctTotal + ' correct so far — keep going!', 'good');
  } else {
    setFeedback('Correct ✅', 'good');
  }

  // Wait for NEXT click (message stays)
  inputEl.disabled = true;
  submitBtn.disabled = true;
  nextBtn.hidden = false;

  nextBtn.focus(); // So pressing Enter can move to the next word
  state.waitingForNext = true;

  // If last word, finish the game
  const lastIndex = state.order.length - 1;
  if (state.index >= lastIndex) {
    revealPinyin(true);
    setFeedback(
      'Amazing! 🎉 You completed all vocabulary challenges (' +
      state.correctTotal + '/' + state.order.length + ').',
      'good'
    );

    nextBtn.hidden = true;
    restartBtn.hidden = false;
    restartBtn.textContent = 'Restart';

    state.gameOver = true;
    state.waitingForNext = false;

    clearTimer();
  }
}

function goNext() {
  if (!state.waitingForNext) return;

  const lastIndex = state.order.length - 1;
  if (state.index >= lastIndex) return;

  state.index += 1;
  render();
}

// ====== Events ======
togglePinyinBtn.addEventListener('click', function () {
  const willShow = pinyinEl.hidden;
  revealPinyin(willShow);
});

formEl.addEventListener('submit', function (event) {
  event.preventDefault();

  if (state.gameOver) return;
  if (state.waitingForNext) return;

  const item = currentItem();
  const userAnswer = normalise(inputEl.value);
  const accepted = getAcceptedAnswers(item);

  const isCorrect = accepted.includes(userAnswer);

  if (isCorrect) {
    handleCorrect();
  } else {
    endGameWithFailure(item);
  }
});

nextBtn.addEventListener('click', function () {
  goNext();
});

// Enter key can also move to next word when Next is visible
document.addEventListener('keydown', function (event) {
  if (event.key !== 'Enter') return;
  if (state.waitingForNext && !nextBtn.hidden) {
    event.preventDefault();
    goNext();
  }
});

restartBtn.addEventListener('click', function () {
  startNewGame();
});

// ====== Start (NO auto-start!) ======
if (!Array.isArray(vocabData) || vocabData.length < 1) {
  setFeedback('No vocab data found. Check challenge-data.js is loaded before challenge-script.js.', 'bad');
} else {
  // Prepare the screen, then wait for a Start click
  preparePreStartScreen();

  // Preferred: show the start modal if it exists
  if (startModalEl && startBtnEl) {
    startModalEl.hidden = false;

    startBtnEl.addEventListener('click', function () {
      startModalEl.hidden = true;
      startNewGame();
    });
  } else {
    // Fallback: if modal is missing, show a Start button using Restart
    restartBtn.hidden = false;
    restartBtn.textContent = 'Start Challenge';
  }
}
