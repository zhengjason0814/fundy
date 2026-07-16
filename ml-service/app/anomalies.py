import numpy as np

MIN_CATEGORY_SIZE = 5
Z_THRESHOLD = 3.5
MAD_SCALE = 0.6745


def detect_anomalies(expenses):
    by_category = {}
    for expense in expenses:
        by_category.setdefault(expense["category"], []).append(expense)

    anomalies = []
    for category, items in by_category.items():
        if len(items) < MIN_CATEGORY_SIZE:
            continue
        amounts = np.array([item["amount"] for item in items], dtype=float)
        median = float(np.median(amounts))
        mad = float(np.median(np.abs(amounts - median)))
        if mad == 0:
            continue
        typical_low, typical_high = np.percentile(amounts, [25, 75])
        for item in items:
            amount = float(item["amount"])
            if amount <= median:
                continue
            score = MAD_SCALE * (amount - median) / mad
            if score > Z_THRESHOLD:
                anomalies.append({
                    "id": item["id"],
                    "category": category,
                    "amount": amount,
                    "score": round(score, 1),
                    "typical_low": round(float(typical_low), 2),
                    "typical_high": round(float(typical_high), 2),
                })
    return anomalies
