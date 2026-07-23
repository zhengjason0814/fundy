from app.recurring import detect_recurring


def monthly_rows(text, amount, day=9, months=(1, 2, 3, 4)):
    return [
        {"id": f"{text}-{month}", "text": text, "amount": amount, "date": f"2026-{month:02d}-{day:02d}"}
        for month in months
    ]


def test_detects_steady_monthly_series():
    result = detect_recurring(monthly_rows("Netflix #4821", 15.49))
    assert result["status"] == "ok"
    series = result["series"][0]
    assert series["name"] == "Netflix #4821"
    assert series["cadence"] == "monthly"
    assert series["typical_amount"] == 15.49
    assert series["next_expected"] == "2026-05-10"
    assert len(series["expense_ids"]) == 4


def test_groups_despite_varying_digits():
    rows = [
        {"id": "a", "text": "Netflix #101", "amount": 15.49, "date": "2026-01-09"},
        {"id": "b", "text": "Netflix #202", "amount": 15.49, "date": "2026-02-09"},
        {"id": "c", "text": "Netflix #303", "amount": 15.49, "date": "2026-03-09"},
    ]
    result = detect_recurring(rows)
    assert result["status"] == "ok"
    assert result["series"][0]["expense_ids"] == ["a", "b", "c"]


def test_two_occurrences_is_insufficient():
    result = detect_recurring(monthly_rows("Spotify", 9.99, months=(1, 2)))
    assert result == {"status": "insufficient_data"}


def test_irregular_gaps_rejected():
    rows = [
        {"id": "a", "text": "Cafe", "amount": 5.0, "date": "2026-01-01"},
        {"id": "b", "text": "Cafe", "amount": 5.0, "date": "2026-01-04"},
        {"id": "c", "text": "Cafe", "amount": 5.0, "date": "2026-02-20"},
        {"id": "d", "text": "Cafe", "amount": 5.0, "date": "2026-02-22"},
    ]
    assert detect_recurring(rows) == {"status": "insufficient_data"}


def test_amount_drift_splits_cluster():
    rows = monthly_rows("Gym", 45.0, months=(1, 2, 3)) + [
        {"id": "gift", "text": "Gym", "amount": 300.0, "date": "2026-04-09"}
    ]
    result = detect_recurring(rows)
    assert result["status"] == "ok"
    assert "gift" not in result["series"][0]["expense_ids"]


def test_weekly_cadence_labeled():
    rows = [
        {"id": str(day), "text": "Cleaner", "amount": 80.0, "date": f"2026-03-{day:02d}"}
        for day in (1, 8, 15, 22)
    ]
    result = detect_recurring(rows)
    assert result["series"][0]["cadence"] == "weekly"


def test_same_day_duplicates_tolerated():
    rows = monthly_rows("Rent", 1800.0, months=(1, 2, 3)) + [
        {"id": "dupe", "text": "Rent", "amount": 1800.0, "date": "2026-03-09"}
    ]
    result = detect_recurring(rows)
    assert result["status"] == "ok"
    assert result["series"][0]["cadence"] == "monthly"


def test_series_sorted_by_typical_amount_desc():
    rows = monthly_rows("Netflix", 15.49) + monthly_rows("Rent", 1800.0)
    result = detect_recurring(rows)
    assert [s["name"] for s in result["series"]] == ["Rent", "Netflix"]


def test_empty_input():
    assert detect_recurring([]) == {"status": "insufficient_data"}


def test_large_but_irregular_gaps_rejected_by_cv():
    rows = [
        {"id": "a", "text": "Contractor", "amount": 200.0, "date": "2026-01-01"},
        {"id": "b", "text": "Contractor", "amount": 200.0, "date": "2026-01-21"},
        {"id": "c", "text": "Contractor", "amount": 200.0, "date": "2026-03-02"},
        {"id": "d", "text": "Contractor", "amount": 200.0, "date": "2026-03-27"},
    ]
    assert detect_recurring(rows) == {"status": "insufficient_data"}


def test_purely_numeric_text_rows_ignored():
    rows = [
        {"id": str(month), "text": "12345", "amount": 20.0, "date": f"2026-{month:02d}-09"}
        for month in (1, 2, 3)
    ]
    assert detect_recurring(rows) == {"status": "insufficient_data"}
