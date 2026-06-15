// Chinese vocabulary flashcard app
// The vocabulary data is loaded from vocab-data.js as `window.vocabulary`.
// This version keeps the original vocab order by default and only shuffles when asked.

const originalVocabulary = Array.isArray(window.vocabulary) ? window.vocabulary.slice() : [];
var activeVocabulary = originalVocabulary.slice();
var currentIndex = 0;
var isShuffled = false;
var isAnimating = false;

// Grab the page elements once at the top.
const cardNumber = document.getElementById("cardNumber");
const deckBadge = document.getElementById("deckBadge");
const cardContent = document.getElementById("cardContent");
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

function setHidden(box, hidden) {
  box.classList.toggle("hidden", hidden);
  box.setAttribute("aria-hidden", hidden ? "true" : "false");
}

function updateRevealButtonState(button, isExpanded, revealText, hideText) {
  button.textContent = isExpanded ? hideText : revealText;
  button.setAttribute("aria-expanded", isExpanded ? "true" : "false");
}

function applyDeckBadge() {
  deckBadge.textContent = isShuffled ? "Shuffled" : "Original order";
}

function disableControls(disabled) {
  togglePinyinBtn.disabled = disabled;
  toggleEnglishBtn.disabled = disabled;
  prevBtn.disabled = disabled;
  nextBtn.disabled = disabled;
  shuffleBtn.disabled = disabled;
  restartBtn.disabled = disabled;
}

function showMissingDataMessage() {
  cardNumber.textContent = "";
  deckBadge.textContent = "No data";
  hanzi.textContent = "No vocabulary loaded";
  pinyin.textContent = "Check vocab-data.js is linked correctly.";
  english.textContent = "Make sure `vocabulary` is a non-empty array.";
  setHidden(pinyinBox, false);
  setHidden(englishBox, false);
  updateRevealButtonState(togglePinyinBtn, true, "Reveal Pinyin", "Hide Pinyin");
  updateRevealButtonState(toggleEnglishBtn, true, "Reveal English", "Hide English");
  disableControls(true);
}

function resetRevealAreas() {
  setHidden(pinyinBox, true);
  setHidden(englishBox, true);
  updateRevealButtonState(togglePinyinBtn, false, "Reveal Pinyin", "Hide Pinyin");
  updateRevealButtonState(toggleEnglishBtn, false, "Reveal English", "Hide English");
}

function renderCurrentCard() {
  if (activeVocabulary.length === 0) {
    showMissingDataMessage();
    return;
  }

  disableControls(false);
  applyDeckBadge();

  var currentCard = activeVocabulary[currentIndex];
  cardNumber.textContent = "Card " + (currentIndex + 1) + " of " + activeVocabulary.length;
  hanzi.textContent = currentCard.hanzi;
  pinyin.textContent = currentCard.pinyin;
  english.textContent = currentCard.english;
  resetRevealAreas();
}

function animateCardChange(direction, updateCard) {
  if (isAnimating) {
    return;
  }

  isAnimating = true;
  var outClass = direction === "prev" ? "slide-out-prev" : "slide-out-next";
  var inClass = direction === "prev" ? "slide-in-prev" : "slide-in-next";

  cardContent.classList.remove("slide-out-prev", "slide-out-next", "slide-in-prev", "slide-in-next");
  cardContent.classList.add(outClass);

  window.setTimeout(function () {
    updateCard();
    cardContent.classList.remove(outClass);

    // Force a reflow so the browser restarts the animation cleanly.
    void cardContent.offsetWidth;

    cardContent.classList.add(inClass);
    window.setTimeout(function () {
      cardContent.classList.remove(inClass);
      isAnimating = false;
    }, 220);
  }, 160);
}

function togglePinyin() {
  if (activeVocabulary.length === 0) return;
  var isHidden = pinyinBox.classList.contains("hidden");
  setHidden(pinyinBox, !isHidden);
  updateRevealButtonState(togglePinyinBtn, isHidden, "Reveal Pinyin", "Hide Pinyin");
}

function toggleEnglish() {
  if (activeVocabulary.length === 0) return;
  var isHidden = englishBox.classList.contains("hidden");
  setHidden(englishBox, !isHidden);
  updateRevealButtonState(toggleEnglishBtn, isHidden, "Reveal English", "Hide English");
}

function nextCard() {
  if (activeVocabulary.length === 0) return;
  animateCardChange("next", function () {
    currentIndex = currentIndex + 1;
    if (currentIndex >= activeVocabulary.length) {
      currentIndex = 0;
    }
    renderCurrentCard();
  });
}

function previousCard() {
  if (activeVocabulary.length === 0) return;
  animateCardChange("prev", function () {
    currentIndex = currentIndex - 1;
    if (currentIndex < 0) {
      currentIndex = activeVocabulary.length - 1;
    }
    renderCurrentCard();
  });
}

function shuffleArray(sourceArray) {
  var copiedArray = sourceArray.slice();
  for (var i = copiedArray.length - 1; i > 0; i--) {
    var randomIndex = Math.floor(Math.random() * (i + 1));
    var temporaryCard = copiedArray[i];
    copiedArray[i] = copiedArray[randomIndex];
    copiedArray[randomIndex] = temporaryCard;
  }
  return copiedArray;
}

function shuffleDeck() {
  if (originalVocabulary.length === 0 || isAnimating) return;
  activeVocabulary = shuffleArray(originalVocabulary);
  currentIndex = 0;
  isShuffled = true;
  renderCurrentCard();
}

function restartDeck() {
  if (originalVocabulary.length === 0 || isAnimating) return;
  activeVocabulary = originalVocabulary.slice();
  currentIndex = 0;
  isShuffled = false;
  renderCurrentCard();
}

// Button events
togglePinyinBtn.addEventListener("click", togglePinyin);
toggleEnglishBtn.addEventListener("click", toggleEnglish);
nextBtn.addEventListener("click", nextCard);
prevBtn.addEventListener("click", previousCard);
shuffleBtn.addEventListener("click", shuffleDeck);
restartBtn.addEventListener("click", restartDeck);

// Keyboard shortcuts for classroom or projector use.
document.addEventListener("keydown", function (event) {
  if (event.target && (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA")) {
    return;
  }

  if (event.key === "ArrowRight") {
    event.preventDefault();
    nextCard();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    previousCard();
  }

  if (event.key === "p" || event.key === "P") {
    event.preventDefault();
    togglePinyin();
  }

  if (event.key === "e" || event.key === "E") {
    event.preventDefault();
    toggleEnglish();
  }
});

// Start the app in the original vocabulary order.
renderCurrentCard();
