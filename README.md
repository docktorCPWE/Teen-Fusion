# Teen Fusion

Teen Fusion is a static curriculum dashboard for youth leaders. It includes a 52-week lesson library, content calendar, student roster, saved resources, lesson artwork, and local progress tracking.

## What Is Included

- Dashboard with lesson cards and taught/available status
- Lesson detail panel with discussion questions and NLT scripture links
- Content calendar with Sunday lessons and Wednesday carryover entries
- My Group roster with student contact and emergency details
- Resources page for saved notes, links, activities, prayer items, and follow-ups
- Generated lesson artwork for all 52 curriculum weeks

## Run Locally

This is a static site. From the project folder, run:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173/
```

## Notes

Progress, student roster entries, and saved resources currently use browser localStorage. Before sharing this broadly with real student data, add authentication and a secure database/backend.
