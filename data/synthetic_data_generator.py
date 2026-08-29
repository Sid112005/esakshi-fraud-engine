import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import uuid
import os

# --- Configurations ---
NUM_RECORDS = 1000
DISTRICTS = ["Thane", "Pune", "Nagpur", "Nashik", "Palghar"]
CATEGORIES = {
    "Solar Street Light": {"base_cost": 75000, "variance": 10000},
    "Community Hall": {"base_cost": 1500000, "variance": 200000},
    "Drinking Water Plant": {"base_cost": 500000, "variance": 50000},
    "School Boundary Wall": {"base_cost": 300000, "variance": 30000},
    "Road Repair": {"base_cost": 800000, "variance": 100000}
}
CONTRACTORS = [f"Contractor_{i}" for i in range(1, 51)]

def generate_normal_data(num_records):
    data = []
    start_date = datetime(2025, 1, 1)
    
    for _ in range(num_records):
        cat = random.choice(list(CATEGORIES.keys()))
        base = CATEGORIES[cat]["base_cost"]
        var = CATEGORIES[cat]["variance"]
        
        # Normal cost within standard variance
        cost = round(random.uniform(base - var, base + var), 2)
        date = start_date + timedelta(days=random.randint(0, 365))
        
        data.append({
            "project_id": f"MPLAD-{uuid.uuid4().hex[:6].upper()}",
            "district": random.choice(DISTRICTS),
            "work_category": cat,
            "sanctioned_amount_inr": cost,
            "implementing_agency": random.choice(CONTRACTORS),
            "sanction_date": date.strftime("%Y-%m-%d"),
            "fraud_label": 0,
            "fraud_type": "None"
        })
    return data

def inject_cost_inflation(data, num_cases):
    for _ in range(num_cases):
        idx = random.randint(0, len(data) - 1)
        cat = data[idx]["work_category"]
        base = CATEGORIES[cat]["base_cost"]
        
        # Inflate cost by 300% to 500%
        inflated_cost = round(random.uniform(base * 3.0, base * 5.0), 2)
        data[idx]["sanctioned_amount_inr"] = inflated_cost
        data[idx]["fraud_label"] = 1
        data[idx]["fraud_type"] = "Cost Inflation"
    return data

def inject_tender_splitting(data, num_cases):
    # Generates identical smaller tenders just below the 1,000,000 threshold
    for _ in range(num_cases):
        date = (datetime(2025, 1, 1) + timedelta(days=random.randint(0, 365))).strftime("%Y-%m-%d")
        district = random.choice(DISTRICTS)
        contractor = random.choice(CONTRACTORS)
        
        for _ in range(random.randint(3, 5)):
            data.append({
                "project_id": f"MPLAD-{uuid.uuid4().hex[:6].upper()}",
                "district": district,
                "work_category": "Road Repair",
                "sanctioned_amount_inr": round(random.uniform(950000, 995000), 2),
                "implementing_agency": contractor,
                "sanction_date": date,
                "fraud_label": 1,
                "fraud_type": "Tender Splitting"
            })
    return data

if __name__ == "__main__":
    print("Initializing Data Engine...")
    
    # 1. Generate baseline clean data
    raw_data = generate_normal_data(NUM_RECORDS)
    
    # 2. Inject Anomaly Patterns
    raw_data = inject_cost_inflation(raw_data, num_cases=50)
    raw_data = inject_tender_splitting(raw_data, num_cases=20) # 20 clusters of split tenders
    
    # 3. Compile to DataFrame
    df = pd.DataFrame(raw_data)
    
    # 4. Save to CSV
    os.makedirs("data/synthetic", exist_ok=True)
    output_path = "data/synthetic/mplads_synthetic_data.csv"
    df.to_csv(output_path, index=False)
    
    print(f"Success! {len(df)} records generated.")
    print(f"Data saved to: {output_path}")
    print("\n--- Fraud Breakdown ---")
    print(df['fraud_type'].value_counts())