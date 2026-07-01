# Liquidity Mapping Approximation — Inspired by Order Flow (`LMA-OF`)

A single-file TradingView **Pine Script v5 indicator** (overlay) that *approximates*
the behavior of an L2 order-book liquidity tool using only data TradingView
exposes: price, candle structure, pivots, volume, ATR, wick rejection, equal
highs/lows, round numbers and volume spikes.

> **This is not a real order book.** Pine cannot access Level 2 / DOM data. Levels
> here are a price/volume *approximation* of where liquidity may rest, not actual
> resting limit orders. On FX/CFD/metals (e.g. XAUUSD) `volume` is **tick volume**
> and "delta" is a **close-position proxy**, not true bid/ask delta. Educational /
> discretionary-assist tool only.

File: [`liquidity_mapping_approximation.pine`](liquidity_mapping_approximation.pine)

---

## Install

1. Open TradingView → **Pine Editor**.
2. Paste the contents of `liquidity_mapping_approximation.pine`.
3. **Add to chart**. Recommended first test: XAUUSD, M5 then M1.

---

## What each input does

### Detection
| Input | Default | Purpose |
|---|---|---|
| Pivot length | 15 | Bars on each side for `ta.pivothigh/low`. Pivots confirm this many bars *after* the fact (lag, not repaint). |
| Volume SMA length | 20 | Baseline for the volume-spike test. |
| Volume spike multiplier | 1.5 | A bar is a "spike" when `volume > SMA × this`. |
| ATR length | 14 | ATR used for tolerances, stops and buffers. |
| Equal H/L tolerance (× ATR) | 0.25 | New pivots within this distance of a same-side level count as an equal high/low (touch++), not a new level. Also the dedup radius. |
| Detect round-number levels | true | Adds the nearest round numbers above/below price as levels. |
| Round-number step (0 = auto) | 0 | Spacing of round levels. `0` auto-derives a sane step from price magnitude (e.g. 10 on gold). Any value > 0 overrides. |
| Min candle body ratio | 0.5 | Minimum `|close-open|/range` for a bar to count as "aggressive". |
| Close-position threshold (delta proxy) | 0.66 | How close the close must be to the bar extreme to count as bullish/bearish aggression. **Proxy, not real delta.** |

### Levels & visuals
| Input | Default | Purpose |
|---|---|---|
| Max liquidity levels | 40 | Hard cap on stored levels; oldest inactive/phantom pruned first. |
| Keep phantom level for N bars | 120 | How long a broken (phantom) level stays before deletion. |
| Phantom level transparency | 80 | Transparency of broken levels. |
| Invalidation buffer (× ATR) | 0.25 | A level is decisively broken only when a bar **closes** beyond it by this much. |

### Risk / stops
| Input | Default | Purpose |
|---|---|---|
| ATR stop multiplier | 1.5 | Suggested stop distance = `level ± ATR × this`. |
| Extra stop buffer (ticks) | 0 | Additional ticks added to the suggested stop. |

### Scaling (adds)
| Input | Default | Purpose |
|---|---|---|
| Max adds after first entry | 2 | Cap on ADD signals per trade idea. First entry is half size. |

### Trailing
| Input | Default | Purpose |
|---|---|---|
| Trailing timeframe | 1M | TF for the suggested trailing swing (`15S`/`1M`/`5M`). 15s may be unavailable → falls back to chart TF. |

### Confirmation
| Input | Default | Purpose |
|---|---|---|
| Confirmation close timeframe | Chart | `Chart` confirms on the chart bar; `1M`/`5M` require the prior closed HTF bar to agree (adds lag). |

### Trend filter
| Input | Default | Purpose |
|---|---|---|
| Enable EMA trend filter | false | When on: longs only above both EMAs, shorts only below. EMAs plotted faintly. |
| Trend EMA fast / slow | 50 / 200 | The two EMAs. |

### Exit / caution
| Input | Default | Purpose |
|---|---|---|
| Opposite-liquidity proximity (× ATR) | 0.5 | Triggers caution when opposite-side liquidity sits this close to price. |

### News / avoid window
| Input | Default | Purpose |
|---|---|---|
| Enable news/avoid window | false | When on, suppresses new entries/adds inside the window and shades the background grey. |
| News window start / end | — | One window (exchange time). To add more, duplicate the inputs and OR the checks (see code comment). |

### Display
| Input | Default | Purpose |
|---|---|---|
| Show dashboard | true | Top-right status table. |
| Show phantom levels | true | If off, broken levels are deleted immediately. |
| Show live forming signals (faint) | false | Optional cosmetic provisional layer on the forming bar. Never fires alerts. |

---

## How the signals work

- **Entry (sweep/grab):** a pre-existing buyer level is wicked below and the bar
  *closes back above* it with bullish aggression (volume spike + body + close
  position) → confirmed **LONG**. Mirror for **SHORT**. First entry is half size (`½`).
- **ADD:** while in a trade, a confirmed close beyond the next same-direction
  level (with volume) prints an **ADD**; the suggested stop is moved to that
  freshly broken level ± ATR. Capped by *Max adds*.
- **SL line** (dashed red) and **TRAIL line** (dotted orange) extend right while
  the idea is live and disappear when flat.
- **EXIT / caution** prints on opposite liquidity nearby, stalling (small bodies),
  declining volume, or a rejection wick at the target.

---

## Setting the 6 alerts (use **"Once Per Bar Close"**)

In the alert dialog, set **Condition → LMA-OF**, pick one of the events, and set
**"Once Per Bar Close"** to match the non-repaint design:

1. **Long setup confirmed**
2. **Short setup confirmed**
3. **Add long**
4. **Add short**
5. **Exit / caution**
6. **Liquidity sweep detected**

Messages include `{{ticker}}` and `{{interval}}` placeholders.

---

## §11 Testing

1. **Levels:** XAUUSD M5 then M1 — confirm levels draw, extend right, turn phantom after being broken.
2. **Repaint check (Bar Replay):** step forward, note the bar a confirmed signal prints on; disable replay and confirm the arrow is on the same closed bar. Pivot levels appear `pivotLen` bars after the pivot — expected lag, not repaint.
3. **Live vs close:** with *Show forming signals* on, faint shapes may flicker intrabar; the solid confirmed shape only settles on close.
4. **Toggles:** flip trend / news / phantom / dashboard and verify behavior changes.
5. **News window:** set a window over a known session; confirm grey background and no new entries inside it.
6. **Stress:** `maxLevels = 200`, scroll back thousands of bars — no object-limit error.
7. **Round numbers:** test on an index/crypto symbol; `roundStep = 0` auto-derives, manual value overrides.
8. **Trail TF:** set `trailTF = 15S` on a symbol without 15s data; the dashboard shows *"Trail TF unavailable → chart"* instead of erroring.

---

## §12 Known limitations

- No real Level 2 / DOM / order-book data exists in Pine. Levels are a price/volume approximation, not resting limit orders.
- On FX/CFD/metals (XAUUSD), `volume` is tick volume, not real traded volume; the "delta" is a close-position proxy, not true bid/ask delta.
- Lower-timeframe (15s) and some `request.security` intrabar data are plan- and feed-dependent and may be unavailable; the script falls back to chart TF.
- Pivot-based levels are inherently lagged by `pivotLen` bars (confirmation cost).
- Equal-highs/lows and round-number detection are heuristics and will sometimes mark irrelevant levels.
- This is an indicator (visual + alerts), not an auto-executing strategy. Stops, trailing and scaling are suggestions for discretionary use.
- Validate on Bar Replay and a demo account before risking capital.

---

## How to trade it (discretionary, risk-aware)

Treat the tool as a *map*, not a system. Wait for a **confirmed** sweep arrow —
price grabbing liquidity beyond a level and closing back through it with a real
volume/aggression push — then size in at half and only **ADD** as price proves
the move by breaking the next level on volume. Respect the suggested **SL** and
let the **TRAIL** ride structure, but tighten or stand aside when an **EXIT/caution**
prints, when opposite liquidity looms, or during the news window. Because this
approximates rather than reads the order book, confirm every idea on Bar Replay
and a demo account, and never risk more than you can afford to lose.
