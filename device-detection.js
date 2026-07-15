(function(){
  function isAppleMobile(){
    var ua=navigator.userAgent||"";
    var platform=navigator.platform||"";
    return /iPhone|iPad|iPod/i.test(ua)||(platform==="MacIntel"&&navigator.maxTouchPoints>1);
  }
  function update(){
    var ios=isAppleMobile();
    var portrait=window.matchMedia("(orientation: portrait)").matches;
    document.documentElement.classList.toggle("ios-device",ios);
    document.documentElement.classList.toggle("portrait-mode",ios&&portrait);
  }
  update();
  window.addEventListener("orientationchange",update);
  window.addEventListener("resize",update);
})();