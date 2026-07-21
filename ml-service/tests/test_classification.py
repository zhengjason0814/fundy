from app.classification import suggest_category


def build_history():
    coffee = [{"text": f"starbucks order {i}", "category": "Coffee"} for i in range(6)]
    groceries = [{"text": f"whole foods market {i}", "category": "Groceries"} for i in range(6)]
    return coffee + groceries


def test_suggests_repeat_merchant():
    result = suggest_category(build_history(), "starbucks downtown")
    assert result["category"] == "Coffee"
    assert 0.5 <= result["confidence"] <= 1.0


def test_too_little_history_falls_back_to_other():
    history = build_history()[:8]
    assert suggest_category(history, "starbucks downtown") == {"category": "Other", "confidence": 0.0}


def test_single_category_falls_back_to_other():
    history = [{"text": f"starbucks {i}", "category": "Coffee"} for i in range(12)]
    assert suggest_category(history, "starbucks downtown") == {"category": "Other", "confidence": 0.0}
