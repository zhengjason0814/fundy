from app.classification import MODEL_PATH, suggest_category, train


def build_corpus():
    texts = (
        ["grocery shopping"] * 6
        + ["milk and eggs run"] * 6
        + ["coffee with friends"] * 6
        + ["dinner at restaurant"] * 6
    )
    labels = (
        ["Groceries"] * 6
        + ["Groceries"] * 6
        + ["Dining"] * 6
        + ["Dining"] * 6
    )
    return texts, labels


def test_suggests_trained_category():
    texts, labels = build_corpus()
    model = train(texts, labels)
    result = suggest_category("grocery run", model=model)
    assert result["category"] == "Groceries"
    assert result["confidence"] >= 0.5


def test_falls_back_to_other_with_no_model():
    assert suggest_category("anything", model=None) == {"category": "Other", "confidence": 0.0}


def test_real_model_suggests_groceries():
    if not MODEL_PATH.exists():
        return
    result = suggest_category("grocery shopping")
    assert result["category"] == "Groceries"


def test_real_model_suggests_dining():
    if not MODEL_PATH.exists():
        return
    result = suggest_category("dinner at a restaurant")
    assert result["category"] == "Dining"
