# CareerMatch — AI-Powered Resume-Based Job Discovery

CareerMatch helps users discover relevant job listings based on their resume and preferred work location. Upload your resume, select a city, and get ranked job recommendations with explainable match scores.

---

## Project Structure

```
careermatch/
├── client/          # React + Vite frontend (→ Vercel)
├── server/          # Express.js REST API (→ Render)
├── database/
│   └── migrations/  # SQL migrations (→ Supabase)
├── render.yaml      # Render deployment config
└── README.md
```

---

## Prerequisites

- Node.js ≥ 18.0.0
- npm ≥ 9.0.0
- A [Supabase](https://supabase.com) project (free tier works)
- Optionally: [Adzuna API credentials](https://developer.adzuna.com) (free developer tier)

---

## 1. Supabase Setup

### Create a project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon/public key** (for frontend) and **service role key** (for backend — keep secret).

### Run the database migration

1. Open the Supabase SQL Editor.
2. Copy and paste the contents of `database/migrations/001_initial_schema.sql`.
3. Click **Run**. This creates all tables, indexes, foreign keys, and RLS policies.

### Configure authentication

1. In Supabase → Authentication → Settings:
   - **Site URL**: `http://localhost:5173` (development) or your Vercel URL (production).
   - **Redirect URLs**: Add `http://localhost:5173/**` and your Vercel production URL.
2. Enable **Email** provider (enabled by default).

---

## 2. Environment Variables

### Backend (`server/.env`)

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SECRET_KEY=your-service-role-key

# Optional: Adzuna job API (demo mode if absent)
ADZUNA_APP_ID=your-adzuna-app-id
ADZUNA_APP_KEY=your-adzuna-app-key
```

> **SUPABASE_SECRET_KEY** is the service role key. Never expose it to the frontend.

### Frontend (`client/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key
```

> Only use the **anon/public** key here — it is safe for client-side use because RLS policies protect the data.

---

## 3. Install Dependencies

### Windows PowerShell

```powershell
# From the project root
cd c:\Users\Akshat\Code\Test

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ..\client
npm install

cd ..
```

---

## 4. Start Local Development

Open two PowerShell terminals:

**Terminal 1 — Backend:**
```powershell
cd c:\Users\Akshat\Code\Test\server
npm run dev
```
Server starts on http://localhost:5000

**Terminal 2 — Frontend:**
```powershell
cd c:\Users\Akshat\Code\Test\client
npm run dev
```
Frontend starts on http://localhost:5173

### Test the API health check
```powershell
Invoke-RestMethod http://localhost:5000/health
```

---

## 5. Adzuna API (Optional)

CareerMatch integrates with [Adzuna](https://developer.adzuna.com) for real job listings.

Without credentials: demo mode activates automatically — clearly labeled sample jobs are shown so you can develop and test the full UI.

To get credentials:
1. Register at https://developer.adzuna.com
2. Create an application to receive `app_id` and `app_key`
3. Add them to `server/.env`

---

## 6. Running Tests

```powershell
cd c:\Users\Akshat\Code\Test\server
npm test
```

Tests cover:
- Job matching algorithm (score range, ranking, skill overlap)
- Resume parser (skill extraction, years of experience)
- API routes (health check, jobs list, locations)
- Authorization isolation (User A cannot access User B's records)

---

## 7. Deployment

### Frontend → Vercel

1. Push the repository to GitHub.
2. In Vercel, create a new project:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Framework**: Vite
3. Set environment variables in Vercel dashboard:
   ```
   VITE_API_BASE_URL=https://your-render-service.onrender.com/api
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
4. Deploy. SPA routing is handled via `client/vercel.json`.
5. After deployment, update Supabase Auth Site URL and redirect URLs to the Vercel production URL.

### Backend → Render

1. In Render, create a new **Web Service**:
   - **Repository**: your GitHub repo
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
2. Set environment variables in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   FRONTEND_URL=https://your-app.vercel.app
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_SECRET_KEY=your-service-role-key
   ADZUNA_APP_ID=your-app-id (optional)
   ADZUNA_APP_KEY=your-app-key (optional)
   ```
3. Render auto-deploys on every push to the main branch.

Alternatively, `render.yaml` at the project root can be used for infrastructure-as-code setup.

---

## 8. Deployment Checklist

- [ ] Supabase migration `001_initial_schema.sql` applied to production project
- [ ] Supabase Auth Site URL set to production Vercel URL
- [ ] Supabase Auth Redirect URLs include production Vercel URL
- [ ] Vercel `VITE_API_BASE_URL` points to Render service URL
- [ ] Render `FRONTEND_URL` points to Vercel production URL
- [ ] Render `SUPABASE_SECRET_KEY` set (service role key — never in Vercel)
- [ ] CORS works between Vercel and Render origins
- [ ] `/health` endpoint returns 200 on Render
- [ ] Resume upload processes successfully in production
- [ ] Adzuna credentials set (or demo mode confirmed working)
- [ ] RLS policies verified — tested with two separate user accounts
- [ ] No localhost URLs in production builds

---

## 9. Architecture Notes

### Security
- The Supabase **service role key** is backend-only. The frontend only receives the anon key.
- Express verifies every Bearer token via `supabase.auth.getUser(token)` before allowing access to protected resources.
- User IDs are derived from the verified token, never from the request body.
- RLS policies enforce that users can only read/write their own profiles, resumes, saved jobs, and applications.
- File uploads use in-memory storage (never written to disk). Maximum 5 MB. PDF and DOCX only.
- Raw resume text is not stored. Only structured extracted data is persisted.

### Job matching
- Fully deterministic — no LLM or paid AI API required.
- Weights: Skills 50% · Title/Role 25% · Experience 15% · Education 10%.
- Match scores are relevance indicators, not hiring probabilities.
- Location is a genuine hard filter, not a keyword match.

### Demo mode
- Activates automatically when `ADZUNA_APP_ID` / `ADZUNA_APP_KEY` are absent.
- Demo jobs are clearly labeled in the UI with an amber "Demo" badge.
- Demo application URLs are not functional and are disabled in the UI.

---

## 10. Limitations (MVP)

- OCR is not supported. Scanned PDFs will be rejected with an explanation.
- Resume parsing is heuristic-based, not LLM-based. Complex formatting may reduce extraction quality.
- The matching algorithm is skill-keyword based. Semantic similarity (e.g. "ML" → "Machine Learning") is partially handled but not exhaustive.
- Adzuna's India job coverage varies by city and category. Some searches may return limited results.
- Application status tracking is self-reported — not verified by employers.
- Email confirmation may be required depending on Supabase Auth settings.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Lucide React |
| Backend | Node.js, Express.js, ES Modules |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL with RLS |
| File processing | pdf-parse (PDF), mammoth (DOCX) |
| Validation | Zod |
| Upload | Multer (memory storage) |
| Job data | Adzuna API (with demo fallback) |
| Security | Helmet, CORS, express-rate-limit |
| Testing | Jest, Supertest |
| Frontend deploy | Vercel |
| Backend deploy | Render |

