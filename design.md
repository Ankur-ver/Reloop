# ReLoop — Design System

## Brand Identity
- **Brand Name:** ReLoop
- **Tagline:** Every Product Deserves a Second Life
- **Brand Voice:** Bold, purposeful, tech-forward, trustworthy

## Color Palette
```css
--color-bg-primary: #0A0F1E        /* Deep navy black */
--color-bg-secondary: #0F1628      /* Slightly lighter navy */
--color-bg-card: #111827           /* Card backgrounds */
--color-bg-elevated: #1A2235       /* Elevated surface */
--color-accent-green: #22C55E      /* Primary green accent */
--color-accent-green-dim: #16A34A  /* Darker green */
--color-accent-green-glow: #4ADE80 /* Light green glow */
--color-accent-blue: #3B82F6       /* Secondary accent */
--color-accent-amber: #F59E0B      /* Warning/credits gold */
--color-text-primary: #F9FAFB      /* Near white */
--color-text-secondary: #9CA3AF    /* Muted gray */
--color-text-muted: #6B7280        /* Very muted */
--color-border: #1F2937            /* Subtle border */
--color-border-accent: #22C55E33   /* Green border w/ opacity */
```

## Typography
- **Display Font:** Poppins (700, 800) — hero headings
- **Body Font:** Poppins (400, 500, 600) — all body text
- **Monospace:** JetBrains Mono — data/stats/codes

### Scale
- Hero: 72px / 800 weight / tight leading
- H1: 48px / 700
- H2: 36px / 700
- H3: 24px / 600
- Body: 16px / 400 / 1.7 line height
- Small: 14px / 400
- Label: 12px / 600 / uppercase / tracked

## Layout
- Max content width: 1280px
- Grid: 12-column with 24px gutters
- Section padding: 96px vertical
- Card border-radius: 16px
- Asymmetric layouts — image left/right alternating
- Overlapping elements, subtle depth layers

## Component Patterns

### Cards
- Dark bg (#111827) with subtle border (#1F2937)
- Hover: border shifts to green (#22C55E33), subtle lift translateY(-2px)
- Image overlays with gradient fade to dark
- Status badges: pill shape, colored bg with matching text

### Buttons
- Primary: solid green (#22C55E), dark text, rounded-full
- Secondary: border green, transparent bg
- Ghost: no border, green text
- Sizes: sm (32px), md (40px), lg (48px)

### Stats Counter
- Large monospace numbers in green
- Label below in muted gray uppercase
- Grid of 4 across on desktop

### Status Badges (Disposition)
- Resell: green bg
- Refurbish: blue bg
- Donate: amber bg
- Recycle: gray bg
- Exchange: purple bg

### Quality Grade Badges
- Excellent: #22C55E (green)
- Good: #3B82F6 (blue)
- Fair: #F59E0B (amber)
- Poor: #EF4444 (red)

## Sections / UX Patterns
- **Hero:** Full-width dark, large bold headline, green CTA, animated stat strip
- **Feature Cards:** 3-col grid with icon + title + description, hover green border
- **Process Flow:** Horizontal numbered steps with connector lines
- **Marketplace Grid:** 3-4 col product cards with grade badges, green credits pricing
- **Dashboard:** Sidebar nav, stat cards top row, charts/tables below
- **CTA Sections:** Dark to green gradient strip with centered headline

## Motion
- Page load: staggered fade-up (0.1s delays between elements)
- Hover: smooth 200ms transitions on all interactive elements
- Number counters: animate on scroll into view
- Skeleton loading states for async content

## Imagery / Icons
- Lucide React icons throughout
- Product images with dark overlay gradients
- Environmental imagery (nature, recycling, sustainability themes)
- Abstract geometric backgrounds with green glow accents
