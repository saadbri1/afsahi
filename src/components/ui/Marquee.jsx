/* Marquee primitive — adapted from a 21st.dev component (magic MCP),
   rewritten for Afsahi's vanilla-Tailwind token system.
   Renders children twice in a track that translates -50% for a seamless loop. */
export default function Marquee({ children, reverse = false, pauseOnHover = true, duration = 40, className = "" }) {
  return (
    <div className={`group flex w-full overflow-hidden ${className}`}>
      <div
        className={`flex w-max shrink-0 items-stretch gap-5 pr-5 ${pauseOnHover ? "group-hover:[animation-play-state:paused]" : ""}`}
        style={{
          animation: `marquee ${duration}s linear infinite`,
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
