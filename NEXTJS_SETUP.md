# HomeFinder — Next.js Project Guide
## Stack: Next.js 16.2 · TypeScript · Tailwind CSS · App Router

---

## Quick Start

```bash
npx create-next-app@latest homefinder \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd homefinder

# Core dependencies
npm install zustand @tanstack/react-query axios
npm install framer-motion
npm install react-hook-form zod @hookform/resolvers
npm install next-pwa
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-slider
npm install clsx tailwind-merge
npm install lucide-react

# Dev
npm install -D @types/node
```

---

## Folder Structure

```
homefinder/
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── icons/                  # 192x192, 512x512 PNG icons
│   └── og-image.jpg            # Open Graph image
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (fonts, metadata, providers)
│   │   ├── page.tsx            # Homepage → renders <HomePage />
│   │   ├── globals.css         # ← copy provided globals.css here
│   │   │
│   │   ├── (listings)/
│   │   │   ├── search/
│   │   │   │   └── page.tsx    # /search?city=gaborone&type=sale
│   │   │   └── [id]/
│   │   │       └── page.tsx    # /listing/uuid-here
│   │   │
│   │   ├── agents/
│   │   │   ├── page.tsx        # /agents — directory
│   │   │   └── [id]/
│   │   │       └── page.tsx    # /agents/agent-id
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── register/
│   │   │       └── page.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Agent dashboard shell (protected)
│   │   │   ├── page.tsx        # /dashboard — overview
│   │   │   ├── listings/
│   │   │   │   ├── page.tsx    # My listings
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── messages/
│   │   │   │   └── page.tsx
│   │   │   └── analytics/
│   │   │       └── page.tsx
│   │   │
│   │   ├── admin/
│   │   │   └── page.tsx        # Admin panel (role-guarded)
│   │   │
│   │   └── api/                # Next.js Route Handlers (optional proxy)
│   │       └── health/
│   │           └── route.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx     # Dashboard sidebar
│   │   │
│   │   ├── ui/                 # Atomic design system components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Skeleton.tsx    # Loading skeletons
│   │   │   ├── Toast.tsx
│   │   │   ├── Avatar.tsx
│   │   │   └── Spinner.tsx
│   │   │
│   │   ├── listings/
│   │   │   ├── ListingCard.tsx
│   │   │   ├── ListingCardSkeleton.tsx
│   │   │   ├── ListingGrid.tsx
│   │   │   ├── ListingDetail.tsx
│   │   │   ├── ListingGallery.tsx
│   │   │   ├── FeaturedCard.tsx
│   │   │   └── PropertySpecs.tsx
│   │   │
│   │   ├── search/
│   │   │   ├── HeroSearch.tsx
│   │   │   ├── SearchFilters.tsx
│   │   │   ├── FilterChips.tsx
│   │   │   └── SearchResults.tsx
│   │   │
│   │   ├── map/
│   │   │   └── PropertyMap.tsx # Lazy-loaded Google Maps
│   │   │
│   │   ├── agent/
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentProfile.tsx
│   │   │   └── ReviewCard.tsx
│   │   │
│   │   ├── enquiry/
│   │   │   ├── EnquiryForm.tsx
│   │   │   └── MessageThread.tsx
│   │   │
│   │   └── home/               # Homepage section components
│   │       ├── HeroSection.tsx
│   │       ├── TrustedBar.tsx
│   │       ├── FeaturedSection.tsx
│   │       ├── ListingsSection.tsx
│   │       ├── HowItWorks.tsx
│   │       ├── CityGrid.tsx
│   │       ├── StatsSection.tsx
│   │       ├── Testimonials.tsx
│   │       └── AgentCTA.tsx
│   │
│   ├── hooks/
│   │   ├── useAuth.ts          # Auth state + helpers
│   │   ├── useListings.ts      # React Query listing hooks
│   │   ├── useEnquiries.ts
│   │   ├── useFavourites.ts
│   │   ├── useIntersection.ts  # For scroll-triggered animations
│   │   └── useDebounce.ts      # Search input debounce
│   │
│   ├── store/
│   │   ├── authStore.ts        # Zustand auth slice
│   │   ├── searchStore.ts      # Zustand search filters
│   │   └── uiStore.ts          # Modal, drawer, toast state
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts       # Axios instance with interceptors
│   │   │   ├── auth.ts
│   │   │   ├── listings.ts
│   │   │   ├── users.ts
│   │   │   └── enquiries.ts
│   │   ├── queryClient.ts      # React Query client config
│   │   ├── cn.ts               # clsx + tailwind-merge helper
│   │   └── constants.ts        # Cities, property types, etc.
│   │
│   ├── types/
│   │   ├── listing.ts
│   │   ├── user.ts
│   │   ├── enquiry.ts
│   │   └── api.ts
│   │
│   └── utils/
│       ├── format.ts           # BWP currency, area, date
│       ├── validation.ts       # Zod schemas
│       └── storage.ts          # Token helpers (httpOnly approach)
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local
```

---

## Key Config Files

### next.config.ts
```typescript
import type { NextConfig } from 'next';
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.blob.core.windows.net' },
      { protocol: 'https', hostname: 'storage.googleapis.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog'],
  },
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})(nextConfig);
```

### tailwind.config.ts
```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        orange:   { DEFAULT: '#F47B20', dark: '#C25E10', light: '#FFF0E0' },
        blue:     { DEFAULT: '#1A4A7A', mid: '#2D72C4', light: '#E8F2FF', pale: '#F0F6FF' },
        green:    { DEFAULT: '#2A9D54', dark: '#1F7A40', light: '#E6F7ED' },
        ink:      '#0D1B2A',
        surface:  '#F7F8FA',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px', md: '14px', lg: '22px', xl: '32px',
      },
      boxShadow: {
        card:   '0 2px 8px rgba(13,27,42,0.07)',
        'card-hover': '0 20px 60px rgba(13,27,42,0.14)',
        orange: '0 4px 14px rgba(244,123,32,0.38)',
      },
    },
  },
  plugins: [],
};

export default config;
```

### .env.local
```bash
# API
NEXT_PUBLIC_API_URL=https://api.homefinder.co.bw/api

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key_here

# SendGrid (server-side only)
SENDGRID_API_KEY=your_key_here

# JWT (set on API side — do not expose)
JWT_SECRET=your_secret_here
```

---

## lib/api/client.ts — Axios Setup

```typescript
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
          { refreshToken: useAuthStore.getState().refreshToken }
        );
        useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(err);
  }
);
```

---

## utils/format.ts — BWP Currency & Helpers

```typescript
// Format price in Botswana Pula
export function formatBWP(amount: number, compact = false): string {
  if (compact && amount >= 1_000_000) {
    return `BWP ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (compact && amount >= 1_000) {
    return `BWP ${(amount / 1_000).toFixed(0)}k`;
  }
  return new Intl.NumberFormat('en-BW', {
    style: 'currency',
    currency: 'BWP',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format area in m²
export function formatArea(sqm: number): string {
  return `${sqm.toLocaleString()}m²`;
}

// Relative date
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString('en-BW', { day: 'numeric', month: 'short', year: 'numeric' });
}
```

---

## lib/constants.ts

```typescript
export const BOTSWANA_CITIES = [
  'Gaborone', 'Francistown', 'Maun', 'Kasane', 'Lobatse',
  'Serowe', 'Palapye', 'Mochudi', 'Kanye', 'Molepolole',
  'Mogoditshane', 'Tlokweng', 'Ramotswa', 'Jwaneng',
] as const;

export const PROPERTY_TYPES = [
  { value: 'house',      label: 'House' },
  { value: 'apartment',  label: 'Apartment / Flat' },
  { value: 'townhouse',  label: 'Townhouse' },
  { value: 'plot',       label: 'Plot / Stand' },
  { value: 'farm',       label: 'Farm / Smallholding' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'office',     label: 'Office Space' },
] as const;

export const LISTING_TYPES = [
  { value: 'sale',            label: 'For Sale' },
  { value: 'rent',            label: 'For Rent' },
  { value: 'commercial_sale', label: 'Commercial Sale' },
  { value: 'commercial_rent', label: 'Commercial Rent' },
] as const;

export const PRICE_RANGES_SALE = [
  { label: 'Under BWP 500k',      min: 0,         max: 500_000 },
  { label: 'BWP 500k – 1M',       min: 500_000,   max: 1_000_000 },
  { label: 'BWP 1M – 2M',         min: 1_000_000, max: 2_000_000 },
  { label: 'BWP 2M – 5M',         min: 2_000_000, max: 5_000_000 },
  { label: 'Over BWP 5M',         min: 5_000_000, max: undefined },
] as const;
```

---

## PWA manifest.json

```json
{
  "name": "HomeFinder Botswana",
  "short_name": "HomeFinder",
  "description": "Botswana's #1 property marketplace",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1A4A7A",
  "theme_color": "#F47B20",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ],
  "categories": ["lifestyle", "business"],
  "lang": "en-BW"
}
```
