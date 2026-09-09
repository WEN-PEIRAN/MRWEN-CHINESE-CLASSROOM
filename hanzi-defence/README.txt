HANZI DEFENCE v1.0
==================

A complete offline HTML5 Chinese vocabulary defence game.

RUNNING THE GAME
1. Keep the folder structure unchanged.
2. Open index.html in a modern desktop browser.
3. No server, npm, build tool, external CDN, database or paid API is required.
4. The same folder can be uploaded to GitHub Pages.

CONTROLS
W / Up Arrow       Move turret up
S / Down Arrow     Move turret down
Mouse              Aim
Click / Space      Fire
R                  Reload (3 seconds)
F                  Enter or exit fullscreen
Pause button       Pause or return to Mission Select

DATA
The supplied vocabulary file is stored unchanged at:
assets/data/vocabulary-data.js

The game reads window.CHINESE_VOCAB_DATA directly so it also works from file://.
Years, topics, lists and mission cards are generated dynamically from the data.
Empty topics remain visible and locked. The Profile screen includes an automatic
data integrity report.

SAVES
Profiles and scores are saved independently in browser localStorage under:
hanziDefenceProfilesV1
Deleting browser site data will remove local profiles.

TECHNICAL NOTES
- Battle visuals are drawn with HTML5 Canvas.
- Only one requestAnimationFrame loop runs during a battle.
- Battle objects use explicit active, splitting, escaping and removed states.
- Removed objects are cleaned at frame end.
- Active bug, particle, bullet and split counts are capped.
- ResizeObserver and fullscreenchange preserve and clamp battlefield positions.
- Keyboard shortcuts stop while an input, textarea, select or contenteditable
  element has focus.
- Observer English targets are locked by unique bug ID and never identify the
  matching Hanzi through colour, arrows, highlighting or aim assistance.

LOGO
The supplied logo is used unchanged in the interface. Favicon and application
icons were generated from that source image.
