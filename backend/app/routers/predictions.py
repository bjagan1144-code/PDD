from fastapi import APIRouter, Depends, HTTPException
from app.ml.predictor import run_ai_prediction, MODEL_METRICS

router = APIRouter(prefix="/api/predictions", tags=["AI Predictions"])

@router.get("/metrics")
def get_model_metrics():
    """ Returns the AI regression model validation parameters, accuracy scores, and synthetic limitations """
    return MODEL_METRICS

@router.post("/predict")
def predict_release(params: dict):
    """
    Runs the Random Forest ML prediction model for cumulative drug release.
    Returns computational predictions alongside model versioning.
    """
    try:
        prediction = run_ai_prediction(params)
        return {
            "prediction": prediction,
            "metrics": MODEL_METRICS
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference run failed: {e}")
