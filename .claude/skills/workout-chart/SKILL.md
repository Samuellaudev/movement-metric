---
name: workout-chart
description: Generate a monthly workout frequency bar chart for this lifting diary project. Use this skill whenever the user asks to visualize, plot, chart, or graph workout data, workout frequency, or workout history — even if they say "show me my workouts", "how many times did I work out", or "export a chart". The skill queries the Neon PostgreSQL database defined in .env and produces a PNG bar chart (x-axis: month, y-axis: number of workouts) for the past 12 months.
---

# Workout Chart Skill

Generates a bar chart of monthly workout counts for the past year, exported as a PNG image.

## What this skill does

1. Reads `DATABASE_URL` from the `.env` file in the project root
2. Connects to the PostgreSQL database and queries the `workouts` table
3. Groups workout counts by calendar month for the last 12 months
4. Renders a bar chart (month on x-axis, workout count on y-axis) using matplotlib
5. Saves the chart as a PNG file

## Dependencies

The bundled script requires two Python packages:

```bash
pip install psycopg2-binary matplotlib
```

If either is missing, the script will print a clear error with the install command.

## How to run

Use the bundled script at `scripts/plot_workouts.py`:

```bash
python <skill-dir>/scripts/plot_workouts.py [output_path]
```

- `output_path` is optional; defaults to `./workout_chart.png` in the current working directory.
- The script walks up the directory tree from its own location to find the `.env` file automatically, so it works regardless of where it is called from.

## Step-by-step instructions

When this skill is invoked:

1. **Check Python dependencies** — verify `psycopg2-binary` and `matplotlib` are available. If not, install them or instruct the user to do so.

2. **Determine output path** — ask the user where to save the chart if they haven't specified, or default to the project root as `workout_chart.png`.

3. **Run the script** via Bash:
   ```bash
   python .claude/skills/workout-chart/scripts/plot_workouts.py <output_path>
   ```
   Run from the project root so relative paths resolve correctly.

4. **Report the result** — confirm the output file path and offer to open it or describe what the chart shows (month breakdown, total workouts, any notable patterns).

## Database schema reference

The script queries only the `workouts` table:

| Column       | Type      | Notes                        |
|--------------|-----------|------------------------------|
| `id`         | serial    | Primary key                  |
| `user_id`    | text      | Clerk user ID                |
| `started_at` | timestamp | Used for month grouping      |

The query counts all rows per calendar month regardless of `user_id` (all users combined). If the user wants per-user filtering, pass a `user_id` argument — you will need to edit the script's SQL `WHERE` clause to add `AND user_id = %s`.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `DATABASE_URL not found in .env` | Ensure `.env` exists and contains `DATABASE_URL=...` |
| `psycopg2` import error | `pip install psycopg2-binary` |
| `matplotlib` import error | `pip install matplotlib` |
| SSL / connection errors | The Neon URL already includes `?sslmode=require` — no extra config needed |
| Empty chart (all zeros) | The database may have no workouts in the past year yet |
