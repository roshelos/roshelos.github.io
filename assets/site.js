/* Lumen level. Game page: the dome drains while you read how the game plays and the drone refills it.
   Documents: the tube shows how much of the page is left. Without script the dome stays full. */
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var stage = document.querySelector("[data-stage]");
  var doc = document.querySelector("[data-doc]");
  var digits = document.querySelectorAll("[data-digits]");

  function setLevel(el, v) {
    v = Math.max(0, Math.min(1, v));
    el.style.setProperty("--lvl", v.toFixed(4));
    var n = Math.round(v * 100);
    for (var i = 0; i < digits.length; i++) digits[i].textContent = n;
    return v;
  }

  /* A document's reading tube, and the contents list. */
  if (doc) {
    var tube = document.querySelector(".tube");
    var heads = Array.prototype.slice.call(document.querySelectorAll(".paper h2[id]"));
    var links = Array.prototype.slice.call(document.querySelectorAll(".toc a"));
    var toc = document.querySelector(".toc");
    var small = window.matchMedia("(max-width: 899px)");
    if (toc) toc.open = !small.matches;
    var ticking = false;
    var onDoc = function () {
      ticking = false;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (tube) setLevel(tube, max > 0 ? 1 - window.scrollY / max : 1);
      var back = document.querySelector(".to-toc");
      if (back && toc) back.toggleAttribute("data-show", toc.getBoundingClientRect().bottom < 0);
      var cur = null;
      for (var i = 0; i < heads.length; i++) if (heads[i].getBoundingClientRect().top < window.innerHeight * 0.3) cur = i;
      for (var j = 0; j < links.length; j++) {
        if (j === cur) links[j].setAttribute("aria-current", "true"); else links[j].removeAttribute("aria-current");
      }
    };
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onDoc); } }, { passive: true });
    window.addEventListener("resize", onDoc);
    onDoc();
  }

  /* The machine. */
  if (!stage) return;
  /* Studio home: no story to scroll, so the tank drains and the drone refills it on a slow loop. */
  if (stage.hasAttribute("data-idle")) {
    if (reduce) return;
    var start = null;
    var loop = function (ts) {
      if (start === null) start = ts;
      var t = ((ts - start) / 14000) % 1;
      var v = t < 0.7 ? 1 - 0.75 * (t / 0.7) : 0.25 + 0.75 * ((t - 0.7) / 0.3);
      setLevel(stage, v);
      if (t >= 0.7 && v < 0.995) stage.setAttribute("data-pouring", ""); else stage.removeAttribute("data-pouring");
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return;
  }
  var first = stage.querySelector("[data-drain-from]");
  var last = stage.querySelector("[data-drain-to]");
  if (!first || !last) return;
  var low = 0.08;
  var intro = true;
  var ticking2 = false;

  function top(el) { return el.getBoundingClientRect().top + window.scrollY; }

  function levelAt() {
    var y = window.scrollY + window.innerHeight * 0.55;
    var a = top(first);
    var b = top(last);
    var c = b + Math.max(last.offsetHeight, window.innerHeight * 0.7);
    if (y <= a) return { v: 1, pour: false };
    if (y <= b) return { v: 1 - (1 - low) * ((y - a) / (b - a)), pour: false };
    if (y <= c) return { v: low + (1 - low) * ((y - b) / (c - b)), pour: true };
    return { v: 1, pour: false };
  }

  function apply() {
    ticking2 = false;
    if (intro) return;
    var s = levelAt();
    setLevel(stage, s.v);
    if (s.pour && s.v < 0.995) stage.setAttribute("data-pouring", ""); else stage.removeAttribute("data-pouring");
  }

  /* The dome fills once on arrival, then hands over to the scroll. */
  var t0 = null;
  var target = 1;
  function pour(ts) {
    if (t0 === null) t0 = ts;
    var p = Math.min(1, (ts - t0) / 1100);
    var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
    setLevel(stage, eased * target);
    if (p < 1) requestAnimationFrame(pour); else { intro = false; apply(); }
  }
  if (!reduce && window.scrollY < 40) { setLevel(stage, 0); requestAnimationFrame(pour); } else { intro = false; apply(); }

  window.addEventListener("scroll", function () { if (!ticking2) { ticking2 = true; requestAnimationFrame(apply); } }, { passive: true });
  window.addEventListener("resize", apply);
})();
