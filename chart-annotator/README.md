# Pro Chart Annotator

Mobile-first web app to upload TradingView screenshots, add professional, minimal trade annotations, and export a compressed PNG plus a clean bullet summary.

## Features
- Image upload (PNG/JPG)
- Touch-friendly annotations:
  - ENTRY zone (green) with label
  - SL dashed red line with label
  - TP1–TP3 blue flags with prices
  - Bias arrow (↑ Bullish / ↓ Bearish)
  - Optional OB/FVG zones
- Inputs for symbol, timeframe, risk %, leverage
- Auto-generated trade summary with per-TP RR
- One-tap: Export PNG, Copy/Download Summary

## Quick start
```bash
npm i
npm run dev
```
Open the URL shown (default: `http://localhost:5173`).

## How to use
1) Upload a chart image.
2) Choose a tool then tap on the canvas to place it.
3) Fill the right-side fields (levels, bias, risk, etc.).
4) Export PNG and Copy/Download Summary.

## Notes
- Annotation sizes auto-scale for mobile readability.
- Fabric v6 ESM is used under the hood.
- For deployment, push to any static host (Vercel, Netlify, GitHub Pages).
