from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_predict_insufficient_data():
    response = client.post("/predict", json={"as_of": "2026-07-16", "expenses": []})
    assert response.status_code == 200
    assert response.json() == {"status": "insufficient_data"}


def test_predict_ok():
    expenses = [
        {"date": f"2026-{month:02d}-{day:02d}", "amount": 10.0}
        for month in (4, 5, 6)
        for day in range(1, 29)
    ]
    response = client.post("/predict", json={"as_of": "2026-07-16", "expenses": expenses})
    body = response.json()
    assert body["status"] == "ok"
    assert body["current_month"]["low"] <= body["current_month"]["high"]
    assert "next_month" in body


def test_classify_no_suggestion_on_thin_history():
    response = client.post("/classify", json={"history": [], "text": "starbucks"})
    assert response.json() == {"status": "no_suggestion"}


def test_classify_ok():
    history = [{"text": f"starbucks {i}", "category": "Coffee"} for i in range(6)]
    history += [{"text": f"whole foods {i}", "category": "Groceries"} for i in range(6)]
    response = client.post("/classify", json={"history": history, "text": "starbucks downtown"})
    body = response.json()
    assert body["status"] == "ok"
    assert body["category"] == "Coffee"


def test_anomalies_endpoint():
    expenses = [
        {"id": str(i), "category": "Coffee", "amount": 5.0 + i * 0.1, "date": "2026-07-01"}
        for i in range(8)
    ]
    expenses.append({"id": "big", "category": "Coffee", "amount": 95.0, "date": "2026-07-02"})
    response = client.post("/anomalies", json={"expenses": expenses})
    body = response.json()
    assert body["status"] == "ok"
    assert [a["id"] for a in body["anomalies"]] == ["big"]
