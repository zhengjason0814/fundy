from pydantic import BaseModel


class ExpensePoint(BaseModel):
    date: str
    amount: float


class PredictRequest(BaseModel):
    as_of: str
    expenses: list[ExpensePoint]


class ClassifyRequest(BaseModel):
    text: str


class AnomalyExpense(BaseModel):
    id: str
    category: str
    amount: float
    date: str


class AnomaliesRequest(BaseModel):
    expenses: list[AnomalyExpense]
