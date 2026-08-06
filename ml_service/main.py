"""
main.py
=======
FastAPI ML Fuel Intelligence Microservice
==========================================

Endpoints:
  POST /predict-fuel      — predict fuel for a trip (uses trained model)
  POST /retrain           — retrain the model on new trip data from Laravel
  GET  /model-status      — return current model metrics
  GET  /health            — simple health check
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import logging

from model_trainer import train, predict_single, load_model, load_meta

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# ---- App ----------------------------------------------------------------
app = FastAPI(
    title="Fuel Intelligence ML Engine",
    description="Gradient Boosted Machine Learning service for fuel consumption prediction.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-load model at startup
_model = None

@app.on_event("startup")
async def startup_event():
    global _model
    logger.info("Loading / training ML model on startup...")
    try:
        _model = load_model()
        meta = load_meta()
        logger.info(f"Model ready | R²={meta.get('r2')} | MAE={meta.get('mae_liters')}L | n={meta.get('n_samples')}")
    except Exception as e:
        logger.error(f"Startup model load failed: {e}")


# ---- Request / Response models ------------------------------------------

class TripFeatures(BaseModel):
    distance_km:       float = Field(..., description="Trip distance in km", ge=0)
    cargo_weight:      float = Field(0.0, description="Cargo weight in kg")
    vehicle_capacity:  float = Field(10000.0, description="Vehicle capacity in kg")
    driver_score:      float = Field(75.0, description="Driver efficiency score 0-100")
    vehicle_age_km:    float = Field(50000.0, description="Odometer reading in km")
    vehicle_type:      str   = Field("truck", description="truck|semi|mini|van|other")
    route_terrain:     str   = Field("mixed", description="flat|mixed|hilly|mountain")
    traffic_index:     str   = Field("mixed", description="highway|mixed|urban")
    temp_celsius:      float = Field(28.0, description="Ambient temperature °C")

class PredictResponse(BaseModel):
    model_config = {"protected_namespaces": ()}

    predicted_fuel_liters: float
    ci_lower_liters:       float
    ci_upper_liters:       float
    confidence_interval:   str
    feature_importances:   dict
    model_r2:              float
    model_mae:             float
    model_source:          str
    n_training_samples:    int
    trained_at:            Optional[str]

class RetrainRequest(BaseModel):
    trips: list[dict] = Field(..., description="List of completed trip records with actual_fuel_liters")

class RetrainResponse(BaseModel):
    success:    bool
    r2:         float
    mae_liters: float
    rmse_liters: float
    n_samples:  int
    source:     str
    trained_at: str


# ---- Routes -------------------------------------------------------------

@app.get("/health")
def health():
    meta = load_meta()
    return {
        "status":    "ok",
        "model_ready": bool(meta),
        "r2":         meta.get("r2"),
        "mae_liters": meta.get("mae_liters"),
        "trained_at": meta.get("trained_at"),
        "n_samples":  meta.get("n_samples"),
    }


@app.get("/model-status")
def model_status():
    meta = load_meta()
    if not meta:
        raise HTTPException(status_code=404, detail="Model not trained yet.")
    return meta


@app.post("/predict-fuel", response_model=PredictResponse)
def predict_fuel(trip: TripFeatures):
    global _model
    try:
        result = predict_single(trip.model_dump(), model=_model)
        return result
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


def _retrain_background(trips: list[dict]):
    global _model
    try:
        meta = train(trips)
        _model = load_model()
        logger.info(f"Background retrain complete | R²={meta['r2']} | n={meta['n_samples']}")
    except Exception as e:
        logger.error(f"Background retrain failed: {e}")


@app.post("/retrain", response_model=RetrainResponse)
def retrain(payload: RetrainRequest, background_tasks: BackgroundTasks):
    """
    Retrain the model on new trip data.
    Returns immediately with a 'scheduled' message if > 200 trips,
    otherwise trains synchronously.
    """
    trips = payload.trips

    if len(trips) < 5:
        raise HTTPException(status_code=400, detail="Need at least 5 completed trips to retrain.")

    if len(trips) > 200:
        background_tasks.add_task(_retrain_background, trips)
        meta = load_meta()
        return {
            "success":    True,
            "r2":         meta.get("r2", 0),
            "mae_liters": meta.get("mae_liters", 0),
            "rmse_liters": meta.get("rmse_liters", 0),
            "n_samples":  len(trips),
            "source":     "background_retrain_scheduled",
            "trained_at": meta.get("trained_at", ""),
        }

    meta = train(trips)
    global _model
    _model = load_model()

    return {
        "success":    True,
        "r2":         meta["r2"],
        "mae_liters": meta["mae_liters"],
        "rmse_liters": meta["rmse_liters"],
        "n_samples":  meta["n_samples"],
        "source":     meta["source"],
        "trained_at": meta["trained_at"],
    }
