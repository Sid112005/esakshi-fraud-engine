import os
import sqlite3
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Query

analytics_router = APIRouter(
    prefix="/api/v1",
    tags=["Scheme Analytics & Predictive Early-Warning"]
)

DATA_PATH = os.path.join("data", "synthetic", "mplads_synthetic_data.csv")
DB_PATH = os.path.join("data", "esakshi.db")

def load_data() -> pd.DataFrame:
    if os.path.exists(DATA_PATH):
        df = pd.read_csv(DATA_PATH)
        df["sanction_date"] = pd.to_datetime(df["sanction_date"], errors="coerce")
        df["month"] = df["sanction_date"].dt.strftime("%Y-%m")
        return df
    return pd.DataFrame()

@analytics_router.get("/scheme-trends")
def get_scheme_trends(
    state: Optional[str] = Query(None, description="Filter by State"),
    district: Optional[str] = Query(None, description="Filter by District")
):
    """
    Computes spend-over-time, state/district breakdown, and scheme KPIs for auditor dashboards.
    Supports role-filtered drill-down (National / State Nodal / District Authority).
    """
    df = load_data()
    if df.empty:
        return {
            "total_sanctioned_inr": 0,
            "total_projects": 0,
            "delayed_projects_count": 0,
            "fraud_cases_count": 0,
            "monthly_trends": [],
            "state_breakdown": [],
            "district_breakdown": [],
            "category_breakdown": []
        }

    # Apply filters
    if state and state.lower() != "all" and state.lower() != "national":
        df = df[df["state"].str.lower() == state.lower()]
    if district and district.lower() != "all":
        df = df[df["district"].str.lower() == district.lower()]

    total_sanctioned = float(df["sanctioned_amount_inr"].sum())
    total_projects = int(len(df))
    delayed_count = int(len(df[df["fraud_type"] == "Delayed Completion"]))
    fraud_count = int(len(df[df["fraud_label"] == 1]))

    # 1. Monthly Trends (Spend over time)
    monthly_grp = df.groupby("month").agg(
        total_sanctioned=("sanctioned_amount_inr", "sum"),
        project_count=("project_id", "count")
    ).reset_index().sort_values("month")

    monthly_trends = [
        {
            "month": str(row["month"]),
            "total_sanctioned": float(round(row["total_sanctioned"], 2)),
            "project_count": int(row["project_count"])
        }
        for _, row in monthly_grp.iterrows()
    ]

    # 2. State Breakdown
    state_grp = df.groupby("state").agg(
        total_sanctioned=("sanctioned_amount_inr", "sum"),
        project_count=("project_id", "count"),
        fraud_count=("fraud_label", "sum")
    ).reset_index().sort_values("total_sanctioned", ascending=False)

    state_breakdown = [
        {
            "state": str(row["state"]),
            "total_sanctioned": float(round(row["total_sanctioned"], 2)),
            "project_count": int(row["project_count"]),
            "fraud_count": int(row["fraud_count"])
        }
        for _, row in state_grp.iterrows()
    ]

    # 3. District Breakdown
    dist_grp = df.groupby(["district", "state"]).agg(
        total_sanctioned=("sanctioned_amount_inr", "sum"),
        project_count=("project_id", "count"),
        fraud_count=("fraud_label", "sum")
    ).reset_index().sort_values("total_sanctioned", ascending=False)

    district_breakdown = [
        {
            "district": str(row["district"]),
            "state": str(row["state"]),
            "total_sanctioned": float(round(row["total_sanctioned"], 2)),
            "project_count": int(row["project_count"]),
            "fraud_count": int(row["fraud_count"])
        }
        for _, row in dist_grp.head(15).iterrows()
    ]

    # 4. Category Breakdown
    cat_grp = df.groupby("work_category").agg(
        total_sanctioned=("sanctioned_amount_inr", "sum"),
        project_count=("project_id", "count")
    ).reset_index().sort_values("total_sanctioned", ascending=False)

    category_breakdown = [
        {
            "category": str(row["work_category"]),
            "total_sanctioned": float(round(row["total_sanctioned"], 2)),
            "project_count": int(row["project_count"])
        }
        for _, row in cat_grp.iterrows()
    ]

    return {
        "filter_applied": {"state": state, "district": district},
        "total_sanctioned_inr": total_sanctioned,
        "total_projects": total_projects,
        "delayed_projects_count": delayed_count,
        "fraud_cases_count": fraud_count,
        "monthly_trends": monthly_trends,
        "state_breakdown": state_breakdown,
        "district_breakdown": district_breakdown,
        "category_breakdown": category_breakdown
    }

@analytics_router.get("/predictive-alerts")
def get_predictive_alerts(
    state: Optional[str] = Query(None, description="Filter by State"),
    district: Optional[str] = Query(None, description="Filter by District")
):
    """
    Predictive Early-Warning Service:
    Calculates cumulative expenditure velocity over time for each district/constituency,
    fits a 1st-degree polynomial trend line (numpy.polyfit), and projects forward to detect
    early risk of budget exhaustion or runaway capital concentration before the scheme period ends.
    """
    df = load_data()
    if df.empty:
        return {"predictive_alerts": [], "total_at_risk_entities": 0}

    if state and state.lower() != "all" and state.lower() != "national":
        df = df[df["state"].str.lower() == state.lower()]
    if district and district.lower() != "all":
        df = df[df["district"].str.lower() == district.lower()]

    alerts = []
    
    # Analyze cumulative expenditure velocity per district
    for (st, dist), group in df.groupby(["state", "district"]):
        if len(group) < 5:
            continue

        sorted_grp = group.sort_values("sanction_date").copy()
        sorted_grp["cum_spend"] = sorted_grp["sanctioned_amount_inr"].cumsum()

        # Fit linear trend to day offsets
        min_date = sorted_grp["sanction_date"].min()
        if pd.isna(min_date):
            continue

        x_days = (sorted_grp["sanction_date"] - min_date).dt.days.values
        y_spend = sorted_grp["cum_spend"].values

        if len(x_days) < 3 or x_days[-1] == 0:
            continue

        # Linear regression slope (spend per day)
        slope, intercept = np.polyfit(x_days, y_spend, 1)

        # Extrapolate to 2-year horizon (730 days)
        projected_spend_2yr = float(slope * 730 + intercept)
        current_spend = float(y_spend[-1])

        # Benchmark district allocation cap (e.g. ~₹25 Crore per district multi-year average)
        district_baseline_allocation = 25000000.0

        if projected_spend_2yr > (district_baseline_allocation * 1.35) and slope > 0:
            overrun_amount = projected_spend_2yr - district_baseline_allocation
            days_to_breach = int((district_baseline_allocation - intercept) / slope) if slope > 0 else 730
            exhaustion_date = (min_date + timedelta(days=max(30, days_to_breach))).strftime("%Y-%m-%d")

            alerts.append({
                "entity": f"{dist} District ({st})",
                "state": st,
                "district": dist,
                "alert_type": "PROJECTED_ALLOCATION_OVERRUN",
                "severity": "HIGH" if projected_spend_2yr > (district_baseline_allocation * 1.6) else "MEDIUM",
                "current_spend_inr": round(current_spend, 2),
                "allocated_ceiling_inr": district_baseline_allocation,
                "projected_spend_inr": round(projected_spend_2yr, 2),
                "projected_overrun_inr": round(overrun_amount, 2),
                "burn_rate_daily_inr": round(float(slope), 2),
                "projected_exhaustion_date": exhaustion_date,
                "explanation": (
                    f"Linear trend extrapolation ({slope:,.0f} INR/day) projects total expenditure will reach "
                    f"₹{projected_spend_2yr:,.0f} (overrun of ₹{overrun_amount:,.0f} by {exhaustion_date})."
                )
            })

    alerts.sort(key=lambda a: a["projected_overrun_inr"], reverse=True)

    return {
        "total_at_risk_entities": len(alerts),
        "predictive_alerts": alerts
    }
