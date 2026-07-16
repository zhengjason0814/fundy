from fastapi import FastAPI

app = FastAPI(title="Fundy ML Service")


@app.get("/health")
def health():
    return {"status": "ok"}
