import pandas as pd
import sqlite3
import os

RAW_CSV_PATH = "data/raw/mplads_allocations_raw.csv"
DB_PATH = "data/esakshi.db"

def run_etl():
    print("Extracting MoSPI allocation data...")
    if not os.path.exists(RAW_CSV_PATH):
        print(f"CRITICAL ERROR: Could not find {RAW_CSV_PATH}")
        return
        
    # 1. EXTRACT
    df = pd.read_csv(RAW_CSV_PATH)
    
    # 2. TRANSFORM
    print("Transforming and cleaning schema...")
    
    # Remove the 'Grand Total' row
    df = df[df['Sr. No.'] != 'Grand Total']
    
    # Standardize column names for the SQL backend
    df = df.rename(columns={
        "Sr. No.": "sr_no",
        "State": "state",
        "Hon'ble Members of Parliaments": "mp_name",
        "Constituency": "constituency",
        "Allocated AMOUNT ( ₹ )": "allocated_amount_inr"
    })
    
    # Force the amount column into proper floats, dropping empty values
    df['allocated_amount_inr'] = pd.to_numeric(df['allocated_amount_inr'], errors='coerce')
    df = df.dropna(subset=['allocated_amount_inr', 'mp_name'])
    
    # 3. LOAD
    print(f"Loading into SQLite database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    
    # Write to a clean table
    df.to_sql("mp_allocations", conn, if_exists="replace", index=False)
    
    # Verify the insertion
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM mp_allocations")
    count = cursor.fetchone()[0]
    
    # Quick schema validation check
    cursor.execute("SELECT mp_name, allocated_amount_inr FROM mp_allocations LIMIT 1")
    sample = cursor.fetchone()
    
    print(f"SUCCESS: {count} MP allocation records ingested.")
    print(f"Sample Record: {sample[0]} | Budget: ₹{sample[1]:,.2f}")
    
    conn.close()

if __name__ == "__main__":
    run_etl()