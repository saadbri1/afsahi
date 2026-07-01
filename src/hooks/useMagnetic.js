import { useEffect, useRef } from "react";
import { useMediaQuery, usePrefersReducedMotion } from "./useMediaQuery.js";

/* Card leans toward the cursor. Desktop / fine-pointer only. */
export function useMagnetic(strength = 12) {
  const ref = useRef(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !fine || reduce) return;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      const mx = (e.clientX - r.left - r.width / 2) / r.width;
      const my = (e.clientY - r.top - r.height / 2) / r.height;
      el.style.transform = `translate(${mx * strength}px, ${my * strength}px)`;
    };
    const leave = () => (el.style.transform = "");
    el.addEventListener("mousemove", move);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mousemove", move);
      el.removeEventListener("mouseleave", leave);
    };
  }, [strength, fine, reduce]);
  return ref;
}
