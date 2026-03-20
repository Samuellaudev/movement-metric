#!/usr/bin/env python3
"""
Plot monthly workout counts for the past year from the lifting diary database.
Reads DATABASE_URL from the .env file in the project root.
Exports a bar chart as an image.
"""

import sys
from datetime import datetime, timedelta
from pathlib import Path


def load_database_url(project_root: Path) -> str:
    env_file = project_root / ".env"
    if not env_file.exists():
        sys.exit(f"ERROR: .env file not found at {env_file}")

    for line in env_file.read_text().splitlines():
        line = line.strip()
        if line.startswith("DATABASE_URL="):
            return line[len("DATABASE_URL="):]

    sys.exit("ERROR: DATABASE_URL not found in .env file")


def query_monthly_workouts(database_url: str) -> list[tuple[str, int]]:
    """Return list of (month_label, count) for the past 12 months."""
    try:
        import psycopg2
    except ImportError:
        sys.exit(
            "ERROR: psycopg2 is not installed.\n"
            "Install it with: pip install psycopg2-binary"
        )

    now = datetime.utcnow()
    # Start of the same month one year ago (UTC, midnight)
    one_year_ago = (now.replace(day=1) - timedelta(days=365)).replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    sql = """
        SELECT
            TO_CHAR(DATE_TRUNC('month', started_at AT TIME ZONE 'UTC'), 'Mon YYYY') AS month_label,
            DATE_TRUNC('month', started_at AT TIME ZONE 'UTC') AS month_start,
            COUNT(*) AS workout_count
        FROM workouts
        WHERE started_at >= %s
          AND started_at < %s
        GROUP BY month_start, month_label
        ORDER BY month_start;
    """

    conn = psycopg2.connect(database_url)
    try:
        with conn.cursor() as cur:
            cur.execute(sql, (one_year_ago, now))
            rows = cur.fetchall()
    finally:
        conn.close()

    # Build a complete 12-month series (fill zeros for months with no workouts)
    # Strip timezone info from DB results so keys match naive datetime loop variables
    results: dict[datetime, tuple[str, int]] = {}
    for label, month_start, count in rows:
        results[month_start.replace(tzinfo=None)] = (label, int(count))

    ordered: list[tuple[str, int]] = []
    month = one_year_ago.replace(hour=0, minute=0, second=0, microsecond=0)
    while month <= now.replace(day=1, hour=0, minute=0, second=0, microsecond=0):
        key = month
        if key in results:
            ordered.append(results[key])
        else:
            ordered.append((month.strftime("%b %Y"), 0))
        # Advance by one month
        if month.month == 12:
            month = month.replace(year=month.year + 1, month=1)
        else:
            month = month.replace(month=month.month + 1)

    return ordered


def plot_chart(data: list[tuple[str, int]], output_path: Path) -> None:
    try:
        import matplotlib
        matplotlib.use("Agg")  # Non-interactive backend for file export
        import matplotlib.pyplot as plt
        from matplotlib.ticker import MaxNLocator
    except ImportError:
        sys.exit(
            "ERROR: matplotlib is not installed.\n"
            "Install it with: pip install matplotlib"
        )

    labels = [row[0] for row in data]
    counts = [row[1] for row in data]

    fig, ax = plt.subplots(figsize=(12, 6))

    bars = ax.bar(labels, counts, color="#4F81C7", edgecolor="white", linewidth=0.5)

    # Value labels on top of each bar
    for bar, count in zip(bars, counts):
        if count > 0:
            ax.text(
                bar.get_x() + bar.get_width() / 2,
                bar.get_height() + 0.1,
                str(count),
                ha="center",
                va="bottom",
                fontsize=9,
                fontweight="bold",
                color="#333333",
            )

    ax.set_title("Workouts per Month (Past Year)", fontsize=16, fontweight="bold", pad=16)
    ax.set_xlabel("Month", fontsize=12, labelpad=8)
    ax.set_ylabel("Number of Workouts", fontsize=12, labelpad=8)
    ax.set_ylim(0, max(counts or [1]) + 2)
    ax.yaxis.set_major_locator(MaxNLocator(integer=True))

    plt.xticks(rotation=45, ha="right", fontsize=9)
    plt.tight_layout()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=150, bbox_inches="tight")
    plt.close(fig)
    print(f"Chart saved to: {output_path}")


def main() -> None:
    # Allow overriding the output path via CLI argument
    if len(sys.argv) >= 2:
        output_path = Path(sys.argv[1])
    else:
        output_path = Path.cwd() / "workout_chart.png"

    # Locate project root: walk up until we find a .env file
    project_root = Path(__file__).resolve()
    for _ in range(10):
        project_root = project_root.parent
        if (project_root / ".env").exists():
            break
    else:
        # Fall back to current working directory
        project_root = Path.cwd()

    print(f"Using project root: {project_root}")

    database_url = load_database_url(project_root)
    print("Querying workout data for the past year...")

    data = query_monthly_workouts(database_url)
    total = sum(c for _, c in data)
    print(f"Found {total} workouts across {len(data)} months")

    for label, count in data:
        print(f"  {label}: {count}")

    plot_chart(data, output_path)


if __name__ == "__main__":
    main()
