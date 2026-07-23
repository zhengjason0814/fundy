from fastapi import FastAPI

from .anomalies import detect_anomalies
from .classification import suggest_category
from .prediction import predict_spend
from .recurring import detect_recurring
from .schemas import AnomaliesRequest, ClassifyRequest, PredictRequest, RecurringRequest

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
    suggestion = suggest_category(request.text)
    return {"status": "ok", **suggestion}


@app.post("/anomalies")
def anomalies(request: AnomaliesRequest):
    expenses = [expense.model_dump() for expense in request.expenses]
    return {"status": "ok", "anomalies": detect_anomalies(expenses)}


@app.post("/recurring")
def recurring(request: RecurringRequest):
    expenses = [row.model_dump() for row in request.expenses]
    return detect_recurring(expenses)
