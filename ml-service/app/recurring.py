import re
from collections import Counter
from datetime import date, timedelta

import numpy as np

MIN_OCCURRENCES = 3
AMOUNT_TOLERANCE = 0.15
MAX_GAP_CV = 0.2
MIN_MEDIAN_GAP_DAYS = 5

CADENCE_RANGES = [
    ("weekly", 5, 9),
    ("biweekly", 12, 17),
    ("monthly", 26, 35),
    ("yearly", 350, 380),
]


def normalize_text(text):
    stripped = re.sub(r"[\d#*]+", "", text.lower())
    return re.sub(r"\s+", " ", stripped).strip()


def label_cadence(median_gap):
    for name, low, high in CADENCE_RANGES:
        if low <= median_gap <= high:
            return name
    return f"every ~{round(median_gap)} days"


def build_series(rows):
    amounts = np.array([row["amount"] for row in rows], dtype=float)
    median_amount = float(np.median(amounts))
    if median_amount <= 0:
        return None
    members = [
        row
        for row, amount in zip(rows, amounts)
        if abs(amount - median_amount) <= AMOUNT_TOLERANCE * median_amount
    ]
    if len(members) < MIN_OCCURRENCES:
        return None

    members.sort(key=lambda row: row["date"])
    dates = [date.fromisoformat(row["date"]) for row in members]
    gaps = np.array(
        [(later - earlier).days for earlier, later in zip(dates, dates[1:])], dtype=float
    )
    gaps = gaps[gaps > 0]
    if len(gaps) < 2:
        return None

    median_gap = float(np.median(gaps))
    if median_gap < MIN_MEDIAN_GAP_DAYS:
        return None
    if float(np.std(gaps) / np.mean(gaps)) > MAX_GAP_CV:
        return None

    typical = float(np.median([row["amount"] for row in members]))
    return {
        "name": Counter(row["text"] for row in members).most_common(1)[0][0],
        "cadence": label_cadence(median_gap),
        "typical_amount": round(typical, 2),
        "next_expected": (dates[-1] + timedelta(days=round(median_gap))).isoformat(),
        "expense_ids": [row["id"] for row in members],
    }


def detect_recurring(expenses):
    groups = {}
    for row in expenses:
        key = normalize_text(row["text"])
        if not key:
            continue
        groups.setdefault(key, []).append(row)

    series = []
    for rows in groups.values():
        if len(rows) < MIN_OCCURRENCES:
            continue
        built = build_series(rows)
        if built:
            series.append(built)

    if not series:
        return {"status": "insufficient_data"}
    series.sort(key=lambda entry: -entry["typical_amount"])
    return {"status": "ok", "series": series}
