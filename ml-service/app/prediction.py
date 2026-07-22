import calendar
from datetime import date

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor

MIN_COMPLETE_MONTHS = 6
QUANTILE_ALPHAS = [0.1, 0.5, 0.9]


def _daily_totals_by_month(expenses):
    totals = {}
    for expense in expenses:
        day = date.fromisoformat(expense["date"][:10])
        month = totals.setdefault((day.year, day.month), {})
        month[day.day] = month.get(day.day, 0.0) + float(expense["amount"])
    return totals


def _training_rows(daily_by_month, months):
    features = []
    targets = []
    for year, month in months:
        days = calendar.monthrange(year, month)[1]
        daily = daily_by_month[(year, month)]
        month_total = sum(daily.values())
        running = 0.0
        for day in range(1, days + 1):
            running += daily.get(day, 0.0)
            features.append([day / days, running])
            targets.append(month_total)
    return np.array(features), np.array(targets)


def _quantile_range(models, feature_row, floor=0.0):
    values = sorted(max(float(model.predict([feature_row])[0]), floor) for model in models)
    return {"low": round(values[0], 2), "mid": round(values[1], 2), "high": round(values[2], 2)}


def predict_spend(expenses, as_of):
    as_of_date = date.fromisoformat(as_of)
    daily_by_month = _daily_totals_by_month(expenses)
    current_key = (as_of_date.year, as_of_date.month)
    complete_months = sorted(key for key in daily_by_month if key < current_key)
    if len(complete_months) < MIN_COMPLETE_MONTHS:
        return {"status": "insufficient_data"}

    features, targets = _training_rows(daily_by_month, complete_months)
    models = [
        GradientBoostingRegressor(loss="quantile", alpha=alpha, random_state=0).fit(features, targets)
        for alpha in QUANTILE_ALPHAS
    ]

    days_in_current = calendar.monthrange(as_of_date.year, as_of_date.month)[1]
    current_daily = daily_by_month.get(current_key, {})
    spent_so_far = sum(amount for day, amount in current_daily.items() if day <= as_of_date.day)

    current_range = _quantile_range(
        models, [as_of_date.day / days_in_current, spent_so_far], floor=spent_so_far
    )
    next_range = _quantile_range(models, [0.0, 0.0])

    return {
        "status": "ok",
        "current_month": {**current_range, "spent_so_far": round(spent_so_far, 2)},
        "next_month": next_range,
    }
