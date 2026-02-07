# Kvitta UI

A modern Next.js 16 application for AI-powered receipt processing using Nvidia's OCR and reasoning models.

## Features

- 🤖 **AI-Powered OCR** - Extract text from receipt images using Nvidia OCDRNet
- 💰 **Smart Parsing** - Automatically identify items, prices, taxes, and fees
- 📊 **Structured Output** - Get clean JSON with line items and charges
- ⚡ **Fast & Modern** - Built with Next.js 16, React 19, and TypeScript
- 🎨 **Beautiful UI** - Responsive design with Tailwind CSS v4

## Quick Start

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your API URL

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
kvitta-ui/
├── app/              # Pages (App Router)
├── components/       # Reusable UI components
├── lib/              # API client and utilities
├── types/            # TypeScript definitions
└── public/           # Static assets
```

## Key Pages

- **`/`** - Landing page
- **`/upload`** - Receipt upload and processing

## Tech Stack

- **Framework**: Next.js 16.1.6
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Runtime**: Bun (or Node.js 18+)
- **Backend**: FastAPI (kvitta-api)

## Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

See [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) for:
- Architecture principles
- Creating new pages
- Building components
- Adding API endpoints
- Best practices

## Scripts

```bash
bun dev          # Start development server
bun build        # Create production build
bun start        # Run production server
bun lint         # Run ESLint
```

## Contributing

1. Follow the architecture patterns in DEVELOPMENT_GUIDE.md
2. Use Server Components by default
3. Add `'use client'` only when needed
4. Keep components small and focused
5. Write TypeScript with proper types
6. Test your changes locally

## Backend Setup

This frontend requires the kvitta-api backend:

```bash
# In kvitta-api directory
pip install -r requirements.txt
uvicorn main:app --reload
```

See `kvitta-api/README.md` for backend setup details.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Development Guide](./DEVELOPMENT_GUIDE.md)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT 
