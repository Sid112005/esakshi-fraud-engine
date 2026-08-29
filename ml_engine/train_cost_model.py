import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import joblib
import os

DATA_PATH = "data/synthetic/mplads_synthetic_data.csv"
MODEL_DIR = "ml_engine/saved_models"
MODEL_PATH = os.path.join(MODEL_DIR, "cost_isolation_forest.joblib")

def train_and_save_model():
    # 1. Load the data you just generated
    print("Loading synthetic data...")
    df = pd.read_csv(DATA_PATH)

    # 2. Calculate baseline medians for every work category
    category_baselines = {}
    for cat, group in df.groupby("work_category"):
        median_cost = group["sanctioned_amount_inr"].median()
        category_baselines[cat] = {"median": float(median_cost)}

    # 3. Engineer the feature: Ratio of Actual Cost vs. Expected Cost
    def compute_ratio(row):
        median = category_baselines.get(row["work_category"], {}).get("median", 500000.0)
        return row["sanctioned_amount_inr"] / median

    df["cost_ratio"] = df.apply(compute_ratio, axis=1)

    # 4. Train the AI (Isolation Forest)
    print("Training Isolation Forest Anomaly Detector...")
    X = df[["cost_ratio"]].values
    
    # We expect roughly 5-7% of our data to be fraudulent based on your generator
    model = IsolationForest(n_estimators=100, contamination=0.07, random_state=42)
    model.fit(X)

    # 5. Save the trained model to disk
    os.makedirs(MODEL_DIR, exist_ok=True)
    artifact = {
        "model": model,
        "category_baselines": category_baselines,
        "version": "1.0.0"
    }
    
    joblib.dump(artifact, MODEL_PATH)
    print(f"CRITICAL SUCCESS: AI Model saved to {MODEL_PATH}")

if __name__ == "__main__":
    train_and_save_model()