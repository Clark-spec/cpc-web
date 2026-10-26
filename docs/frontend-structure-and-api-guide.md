# Frontend Structure Guide

This guide explains how the cpc-web (Cordova Public College) frontend is organized. It assumes you already know how to create and run a React project. There are no installation steps here.

## 1. Understand the folders

```text
src/
├── assets/                 # Images imported by the UI (logo, building, grad cap)
├── components/
│   ├── common/             # Shared application UI
│   ├── features/
│   │   └── auth/           # LoginForm, shared by the student and staff pages
│   └── ui/                 # Small building blocks: Button, Input, Modal, etc.
├── lib/                    # Shared helpers (cn)
├── pages/
│   └── auth/               # AuthLayout plus the student/staff/admin login pages
├── styles/                 # Tailwind v4 entry point and CPC design tokens
└── main.tsx                # App entry point and routes
```

### Pages: arrange the screen

A page represents a route. It arranges the feature components for that screen and passes them their copy props. Keep enough composition in the page to see its structure, but avoid putting the entire screen into one large component.

For example, [the student login page](../src/pages/auth/student/index.tsx) only passes role-specific text to `LoginForm`. [The auth layout](../src/pages/auth/layout.tsx) owns the full-screen background, the navy diagonal shapes, the building illustration, the cap decoration, the glass card, and the welcome text, and it renders each page through `<Outlet />`.

### Features: handle a specific task

A feature component understands a particular part of the application:

- `LoginForm` owns its input values and submission. It is driven entirely by props (`role`, `title`, `idLabel`, `idPlaceholder`, `footerLinks`), so the student and staff pages stay thin. The real login API call is a marked TODO in `handleSubmit`.
- `AuthLayout` renders everything around the card so the two login screens stay visually identical.

Use meaningful names and ordinary named functions such as `async function handleSubmit()` so classmates can follow the flow.

### UI: reuse the building blocks

Before creating a button, input, select, modal, or table, check `components/ui`. Use the existing primitive if it fits. Add a new one there when the application needs a reusable control that does not exist yet.

The `@/` alias points to `src/`. Primitives receive props and render UI; they should not know API endpoints or perform login requests.

## 2. Styling and design tokens

This project uses Tailwind CSS v4. Theme tokens are declared in `src/styles/global.css` under `@theme`:

- Colors: `cpc-navy`, `cpc-bg`, `cpc-title`, `cpc-label`, `cpc-placeholder`, `cpc-icon`, `cpc-input-border`, `cpc-button`, `cpc-welcome`, `cpc-cordova`, `cpc-decor`.
- Fonts: `font-poppins` (card) and `font-inter` (welcome text), loaded in `index.html`.

The login screens size elements with viewport percentages and `clamp()` so the 1440 × 1024 design composition keeps its proportions across desktop window sizes.

## 3. Routing

Routes are declared in [main.tsx](../src/main.tsx).

| URL | Page / behavior |
| --- | --- |
| `/login/student` | Student login (default screen) |
| `/login/staff` | Staff login |
| `/login/admin` | Plain placeholder until the admin login is designed |
| `/` and `/login` | Redirect to `/login/student` |
| unknown paths | Redirect to `/login/student` |

## 4. Add a feature using the same approach

1. Add the feature component under `components/features/<feature>`. Keep its state, request handling, and feature-specific UI together.
2. Reuse primitives from `components/ui`. Put application UI shared across features in `components/common`.
3. Compose the feature inside a page under `src/pages`. Register the URL in `main.tsx`.
4. Keep endpoint code in `src/services` when the API lands; the login form already marks where the first request will go.

## 5. Trace problems with browser tools

Use the browser Network panel to inspect request URLs, payloads, response statuses, and returned JSON. Use the Console for JavaScript errors.

Do not put fetch/Axios requests directly into UI primitives. Keep request behavior in one shared client and endpoint operations in services.
