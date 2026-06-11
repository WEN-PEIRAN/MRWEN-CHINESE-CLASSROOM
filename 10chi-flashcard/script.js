// Flashcard app logic
// Vocabulary is stored in vocab-data.js as `vocabulary`

var shuffledVocabulary = [];
var currentIndex = 0;

// Grab elements (const is nice for elements that never change)
const cardNumber = document.getElementById("cardNumber");
const hanzi = document.getElementById("hanzi");
const pinyin = document.getElementById("pinyin");
const english = document.getElementById("english");

const pinyinBox = document.getElementById("pinyinBox");
const englishBox = document.getElementById("englishBox");

const togglePinyinBtn = document.getElementById("togglePinyinBtn");
const toggleEnglishBtn = document.getElementById("toggleEnglishBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");

const shuffleBtn = document.getElementById("shuffleBtn");
const restartBtn = document.getElementById("restartBtn");

// Helper: hide/show + accessibility attribute
function setHidden(box, hidden) {
  box.classList.toggle("hidden", hidden);
  box.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function shuffleVocabulary() {
  // Safety: handle missing/empty vocabulary
  if (!window.vocabulary || !Array.isArray(window.vocabulary) || window.vocabulary.length === 0) {
    shuffledVocabulary = [];
    return;
  }

  shuffledVocabulary = window.vocabulary.slice();

  // Fisher–Yates shuffle
  for (var i = shuffledVocabulary.length - 1; i > 0; i--) {
    var randomIndex = Math.floor(Math.random() * (i + 1));
    var temporaryCard = shuffledVocabulary[i];
    shuffledVocabulary[i] = shuffledVocabulary[randomIndex];
    shuffledVocabulary[randomIndex] = temporaryCard;
  }
}

function showMissingDataMessage() {
  cardNumber.textContent = "";
  hanzi.textContent = "No vocabulary loaded";
  pinyin.textContent = "Check vocab-data.js is linked correctly.";
  english.textContent = "Make sure `vocabulary` is a non-empty array.";

  setHidden(pinyinBox, false);
  setHidden(englishBox, false);

  togglePinyinBtn.disabled = true;
  toggleEnglishBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  shuffleBtn.disabled = true;
  restartBtn.disabled = true;
}

function showCard() {
  if (shuffledVocabulary.length === 0) {
    showMissingDataMessage();
    return;
  }

  var currentCard = shuffledVocabulary[currentIndex];

  cardNumber.textContent =
    "Card " + (currentIndex + 1) + " of " + shuffledVocabulary.length;

  hanzi.textContent = currentCard.hanzi;
  pinyin.textContent = currentCard.pinyin;
  english.textContent = currentCard.english;

  // Hide answers whenever a new card appears
  setHidden(pinyinBox, true);
  setHidden(englishBox, true);

  togglePinyinBtn.textContent = "Reveal Pinyin";
  toggleEnglishBtn.textContent = "Reveal English";
}

function togglePinyin() {
  var isHidden = pinyinBox.classList.contains("hidden");
  setHidden(pinyinBox, !isHidden);
  togglePinyinBtn.textContent = isHidden ? "Hide Pinyin" : "Reveal Pinyin";
}

function toggleEnglish() {
  var isHidden = englishBox.classList.contains("hidden");
  setHidden(englishBox, !isHidden);
  toggleEnglishBtn.textContent = isHidden ? "Hide English" : "Reveal English";
}

function nextCard() {
  if (shuffledVocabulary.length === 0) return;

  currentIndex = currentIndex + 1;
  if (currentIndex >= shuffledVocabulary.length) {
    currentIndex = 0;
  }
  showCard();
}

function previousCard() {
  if (shuffledVocabulary.length === 0) return;

  currentIndex = currentIndex - 1;
  if (currentIndex < 0) {
    currentIndex = shuffledVocabulary.length - 1;
  }
  showCard();
}

function shuffleDeck() {
  shuffleVocabulary();
  currentIndex = 0;
  showCard();
}

function restartDeck() {
  currentIndex = 0;
  showCard();
}

// Button events
togglePinyinBtn.addEventListener("click", togglePinyin);
toggleEnglishBtn.addEventListener("click", toggleEnglish);

nextBtn.addEventListener("click", nextCard);
prevBtn.addEventListener("click", previousCard);

shuffleBtn.addEventListener("click", shuffleDeck);
restartBtn.addEventListener("click", restartDeck);

// Keyboard shortcuts for class/projector use
document.addEventListener("keydown", function (event) {
  if (event.key === "ArrowRight") nextCard();
  if (event.key === "ArrowLeft") previousCard();
  if (event.key === "p" || event.key === "P") togglePinyin();
  if (event.key === "e" || event.key === "E") toggleEnglish();
});

// Start up
shuffleVocabulary();
showCard();