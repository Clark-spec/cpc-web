# cpc-web

React + TypeScript frontend for **Cordova Public College**. Currently ships the student and staff login screens.

## Stack

- React 19, TypeScript, Vite
- Tailwind CSS v4 — design tokens live in `src/styles/global.css`
- React Router v8

## Run locally

```bash
npm install
npm run dev
```

## Routes

- `/login/student` — student login (the default screen; `/` and `/login` redirect here)
- `/login/staff` — staff login
- `/login/admin` — minimal placeholder so the footer link does not 404

## Structure

See the [Frontend Structure Guide](docs/frontend-structure-and-api-guide.md) for folder responsibilities and conventions. The real login API call is marked as a TODO in `src/components/features/auth/login-form.tsx`.
