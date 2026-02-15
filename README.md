# Updog

Find out which dog breed you look like! Take a selfie and AI will match you with your dog breed twin.

## How it works

1. Take a selfie (or upload any photo)
2. AI analyzes your photo using Google Gemini 2.5 Flash
3. Get matched with a dog breed — complete with a real photo of the breed, a fun explanation, and a breed fun fact

## Tech Stack

- **Next.js 16** with App Router
- **Vercel AI SDK** with AI Gateway (Google Gemini 2.5 Flash)
- **Tailwind CSS v4** for styling
- **Dog CEO API** for breed images

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file with your Vercel AI Gateway key:

```
AI_GATEWAY_API_KEY=your_key_here
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deploy on Vercel

The easiest way to deploy is on [Vercel](https://vercel.com). Add your `AI_GATEWAY_API_KEY` as an environment variable in the Vercel dashboard.
