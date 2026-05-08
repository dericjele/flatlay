# FlatLay Pro — Goodie Bag Layout Studio

A Next.js app for creating beautiful flat lay product photos, built specifically for goodie bag businesses.

## Features

- 🎁 **20 layout styles** — 6 goodie-bag-specific + 14 classic compositions
- ✂️ **Background removal** via PhotoRoom API (optional per image)
- 🖼️ **Before/after preview** — compare original vs. clean background
- 🖱️ **Drag & drop** — reposition items freely on canvas
- 🎛️ **Per-item controls** — scale, rotate, opacity, flip, layer order
- 📐 **Auto-generate** — layout updates instantly when you switch styles
- 💾 **High-res export** — 1080px / 1500px / 2400px / custom

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your PhotoRoom API key:
```
PHOTOROOM_API_KEY=your_key_here
```

Get a free API key at https://www.photoroom.com/api  
Free tier: 30 images/month. Paid plans from ~$0.05/image.

> **Note:** Background removal is optional. The app works fully without an API key — you just won't be able to remove backgrounds automatically.

### 3. Run the dev server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
flatlay-pro/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles + CSS variables
│   └── api/
│       └── remove-bg/
│           └── route.ts        # PhotoRoom API proxy
├── components/
│   ├── FlatLayStudio.tsx       # Main orchestrator — all state lives here
│   ├── FlatLayCanvas.tsx       # Interactive canvas (drag, select, draw)
│   ├── LeftPanel.tsx           # Upload, layouts, background, sliders
│   ├── RightPanel.tsx          # Inspector + export section
│   ├── ProductThumb.tsx        # Individual product thumbnail
│   └── ImagePreviewModal.tsx   # Before/after preview modal
├── lib/
│   ├── types.ts                # TypeScript interfaces
│   ├── layouts.ts              # 20 layout algorithms
│   └── canvas.ts               # Canvas draw utilities + export
└── .env.local.example          # Environment variable template
```

---

## How Background Removal Works

1. User uploads a product photo
2. Hover the thumbnail → click **"✂ Remove BG"**
3. Image is sent to `/api/remove-bg` (your Next.js API route)
4. The route forwards it to PhotoRoom's API with your key
5. PhotoRoom returns a PNG with transparent background
6. A **before/after preview** lets you compare both versions
7. Toggle **"Use Clean BG"** or **"Use Original"** per image independently
8. Items on canvas update in real time

---

## Deployment

### Vercel (recommended)
```bash
npx vercel
```
Add `PHOTOROOM_API_KEY` in your Vercel project environment variables.

### Other platforms
Set the `PHOTOROOM_API_KEY` environment variable wherever you deploy.

---

## Adding More Features Later

- **AI layout suggestions** — pass image metadata to Claude API to suggest the best layout
- **Styled backgrounds** — use FAL.ai to generate marble/wood/linen backgrounds
- **Text overlay** — add product names or prices to the layout
- **Multiple canvases** — save and compare different layout variations
