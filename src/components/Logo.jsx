/* AFSAHI mark — champagne crown above an "A" that inherits currentColor
   (so it reads white over the hero photo, ink on the solid nav). */
export default function Logo({ className = "", size = 38 }) {
  return (
    <svg className={className} width={size * 0.85} height={size} viewBox="0 0 48 56" fill="none" aria-hidden="true">
      <path d="M9 20 L14 11 L19 18 L24 8 L29 18 L34 11 L39 20 L36 24 L12 24 Z" fill="#A9823F" />
      <circle cx="14" cy="9.5" r="1.8" fill="#A9823F" />
      <circle cx="24" cy="6" r="2" fill="#A9823F" />
      <circle cx="34" cy="9.5" r="1.8" fill="#A9823F" />
      <path
        d="M24 27 L34 50 L29.5 50 L27.6 45 L20.4 45 L18.5 50 L14 50 Z M21.7 41.5 L26.3 41.5 L24 35 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Wordmark({ large = false }) {
  return (
    <span className="flex flex-col leading-none">
      <b className={`font-sans font-bold tracking-[0.22em] ${large ? "text-[1.6rem]" : "text-[1.2rem]"}`}>AFSAHI</b>
      <i className={`not-italic uppercase tracking-[0.4em] opacity-55 ${large ? "text-[0.56rem] mt-1.5" : "text-[0.48rem] mt-[0.3rem]"}`}>
        Luxury Transport
      </i>
    </span>
  );
}
