# Bailord Pulse Hub

A Vite + React + TypeScript frontend application for the Bailord Pulse Hub admin dashboard.

## Project overview

This repository contains the frontend application located in `bailord-pulse-hub-main/`. It is built with:

- Vite
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- React Router
- React Query
- Socket.io client
- Zod validation

## Getting started

### Prerequisites

- Node.js 18+ (or compatible)
- npm

### Install dependencies

```sh
cd c:\Users\Dinah Bewaji\Desktop\bailord-pulse\frontend
npm install
```

### Run the development server

```sh
npm run dev
```

Open the URL shown in the terminal to view the app locally.

### Build for production

```sh
npm run build
```

### Preview production build

```sh
npm run preview
```

## Available scripts

- `npm run dev` - Start Vite development server
- `npm run build` - Build production assets
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint on the project
- `npm run preview` - Preview the production build locally
- `npm run migrate` - Run the one-off migration script in `src/migrations/add_progress_column.js`

## Repository structure

- `src/` - frontend source code
  - `components/` - reusable UI components
  - `context/` - React context providers
  - `hooks/` - custom hooks
  - `layouts/` - layout components
  - `lib/` - helper utilities
  - `pages/` - route pages
  - `services/` - client service modules
  - `store/` - application state stores
  - `types/` - shared TypeScript types
- `public/` - public static assets
- `package.json` - frontend dependencies and scripts
- `tailwind.config.ts` - Tailwind CSS configuration
- `vite.config.ts` - Vite configuration

## Backend note

This workspace also includes a separate backend project at `../bailord-backend/`.
If you are running the frontend with a backend, start the backend server separately and point the frontend to the correct API base URL.

## Dependencies

Key dependencies used in this project:

- `react`, `react-dom`
- `react-router-dom`
- `@tanstack/react-query`
- `axios`
- `socket.io-client`
- `tailwindcss`, `postcss`, `autoprefixer`
- `zod`
- `zustand`
- `lucide-react`
- `chart.js`, `react-chartjs-2`, `recharts`

## Notes

- This project is configured as an ES module (`type: "module"`).
- The `migrate` script is intended for one-off schema updates and currently points to `src/migrations/add_progress_column.js`.

## License

This repository does not currently specify a license. Add a `LICENSE` file if you want to make the project open source.
