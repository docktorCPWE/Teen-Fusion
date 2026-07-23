# Teen Fusion

Teen Fusion is a secure master lesson planner and curriculum dashboard for youth leaders. It includes a 52-week lesson library, content calendar, shared student roster, saved resources, lesson artwork, and local progress tracking.

## What Is Included

- Dashboard with lesson cards and taught/available status
- Lesson detail panel with discussion questions and NLT scripture links
- Per-lesson PowerPoint presentation downloads for Proclaim or slide workflows
- Content calendar with Sunday lessons and Wednesday carryover entries
- My Group roster with student contact and emergency details stored in Supabase
- Google sign-in with pending/approved/disabled leader access
- Settings admin area for approving or disabling youth leader accounts
- Resources page for saved notes, links, activities, prayer items, and follow-ups
- Generated lesson artwork for all 52 curriculum weeks

## Run Locally

Install dependencies once:

```bash
npm install
```

Create `.env.local` with the Supabase public values:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Then run:

```bash
npm run dev
```

Then open:

```text
http://127.0.0.1:5173/
```

## Vercel Environment Variables

Add these variables to the Vercel project for Production, Preview, and Development:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Only use the public Supabase URL and publishable/anon key in Vercel. Do not add a Supabase service-role key to the frontend.

## Notes

Student roster entries use Supabase and require an approved member account. Curriculum progress and saved resources still use browser localStorage.
