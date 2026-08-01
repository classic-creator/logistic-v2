# Logistics Transport Management System

## Google Maps setup

Copy `.env.example` to `.env.local` and add a Google Maps JavaScript API key with these APIs enabled:

- Maps JavaScript API
- Places API
- Routes API

The key powers Google Places recommendations for trip start/end fields, Google road-route previews, and live trip tracking. Without a key, the app keeps its city-list and simulated-map fallbacks.

## Development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

<!--
The project was initially scaffolded with Vite. The original template notes are retained below for reference.
-->

## Vite notes

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
