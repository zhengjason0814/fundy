from app.prediction import predict_spend


def steady_month(year, month, days, per_day):
    return [
        {"date": f"{year:04d}-{month:02d}-{day:02d}", "amount": per_day}
        for day in range(1, days + 1)
    ]


def build_history():
    expenses = []
    expenses += steady_month(2026, 4, 30, 10.0)
    expenses += steady_month(2026, 5, 31, 10.0)
    expenses += steady_month(2026, 6, 30, 10.0)
    expenses += steady_month(2026, 7, 16, 10.0)
    return expenses


def test_insufficient_history():
    expenses = steady_month(2026, 6, 30, 10.0) + steady_month(2026, 7, 16, 10.0)
    assert predict_spend(expenses, "2026-07-16") == {"status": "insufficient_data"}


def test_projects_steady_spending():
    result = predict_spend(build_history(), "2026-07-16")
    assert result["status"] == "ok"
    current = result["current_month"]
    assert current["spent_so_far"] == 160.0
    assert current["low"] <= current["mid"] <= current["high"]
    assert 200 <= current["mid"] <= 400
    assert current["low"] >= current["spent_so_far"]


def test_next_month_forecast_in_plausible_range():
    result = predict_spend(build_history(), "2026-07-16")
    next_month = result["next_month"]
    assert next_month["low"] <= next_month["mid"] <= next_month["high"]
    assert 150 <= next_month["mid"] <= 450
