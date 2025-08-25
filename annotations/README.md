# Chart Annotation Example Pack

This folder contains a lightweight JSON schema and four example files you can load in your Chart Annotation tool for demos, tests, or UI showcases.

## Files

- `schema.json` — JSON Schema describing the annotation format
- `examples/01_btcusdt_5m_nyo.json` — 5m BTC: daily open/NYO, daily low sweep, RR box, volume profile
- `examples/02_tiausdt_15m_fib.json` — 15m TIA: swing fib with 0.718 reclaim plan
- `examples/03_btcusdt_4h_breakout.json` — 4h BTC: falling channel and breakout path
- `examples/04_crvusdt_15m_scenarios.json` — 15m CRV: supply, inefficiency, and dual scenarios

## Minimal Loader Contract

Your tool should accept an object that validates against `schema.json`. Common layer `type` values and required `data` payloads:

- `hline` → `{ price }`
- `vline` → `{ time }`
- `box` → `{ x1, x2, y1, y2 }`
- `line`/`arrow` → `{ x1, y1, x2, y2 }`
- `channel` → `{ x1, y1, x2, y2 }` (renderer draws parallel borders)
- `fibonacci` → `{ x1, y1, x2, y2, levels[] }`
- `sessionDivider` → `{ time, label? }`
- `volumeProfile` → `{ from, to, rows? }`
- `rrBox` → `{ side, entry, stop, target }`

All times are ISO-8601 strings (UTC), all prices are numbers.

## Rendering Notes

- Respect `style` fields (`color`, `fill`, `opacity`, `width`, `dash`, `zIndex`).
- Unknown layer `type`s should be ignored (forward compatibility).
- `tradeIdea` is optional, but useful for badges and summary cards.

## Validation

If you use AJV:

```bash
npx ajv validate -s schema.json -d examples/*.json | cat
```

## License

Public domain examples. Use freely.
