import calendar
from datetime import date


def days_remaining_in_month(today_iso: str) -> int:
    """Number of days left in the month including today."""
    y, m, d = (int(x) for x in today_iso.split("-"))
    last_day = calendar.monthrange(y, m)[1]
    return last_day - d + 1


def clamp_day_to_month(year: int, month: int, day: int) -> int:
    """Return day clamped to the last day of the given month (e.g. 31 → 28 in Feb)."""
    return min(day, calendar.monthrange(year, month)[1])


def year_month_from_iso(date_iso: str) -> str:
    """Return 'YYYY-MM' from a 'YYYY-MM-DD' string."""
    return date_iso[:7]


def current_year_month() -> str:
    return date.today().strftime("%Y-%m")
