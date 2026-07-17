from app.anomalies import detect_anomalies


def coffee(id, amount):
    return {"id": id, "category": "Coffee", "amount": amount, "date": "2026-07-01"}


def test_flags_high_outlier():
    expenses = [coffee(str(i), 5.0 + i * 0.1) for i in range(8)] + [coffee("big", 95.0)]
    anomalies = detect_anomalies(expenses)
    assert [a["id"] for a in anomalies] == ["big"]
    assert anomalies[0]["score"] > 3.5
    assert anomalies[0]["typical_low"] < anomalies[0]["typical_high"] < 95


def test_normal_amounts_not_flagged():
    expenses = [coffee(str(i), 5.0 + i * 0.1) for i in range(8)] + [coffee("ok", 6.0)]
    assert detect_anomalies(expenses) == []


def test_small_category_never_judged():
    expenses = [coffee(str(i), 5.0) for i in range(3)] + [coffee("big", 95.0)]
    assert detect_anomalies(expenses) == []


def test_identical_amounts_skipped():
    expenses = [coffee(str(i), 5.0) for i in range(10)]
    assert detect_anomalies(expenses) == []


def test_low_outlier_not_flagged():
    expenses = [coffee(str(i), 50.0 + i) for i in range(8)] + [coffee("tiny", 0.5)]
    assert detect_anomalies(expenses) == []


def test_majority_identical_amounts_still_flags_outliers():
    expenses = [coffee(str(i), 3.0) for i in range(12)]
    expenses += [coffee("big1", 1231.0), coffee("big2", 1231.0)]
    anomalies = detect_anomalies(expenses)
    assert sorted(a["id"] for a in anomalies) == ["big1", "big2"]
    assert all(a["score"] == 5.6 for a in anomalies)
