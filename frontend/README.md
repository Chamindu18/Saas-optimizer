# SeatWatch frontend

React 19 and React Router 7, built with Vite. Use Node.js 22.12+ (Node 22 LTS recommended) and npm.

```bash
cd frontend
npm install
npm run dev
```

The development server runs at `http://localhost:5173`. Start the Express backend on port 5000; Vite forwards `/api` requests to it. For cross-origin direct API requests, add the frontend origin to the backend `FRONTEND_URL` setting.

```bash
npm test          # Vitest and jsdom, one run
npm run build     # production assets in dist/
npm run preview   # serve the production build locally
```

The public API base URL is `VITE_API_URL`, set in `frontend/.env` or in the build environment. It defaults to `/api`, which requires the production host to forward `/api` to Express. For a separately hosted backend, set `VITE_API_URL=https://your-backend.example.com/api` before `npm run build` and configure the backend `FRONTEND_URL` for CORS. Vite embeds this value at build time; rebuild after changing it. Never use `VITE_` for `JWT_SECRET`, `DATABASE_URL`, admin credentials, or other backend secrets.

The HTML entry is `index.html` at the frontend root. Static files remain in `public/`; production hosts must serve `index.html` for React Router paths. The existing CSS and page components are unchanged. CRA's `REACT_APP_API_URL`, `react-scripts`, Jest mappings, and `build/` output are no longer used. Use `npm run dev` in place of the former CRA development command (`npm start` remains an alias).
