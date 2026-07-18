// ─────────────────────────────────────────────────────────────────────────────
// LocationAutocomplete — pickup / drop-off input.
// Powered by Nominatim (OpenStreetMap) — free, key-less, CORS-enabled.
// Renders a fully branded dark/gold dropdown (Blacklane style).
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback, useId } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { searchPlaces } from "../../lib/maps.js";

export default function LocationAutocomplete({
  label,
  placeholder,
  value,          // normalized place object or null
  onSelect,       // (place | null) => void
  onTextChange,   // (rawText) => void — raw input text for manual-entry fallback
  variant = "from",
  dropUp = false,
  className = "",
}) {
  const [query, setQuery] = useState(value?.description || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);

  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const wrapRef = useRef(null);
  const listId = useId();
  const Icon = variant === "from" ? MapPin : Navigation;

  useEffect(() => {
    setQuery(value?.description || "");
  }, [value?.placeId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => () => {
    clearTimeout(debounceRef.current);
    abortRef.current?.abort();
  }, []);

  const fetchSuggestions = useCallback(async (input) => {
    if (!input || input.trim().length < 3) {
      setSuggestions([]); setOpen(false); return;
    }
    try {
      setLoading(true);
      abortRef.current?.abort();
      abortRef.current = new AbortController();
      const results = await searchPlaces(input, { signal: abortRef.current.signal });
      setSuggestions(results);
      setOpen(results.length > 0);
      setActive(-1);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[AFSAHI] Place search failed:", err);
        setSuggestions([]); setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const onChange = (e) => {
    const v = e.target.value;
    setQuery(v);
    onTextChange?.(v);
    if (value) onSelect(null); // typing invalidates a prior selection
    clearTimeout(debounceRef.current);
    // Nominatim asks for ≤1 req/sec → debounce generously.
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 450);
  };

  const choose = useCallback((item) => {
    onSelect({
      description: item.description,
      formattedAddress: item.description,
      displayName: item.main,
      lat: item.lat,
      lng: item.lng,
      placeId: item.placeId,
    });
    setQuery(item.description);
    onTextChange?.(item.description);
    setOpen(false);
  }, [onSelect, onTextChange]);

  const onKeyDown = (e) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (active >= 0) choose(suggestions[active]); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div ref={wrapRef} className={`relative min-w-0 ${className}`}>
      <label
        className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 transition-colors duration-300 ${
          value ? "border-champ" : "border-line focus-within:border-champ"
        }`}
      >
        <span className="text-champ"><Icon size={17} strokeWidth={1.8} /></span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-[0.56rem] font-semibold uppercase tracking-[0.16em] text-muted">
            {label}
          </span>
          <input
            type="text"
            value={query}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onFocus={() => suggestions.length && setOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
            className="w-full bg-transparent text-[0.9rem] text-ink outline-none placeholder:text-muted/60 [color-scheme:light]"
          />
        </span>
        {loading && <Loader2 size={15} className="animate-spin text-muted" />}
      </label>

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute left-0 right-0 z-50 max-h-[min(18rem,50vh)] overflow-auto rounded-xl border border-champ/25 bg-noir/95 py-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.7)] backdrop-blur-xl ${
            dropUp ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          {suggestions.map((s, i) => (
            <li
              key={s.placeId}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => { e.preventDefault(); choose(s); }}
              className={`flex cursor-pointer items-start gap-3 px-4 py-2.5 transition-colors duration-150 ${
                i === active ? "bg-champ/15" : "hover:bg-white/5"
              }`}
            >
              <MapPin size={15} strokeWidth={1.8} className="mt-0.5 shrink-0 text-champ-lt" />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-[0.85rem] font-medium text-cream">{s.main}</span>
                {s.secondary && (
                  <span className="truncate text-[0.74rem] text-muted">{s.secondary}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
