from pathlib import Path

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline, make_union

MIN_CONFIDENCE = 0.3
MODEL_PATH = Path(__file__).parent / "models" / "category_classifier.joblib"


def build_pipeline():
    vectorizer = make_union(
        TfidfVectorizer(analyzer="word", ngram_range=(1, 2)),
        TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 4)),
    )
    return make_pipeline(
        vectorizer, LogisticRegression(max_iter=1000, class_weight="balanced")
    )


def train(texts, labels):
    model = build_pipeline()
    model.fit(texts, labels)
    return model


def _load_model():
    if not MODEL_PATH.exists():
        return None
    import joblib

    return joblib.load(MODEL_PATH)


_model = _load_model()


def suggest_category(text, model=_model):
    if model is None:
        return {"category": "Other", "confidence": 0.0}

    probabilities = model.predict_proba([text])[0]
    best = int(probabilities.argmax())
    confidence = float(probabilities[best])
    if confidence < MIN_CONFIDENCE:
        return {"category": "Other", "confidence": 0.0}
    return {"category": str(model.classes_[best]), "confidence": round(confidence, 2)}
