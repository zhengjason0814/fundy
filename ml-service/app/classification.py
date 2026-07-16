from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline, make_union

MIN_HISTORY = 10
MIN_CONFIDENCE = 0.5


def suggest_category(history, text):
    if len(history) < MIN_HISTORY:
        return None
    if len({row["category"] for row in history}) < 2:
        return None

    texts = [row["text"] for row in history]
    labels = [row["category"] for row in history]
    vectorizer = make_union(
        TfidfVectorizer(analyzer="word", ngram_range=(1, 2)),
        TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 4)),
    )
    model = make_pipeline(vectorizer, LogisticRegression(max_iter=1000))
    model.fit(texts, labels)

    probabilities = model.predict_proba([text])[0]
    best = int(probabilities.argmax())
    confidence = float(probabilities[best])
    if confidence < MIN_CONFIDENCE:
        return None
    return {"category": str(model.classes_[best]), "confidence": round(confidence, 2)}
