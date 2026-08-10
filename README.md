# Vinimay Frontend Starter — No Login Edition

This onboarding repository is a source-copy starter built from the reusable UI layer of the Vinimay frontend. It opens directly to a generic component playground and contains no authentication requirement.

## Why login is excluded

New joinees can learn and build the frontend structure without:

- needing real Vinimay credentials;
- connecting to any backend;
- duplicating or changing authentication logic;
- accessing business pages or confidential modules.

Authentication should be integrated only after the developer begins work inside an approved Vinimay feature repository.

## Included

- Original `globals.css`
- Original Tailwind and shadcn configuration
- Original reusable UI component source files
- Original theme provider and theme toggle
- Sanitized app shell using the same layout classes
- Sanitized sidebar with placeholder icons and no labels
- Static starter profile
- Generic component playground
- Original public Vinimay logo assets used by the layout

## Excluded

- Login pages
- Authentication helpers and token handling
- Backend base URLs and API clients
- Business pages and dashboards
- Real navigation labels and routes
- Roles and permissions
- Business Redux slices
- Environment secrets
- Git history

## Run

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:8679
```

The root route redirects directly to `/playground`.

## Checks

```bash
npm run type-check
npm run build
npm run security-scan
```

## Onboarding assignment

Create a responsive dummy listing page using the supplied AppShell, Card, Table, Dialog, form components, theme rules and existing utility functions. Do not modify shared UI components unless specifically instructed.
