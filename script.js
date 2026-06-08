// The vocabulary list is now stored in vocab-data.js.
// This file controls the flashcard app logic.

var shuffledVocabulary = [];
var currentIndex = 0;

var cardNumber = document.getElementById("cardNumber");
var hanzi = document.getElementById("hanzi");
var pinyin = document.getElementById("pinyin");
var english = document.getElementById("english");

var pinyinBox = document.getElementById("pinyinBox");
var englishBox = document.getElementById("englishBox");

var showPinyinBtn = document.getElementById("showPinyinBtn");
var showEnglishBtn = document.getElementById("showEnglishBtn");
var prevBtn = document.getElementById("prevBtn");
var nextBtn = document.getElementById("nextBtn");

// This function creates a random order for the vocabulary cards.
function shuffleVocabulary() {
  shuffledVocabulary = vocabulary.slice();

  for (var i = shuffledVocabulary.length - 1; i > 0; i--) {
    var randomIndex = Math.floor(Math.random() * (i + 1));

    var temporaryCard = shuffledVocabulary[i];
    shuffledVocabulary[i] = shuffledVocabulary[randomIndex];
    shuffledVocabulary[randomIndex] = temporaryCard;
  }
}

function showCard() {
  var currentCard = shuffledVocabulary[currentIndex];

  cardNumber.textContent = "Card " + (currentIndex + 1) + " of " + shuffledVocabulary.length;
  hanzi.textContent = currentCard.hanzi;
  pinyin.textContent = currentCard.pinyin;
  english.textContent = currentCard.english;

  // Hide answers whenever a new card appears
  pinyinBox.classList.add("hidden");
  englishBox.classList.add("hidden");

  showPinyinBtn.textContent = "Reveal Pinyin";
  showEnglishBtn.textContent = "Reveal English";
}

function revealPinyin() {
  pinyinBox.classList.remove("hidden");
  showPinyinBtn.textContent = "Pinyin Revealed";
}

function revealEnglish() {
  englishBox.classList.remove("hidden");
  showEnglishBtn.textContent = "English Revealed";
}

function nextCard() {
  currentIndex = currentIndex + 1;

  if (currentIndex >= shuffledVocabulary.length) {
    currentIndex = 0;
  }

  showCard();
}

function previousCard() {
  currentIndex = currentIndex - 1;

  if (currentIndex < 0) {
    currentIndex = shuffledVocabulary.length - 1;
  }

  showCard();
}

showPinyinBtn.addEventListener("click", revealPinyin);
showEnglishBtn.addEventListener("click", revealEnglish);
nextBtn.addEventListener("click", nextCard);
prevBtn.addEventListener("click", previousCard);

// Shuffle the cards when the app first loads
shuffleVocabulary();

// Show the first card when the app loads
showCard();