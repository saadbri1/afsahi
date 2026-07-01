import { useEffect, useRef } from "react";
import { useMediaQuery, usePrefersReducedMotion } from "../hooks/useMediaQuery.js";

/* Gold trailing ring + dot, tuned for a light background.
   Desktop / fine-pointer only. */
export default function CustomCursor() {
  const ringRef = useRef(null);
  const dotRef = useRef(null);
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reduce = usePrefersReducedMotion();

  useEffect(() => {
    if (!fine || reduce) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy, raf;

    const move = (e) => {
      tx = e.clientX;
      ty = e.clientY;
      dot.style.transform = `translate(${tx}px, ${ty}px)`;
    };
    const loop = () => {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      ring.style.transform = `translate(${cx}px, ${cy}px)`;
      raf = requestAnimationFrame(loop);
    };
    const over = (e) => {
      if (e.target.closest("a, button, [data-cursor]")) ring.classList.add("is-hover");
    };
    const out = (e) => {
      if (e.target.closest("a, button, [data-cursor]")) ring.classList.remove("is-hover");
    };
    window.addEventListener("mousemove", move);
    document.addEventListener("mouseover", over);
    document.addEventListener("mouseout", out);
    loop();
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseover", over);
      document.removeEventListener("mouseout", out);
      cancelAnimationFrame(raf);
    };
  }, [fine, reduce]);

  if (!fine || reduce) return null;
  return (
    <>
      <div
        ref={ringRef}
        className="cursor-ring pointer-events-none fixed left-0 top-0 z-[200] h-[32px] w-[32px] -ml-[16px] -mt-[16px] rounded-full border border-champ transition-[width,height,margin,background] duration-300 ease-luxe"
      />
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[200] h-[5px] w-[5px] -ml-[2.5px] -mt-[2.5px] rounded-full bg-champ"
      />
      <style>{`.cursor-ring.is-hover{width:52px;height:52px;margin:-26px 0 0 -26px;background:rgba(197,164,103,.14)}`}</style>
    </>
  );
}
