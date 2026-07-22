import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

ROOT = Path(__file__).resolve().parents[1]

from dotenv import load_dotenv

load_dotenv(ROOT / ".env")

import joblib
import pandas as pd
from kaggle.api.kaggle_api_extended import KaggleApi

from app.classification import MODEL_PATH, train

DATASET = "prasad22/daily-transactions-dataset"
DOWNLOAD_DIR = Path(__file__).resolve().parent / "data"

GROCERY_SUBCATEGORIES = {
    "Milk", "Grocery", "fruits", "vegetables", "Eggs", "flour mill", "Bread",
    "Biscuits", "curd", "Onions", "Potato", "Water", "chocolate", "Sweets",
    "Rajgira ladu",
}
DINING_SUBCATEGORIES = {
    "Lunch", "Dinner", "Tea", "snacks", "Ice cream", "breakfast", "beverage",
    "Eating out",
}

CATEGORY_MAP = {
    "Transportation": "Transportation",
    "Household": "Housing/Utilities",
    "Rent": "Housing/Utilities",
    "water (jar /tanker)": "Housing/Utilities",
    "garbage disposal": "Housing/Utilities",
    "subscription": "Entertainment",
    "Culture": "Entertainment",
    "Health": "Health/Personal Care",
    "Beauty": "Health/Personal Care",
    "Grooming": "Health/Personal Care",
    "Apparel": "Shopping/Retail",
    "maid": "General Services",
    "Cook": "General Services",
    "Self-development": "General Services",
    "Tourism": "Travel",
    "Documents": "Financial/Legal",
}

SUPPLEMENTAL_PHRASES = {
    "Groceries": [
        "grocery shopping", "grocery run", "trader joes groceries", "whole foods run",
        "supermarket trip", "weekly groceries", "kroger groceries", "safeway grocery run",
        "costco groceries", "grocery store", "milk and eggs", "produce and vegetables",
        "grocery delivery", "instacart order", "grocery pickup",
    ],
    "Dining": [
        "starbucks coffee", "coffee shop", "lunch with coworkers", "dinner out",
        "restaurant dinner", "fast food lunch", "chipotle burrito", "mcdonalds drive thru",
        "pizza night", "sushi dinner", "brunch with friends", "takeout dinner",
        "doordash order", "uber eats delivery", "coffee run",
    ],
    "Entertainment": [
        "movie tickets", "netflix subscription", "spotify subscription", "concert tickets",
        "streaming service", "movie night", "video game purchase", "amc theater",
        "disney plus", "hulu subscription", "bowling night", "arcade games",
        "book purchase", "music subscription", "theme park tickets",
    ],
    "Housing/Utilities": [
        "electric bill", "water bill", "internet bill", "rent payment", "gas bill",
        "trash service", "cable bill", "phone bill", "home insurance", "hoa fee",
        "lawn care service", "pest control", "home repair", "furniture purchase",
        "mortgage payment",
    ],
    "Transportation": [
        "gas fill up", "gas station", "uber ride", "lyft ride", "parking fee",
        "car wash", "oil change", "car repair", "toll charge", "public transit fare",
        "subway fare", "bus pass", "car insurance", "rideshare", "gas for car",
    ],
    "Shopping/Retail": [
        "amazon purchase", "target shopping", "clothes shopping", "new shoes",
        "walmart trip", "online shopping", "electronics purchase", "home goods",
        "clothing store", "shoe store", "best buy purchase", "department store",
        "retail purchase", "online order", "new clothes",
    ],
    "Health/Personal Care": [
        "doctor visit", "pharmacy pickup", "haircut", "dentist appointment",
        "gym membership", "vitamins", "prescription refill", "eye doctor",
        "hair salon", "skincare products", "therapy session", "chiropractor visit",
        "nail salon", "massage", "co-pay",
    ],
    "Travel": [
        "flight ticket", "hotel booking", "airbnb stay", "vacation trip",
        "rental car", "airport parking", "travel insurance", "cruise booking",
        "vacation flight", "hotel stay", "trip expenses", "luggage purchase",
        "resort booking", "travel agency", "beach vacation",
    ],
    "General Services": [
        "house cleaning service", "handyman repair", "plumber visit",
        "lawn mowing service", "car detailing", "moving service", "tech support visit",
        "locksmith service", "pet grooming service", "tailoring alterations",
        "notary service", "consulting fee", "photography service", "cleaning service",
        "appliance repair",
    ],
    "Financial/Legal": [
        "bank fee", "atm fee", "tax preparation", "lawyer consultation", "notary fee",
        "wire transfer fee", "late payment fee", "accountant fee", "legal consultation",
        "financial advisor fee", "overdraft fee", "credit report fee", "insurance premium",
        "tax filing fee", "estate planning",
    ],
}


def map_row(category, subcategory):
    if category == "Food":
        if subcategory in GROCERY_SUBCATEGORIES:
            return "Groceries"
        if subcategory in DINING_SUBCATEGORIES:
            return "Dining"
        return None
    return CATEGORY_MAP.get(category)


def load_dataset():
    api = KaggleApi()
    api.authenticate()
    DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
    api.dataset_download_files(DATASET, path=str(DOWNLOAD_DIR), unzip=True)

    df = pd.read_csv(DOWNLOAD_DIR / "Daily Household Transactions.csv")
    df = df[df["Income/Expense"] == "Expense"]
    df["mapped_category"] = df.apply(
        lambda row: map_row(row["Category"], row["Subcategory"]), axis=1
    )
    df = df.dropna(subset=["mapped_category", "Note"])
    df = df[df["Note"].str.strip() != ""]
    return df["Note"].tolist(), df["mapped_category"].tolist()


def main():
    texts, labels = load_dataset()
    for category, phrases in SUPPLEMENTAL_PHRASES.items():
        texts.extend(phrases)
        labels.extend([category] * len(phrases))
    print(f"Training on {len(texts)} rows across {len(set(labels))} categories")
    model = train(texts, labels)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    print(f"Saved model to {MODEL_PATH}")


if __name__ == "__main__":
    main()
