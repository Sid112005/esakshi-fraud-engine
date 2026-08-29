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

DESCRIPTION_TEMPLATES = {
    "Solar Street Light": [
        "Installation of {n} solar street lights in {district} {location}",
        "Supply and erection of {n} LED solar street lights at {district} {location}",
        "Fitting {n} solar powered street lamps in {district} {location}",
        "Setup of {n} high-mast solar illumination units in {district} {location}",
        "Electrification via {n} solar street lights across {district} {location}"
    ],
    "Community Hall": [
        "Construction of community hall in {district} {location}",
        "Civil construction work of Samaj Mandir / Community Hall at {district} {location}",
        "Development and construction of public community center in {district} {location}",
        "Renovation and expansion of community hall in {district} {location}",
        "Building multipurpose cultural community hall in {district} {location}"
    ],
    "Drinking Water Plant": [
        "Boring and installation of RO drinking water plant in {district} {location}",
        "Deep tube-well drilling and solar water purification plant setup at {district} {location}",
        "Installation of clean drinking water filtration unit in {district} {location}",
        "Construction of community drinking water facility and supply pipeline in {district} {location}",
        "Borewell drilling and installation of community water purification unit in {district} {location}"
    ],
    "School Boundary Wall": [
        "Construction of protective compound boundary wall for ZP School in {district} {location}",
        "Erection of brick masonry boundary wall at Government High School, {district} {location}",
        "Reconstruction of damaged perimeter boundary wall for primary school in {district} {location}",
        "Fencing and perimeter boundary wall development for public school in {district} {location}",
        "Construction of security compound wall around Zilla Parishad school in {district} {location}"
    ],
    "Road Repair": [
        "Repair of internal road in {district} {location}",
        "Asphalt resurfacing and repair of main road in {district} {location}",
        "Concreting and repair of internal village road at {district} {location}",
        "Paver block fixing and road repair work in {district} {location}",
        "Bituminous macadam road repair and pothole filling in {district} {location}"
    ]
}

SPLIT_CLUSTER_TEMPLATES = [
    [
        "Repair of internal road in {location}",
        "Road repair work {location} internal",
        "Internal road repair and resurfacing in {location}",
        "Repair and maintenance of internal road {location}",
        "Internal road bituminous repair work at {location}"
    ],
    [
        "Installation of 15 solar street lights in {location}",
        "Fitting 15 solar powered street lamps in {location}",
        "Supply and erection of 15 solar street lights at {location}",
        "Setup of 15 solar illumination lights in {location}",
        "Installation of 15 LED solar street light units {location}"
    ],
    [
        "Construction of boundary wall for ZP School at {location}",
        "Compound boundary wall construction work ZP School {location}",
        "Erection of perimeter boundary wall for ZP School in {location}",
        "Perimeter security wall construction at ZP School {location}",
        "ZP School boundary wall development work in {location}"
    ],
    [
        "Boring and installation of drinking water plant at {location}",
        "Installation of RO drinking water plant and borewell in {location}",
        "Drinking water plant setup and tubewell boring at {location}",
        "Borewell drilling and drinking water filtration unit in {location}",
        "Community drinking water RO plant boring and installation {location}"
    ],
    [
        "Civil construction of community hall in {location}",
        "Construction work of Samaj Mandir Community Hall {location}",
        "Development of public community hall at {location}",
        "Community hall construction and civil work in {location}",
        "Building community center and hall facility at {location}"
    ]
]

def generate_location():
    loc_type = random.choice(["Sector", "Ward", "Block", "Gram Panchayat", "Zone"])
    loc_num = random.randint(1, 35)
    return f"{loc_type} {loc_num}"

def generate_normal_description(category, district):
    templates = DESCRIPTION_TEMPLATES[category]
    template = random.choice(templates)
    return template.format(
        n=random.choice([10, 15, 20, 25, 30, 40, 50]),
        district=district,
        location=generate_location()
    )

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
        district = random.choice(DISTRICTS)
        
        data.append({
            "project_id": f"MPLAD-{uuid.uuid4().hex[:6].upper()}",
            "district": district,
            "work_category": cat,
            "project_description": generate_normal_description(cat, district),
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
    # Generates identical/near-duplicate smaller tenders just below the 1,000,000 threshold within close time window
    start_base_date = datetime(2025, 1, 1)
    for _ in range(num_cases):
        cluster_base_date = start_base_date + timedelta(days=random.randint(0, 330))
        district = random.choice(DISTRICTS)
        contractor = random.choice(CONTRACTORS)
        
        # Pick category and matching template cluster for near-duplicate descriptions
        category_clusters = [
            ("Road Repair", SPLIT_CLUSTER_TEMPLATES[0]),
            ("Solar Street Light", SPLIT_CLUSTER_TEMPLATES[1]),
            ("School Boundary Wall", SPLIT_CLUSTER_TEMPLATES[2]),
            ("Drinking Water Plant", SPLIT_CLUSTER_TEMPLATES[3]),
            ("Community Hall", SPLIT_CLUSTER_TEMPLATES[4])
        ]
        cat, template_set = random.choice(category_clusters)
        loc = generate_location()
        
        # Number of split fragments in this cluster
        cluster_size = random.randint(3, 5)
        # Select near duplicate descriptions
        selected_templates = random.sample(template_set, min(cluster_size, len(template_set)))
        while len(selected_templates) < cluster_size:
            selected_templates.append(random.choice(template_set))
            
        for i in range(cluster_size):
            # Split tenders usually sanctioned on the same day or within 1-10 days
            sanction_date = cluster_base_date + timedelta(days=random.randint(0, 7))
            desc = selected_templates[i].format(location=loc)
            
            data.append({
                "project_id": f"MPLAD-{uuid.uuid4().hex[:6].upper()}",
                "district": district,
                "work_category": cat,
                "project_description": desc,
                "sanctioned_amount_inr": round(random.uniform(920000, 995000), 2),
                "implementing_agency": contractor,
                "sanction_date": sanction_date.strftime("%Y-%m-%d"),
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
    print("\n--- Sample Generated Records ---")
    print(df[['project_id', 'district', 'work_category', 'project_description', 'sanctioned_amount_inr', 'fraud_type']].head(8).to_string())