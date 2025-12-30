# Dust Bunny Game

A simple game built with Vite + Phaser + TypeScript.

## Prerequisites

- Node.js 20 LTS or higher
- npm

## How to run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173`.

## How to build

To build the project for production:

```bash
npm run build
```

The output will be in the `dist` directory.

## Deployment Guide (GitHub Pages)

This project is configured to be deployed to GitHub Pages (or any static host) using a relative base path.

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Commit the `dist` folder** (or use a CI/CD action):
   The contents of the `dist` folder are ready to be served.

   If using a `gh-pages` branch manually:
   ```bash
   git add dist -f
   git commit -m "Deploy to gh-pages"
   git subtree push --prefix dist origin gh-pages
   ```

   **Note on `vite.config.ts`:**
   The configuration includes `base: './'`, which ensures that assets are loaded correctly regardless of the repository name or subdirectory depth.
