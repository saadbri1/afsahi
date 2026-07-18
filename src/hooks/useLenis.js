const HEADER_OFFSET = 76;

export function scrollToHash(hash, { smooth = false, updateHistory = true } = {}) {
  const target = document.querySelector(hash);
  if (!target) return false;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET);

  if (updateHistory && window.location.hash !== hash) {
    window.history.pushState({}, "", `${window.location.pathname}${window.location.search}${hash}`);
  }

  window.scrollTo({ top, behavior: smooth && !reduceMotion ? "smooth" : "auto" });
  return true;
}
