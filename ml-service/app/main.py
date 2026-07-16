from fastapi import FastAPI

from .anomalies import detect_anomalies
from .classification import suggest_category
from .prediction import predict_spend
from .schemas import AnomaliesRequest, ClassifyRequest, PredictRequest

app = FastAPI(title="Fundy ML Service")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
def predict(request: PredictRequest):
    expenses = [point.model_dump() for point in request.expenses]
    return predict_spend(expenses, request.as_of)


@app.post("/classify")
def classify(request: ClassifyRequest):
    history = [row.model_dump() for row in request.history]
    suggestion = suggest_category(history, request.text)
    if suggestion is None:
        return {"status": "no_suggestion"}
    return {"status": "ok", **suggestion}


@app.post("/anomalies")
def anomalies(request: AnomaliesRequest):
    expenses = [expense.model_dump() for expense in request.expenses]
    return {"status": "ok", "anomalies": detect_anomalies(expenses)}
