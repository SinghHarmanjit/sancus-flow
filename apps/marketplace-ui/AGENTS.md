# Frontend Instructions: marketplace-ui

## Product
Public-facing consumer "Town Square" for Sancus Flow (Port 3000). Consumers use this application to discover legal services, browse verified lawyer profiles, read educational legal guides (e.g., "How to make a will"), and access their consumer portal to monitor case status.

## Technical Stack
- **Framework**: Next.js 15 (App Router, React 19)
- **Rendering**: Server-Side Rendering (SSR) & Incremental Static Regeneration (ISR/SSG)
- **Deployment**: AWS Amplify (or Vercel)
- **UI Components**: `@sancus-flow/ui` design system & Tailwind CSS
- **Shared Types**: `@sancus-flow/types`
- **Authentication**: BetterAuth consumer session client

## Architecture Rules
- **App Router**: Use the `src/app/` directory exclusively.
- **Server-First Components**: Default to React Server Components (RSC) for maximum SEO performance and fast initial load. Only add `'use client'` when state, browser APIs, or event listeners are required.
- **Data Fetching**: Fetch public marketplace listings, guides, and lawyer profiles from `crm-apis` (Port 4002) using native `fetch` with Next.js revalidation cache (`next: { revalidate: ... }`).
- **SEO & Metadata**: Ensure every public page defines dynamic, descriptive `generateMetadata` exports, OpenGraph tags, and canonical links.
- **No Direct DB Access**: Do not import database clients or schemas. All data must be retrieved from backend APIs.

## Development Commands
- Start development server: `bun run dev` (runs on `http://localhost:3000`)
- Build application: `bun run build`
- Lint code: `bun run lint`
