# STEM Forge

STEM Forge is a calm, structured learning platform for Scottish SQA STEM students. It is currently a frontend-only proof of concept focused on one complete learning path.

## Current Product Direction

STEM Forge is not intended to be a random question bank. The product guides students through a structured loop:

Learn -> Practise -> Exam Questions -> Master

The current active subject is Higher Maths. Higher Physics remains in the codebase as a locked / coming soon subject.

STEM Forge creates original SQA-style learning material and is not affiliated with or endorsed by the SQA.

## Active Route

The current vertical slice is:

Higher Maths -> Calculus -> Differentiation -> Basic differentiation

Main path:

`/subjects/higher-maths/calculus/differentiation/basic-differentiation`

First question:

`/question/hm-calc-diff-basic-f-001`

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- React
- KaTeX / Markdown rendering for maths content
- Browser localStorage for local-only progress

## Local Development

Install dependencies:

```bash
pnpm install
```

Run the development server:

```bash
pnpm dev
```

Open the local URL printed by Next.js, usually:

`http://127.0.0.1:3000`

If that port is busy, use another port:

```bash
pnpm dev --port 3038
```

## Checks

Run TypeScript:

```bash
pnpm run typecheck
```

Run lint:

```bash
pnpm run lint
```

Run production build:

```bash
pnpm run build
```

## Current Limitations

- No authentication or user accounts.
- No database.
- No Supabase.
- No payments or Stripe.
- No AI tutor or AI marking.
- No analytics.
- No CMS.
- Local progress is saved only in the current browser using localStorage.
- Higher Maths Basic differentiation is the only active proof-of-concept path.
- Higher Physics is visible but locked / coming soon.

## Deployment Notes

This project is deployment-ready as a static/frontend Next.js MVP. There are no required environment variables for the current proof of concept. Set NEXT_PUBLIC_SITE_URL to the deployed beta URL when publishing so social preview metadata uses the correct domain.

Deployment hygiene:

- `.next` is ignored.
- `node_modules` is ignored.
- `.env` and `.env.local` are ignored.
- `.vercel` is ignored.
- No backend service is required.
- No localhost-only runtime URLs are required.

## Do Not Build Yet

Do not add these until the product direction explicitly changes:

- Supabase
- Authentication
- User accounts
- Payments / Stripe
- AI tutor
- AI marking
- Analytics
- CMS
- Large new content sets

## Important Product Constraints

- Higher Maths is available now.
- Higher Physics is coming soon.
- Keep the UI calm, spacious and premium.
- Use original SQA-style and exam-style questions.
- Keep the stage label: `Past Paper-style Questions`.
- Avoid Easy / Medium / Hard in the active learning journey.
