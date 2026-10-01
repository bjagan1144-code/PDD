import math

def is_valid_num(v, min_val=None, max_val=None):
    try:
        val = float(v)
        if not math.isfinite(val):
            return False
        if min_val is not None and val < min_val:
            return False
        if max_val is not None and val > max_val:
            return False
        return True
    except (ValueError, TypeError):
        return False

def simulate_release(params: dict) -> dict:
    """
    Simulates cumulative drug release kinetics using Higuchi / Korsmeyer-Peppas models.
    Conforms to input validation, extreme parameters limits, and numerical stability guards.
    """
    raw_drug_loading = params.get("drugLoading")
    raw_polymer_concentration = params.get("polymerConcentration")
    raw_patch_thickness = params.get("patchThickness")
    raw_temperature = params.get("temperature")
    raw_ph = params.get("pH")
    raw_moisture = params.get("moisture")
    raw_duration = params.get("duration")

    drug_name = params.get("drugName", "Ibuprofen")
    polymer_name = params.get("polymerName", "Chitosan")

    # Strict Validation Check
    if not (is_valid_num(raw_drug_loading, 0.001) and
            is_valid_num(raw_polymer_concentration, 0.001) and
            is_valid_num(raw_patch_thickness, 0.001) and
            is_valid_num(raw_temperature, 10, 60) and
            is_valid_num(raw_ph, 0, 14) and
            is_valid_num(raw_moisture, 0, 100) and
            is_valid_num(raw_duration, 0.001)):
        raise ValueError("Invalid formulation parameter input. Parameter is empty, negative, NaN/Infinity, or out of bounds.")

    drug_loading = float(raw_drug_loading)
    polymer_concentration = float(raw_polymer_concentration)
    patch_thickness = float(raw_patch_thickness)
    temperature = float(raw_temperature)
    ph = float(raw_ph)
    moisture = float(raw_moisture)
    duration = float(raw_duration)

    # 1. Establish baseline drug diffusion constant
    drug_solubility_modifier = 1.0
    drug_mw_modifier = 1.0

    if drug_name == "Metformin":
        drug_solubility_modifier = 2.2
        drug_mw_modifier = 1.4
    elif drug_name == "Paracetamol":
        drug_solubility_modifier = 1.2
        drug_mw_modifier = 1.2
    elif drug_name == "Losartan":
        drug_solubility_modifier = 1.0
        drug_mw_modifier = 0.8
    else: # Ibuprofen / Default
        drug_solubility_modifier = 0.4
        drug_mw_modifier = 1.0

    # 2. Establish polymer barrier constant
    polymer_diffusion_modifier = 1.0
    ph_sensitivity = 0.0
    temp_sensitivity = 0.0

    if polymer_name == "PLA":
        polymer_diffusion_modifier = 0.15
    elif polymer_name == "Alginate":
        polymer_diffusion_modifier = 0.7
    elif polymer_name == "Gelatin":
        polymer_diffusion_modifier = 1.5
        temp_sensitivity = 0.08
    elif polymer_name == "Pectin":
        polymer_diffusion_modifier = 0.8
        ph_sensitivity = -0.05
    elif polymer_name == "Cellulose":
        polymer_diffusion_modifier = 0.6
    else: # Chitosan / Default
        polymer_diffusion_modifier = 0.9
        ph_sensitivity = 0.12

    # 3. Environment effects
    temp_factor = 1.0 + (temperature - 37.0) * 0.05 + (temp_sensitivity * max(0.0, temperature - 30.0))
    
    ph_factor = 1.0
    if ph_sensitivity > 0:
        ph_factor = 1.0 + (7.0 - ph) * ph_sensitivity
    elif ph_sensitivity < 0:
        ph_factor = 1.0 + (ph - 7.0) * abs(ph_sensitivity)

    moisture_factor = 0.2 + (moisture / 100.0) * 0.8

    # 4. Physical configuration properties (Stability protected pow)
    thickness_factor = math.pow(max(0.001, patch_thickness), -1.1)
    concentration_factor = math.pow(1.0 + (polymer_concentration / 10.0), -1.2)
    loading_factor = 1.0 + (drug_loading / 150.0)

    # 5. Final combined release rate constant (K)
    release_rate_constant = (
        0.12 * 
        drug_solubility_modifier * 
        drug_mw_modifier * 
        polymer_diffusion_modifier * 
        temp_factor * 
        ph_factor * 
        moisture_factor * 
        thickness_factor * 
        concentration_factor * 
        loading_factor
    )

    # Prevent potential negative or infinite constants
    if not math.isfinite(release_rate_constant) or release_rate_constant < 0:
        release_rate_constant = 0.0

    # Swelling matrix indices
    n = 0.5
    if polymer_name in ["Alginate", "Chitosan"]:
        n = 0.55
    elif polymer_name == "PLA":
        n = 0.45

    # 6. Generate curve steps
    steps = []
    hours_step = max(1.0, round(duration / 10.0))
    
    peak_rate = 0.0
    last_val = 0.0
    time_to_50 = -1.0

    t_val = 0.0
    while t_val <= duration:
        predicted = 100.0 * (1.0 - math.exp(-release_rate_constant * math.pow(t_val, n)))
        if predicted > 100.0:
            predicted = 100.0

        target = (t_val / duration) * 100.0

        steps.append({
            "time": float(t_val),
            "predicted": round(predicted, 1),
            "target": round(target, 1)
        })

        if t_val > 0:
            current_rate = (predicted - last_val) / hours_step
            if current_rate > peak_rate:
                peak_rate = current_rate

        if predicted >= 50.0 and time_to_50 == -1.0:
            time_to_50 = t_val

        last_val = predicted
        t_val += hours_step

    # Ensure last element matches exactly duration
    if steps[-1]["time"] != duration:
        final_predicted = 100.0 * (1.0 - math.exp(-release_rate_constant * math.pow(duration, n)))
        steps.append({
            "time": float(duration),
            "predicted": round(min(100.0, final_predicted), 1),
            "target": 100.0
        })

    final_release = steps[-1]["predicted"]

    # Calculate time to 50%
    if time_to_50 == -1.0:
        if final_release >= 50.0:
            for i in range(len(steps) - 1):
                if steps[i]["predicted"] < 50.0 <= steps[i+1]["predicted"]:
                    ratio = (50.0 - steps[i]["predicted"]) / (steps[i+1]["predicted"] - steps[i]["predicted"])
                    time_to_50 = round(steps[i]["time"] + ratio * (steps[i+1]["time"] - steps[i]["time"]), 1)
                    break
        else:
            time_to_50 = f"> {duration}"

    # 7. Controlled Release Score — Research Metric
    score = 100.0
    release_at_2 = next((s["predicted"] for s in steps if s["time"] >= 2.0), 0.0)
    if release_at_2 > 35.0:
        score -= (release_at_2 - 35.0) * 1.5

    if final_release < 75.0:
        score -= (75.0 - final_release) * 1.2

    total_dev = sum(abs(s["predicted"] - s["target"]) for s in steps)
    mean_dev = total_dev / len(steps)
    score -= mean_dev * 0.4
    score = max(10.0, min(100.0, round(score)))

    # 8. Risk Terminology
    risk_level = "Low"
    analysis = ""

    if release_at_2 > 50.0:
        risk_level = "High"
        analysis = f"Warning: High risk of initial dose dumping (burst release of {release_at_2:.1f}% in the first 2 hours). This could cause localized toxicity or systemic side effects due to rapid drug absorption. Consider increasing the polymer concentration or patch thickness."
    elif final_release < 30.0:
        risk_level = "High"
        analysis = f"Warning: High risk of sub-therapeutic delivery. The patch only releases {final_release:.1f}% of {drug_name} over {duration} hours, indicating entrapment within the dense {polymer_name} matrix. Consider reducing polymer concentration, reducing thickness, or increasing temperature/moisture conditions."
    elif release_at_2 > 35.0 or final_release < 65.0:
        risk_level = "Medium"
        analysis = f"Caution: Moderate risk of inconsistent therapeutic levels. The formulation shows moderate initial burst release or incomplete total drug delivery ({final_release:.1f}% at {duration} hours). Minor formulation optimization is recommended."
    else:
        risk_level = "Low"
        analysis = f"Success: Stable, sustained release profile achieved. The {polymer_name} matrix provides excellent controlled barrier properties for {drug_name}. Sustained release kinetics conform nicely to zero-order diffusion expectations with low burst risks."

    # Validate output stability
    if not (math.isfinite(final_release) and 0.0 <= final_release <= 100.0 and
            math.isfinite(peak_rate) and peak_rate >= 0.0 and
            math.isfinite(score) and 10.0 <= score <= 100.0):
        raise ValueError("Calculation resulted in numerical instability out-of-bounds metrics.")

    for step in steps:
        if not (math.isfinite(step["time"]) and step["time"] >= 0.0 and
                math.isfinite(step["predicted"]) and 0.0 <= step["predicted"] <= 100.0 and
                math.isfinite(step["target"]) and 0.0 <= step["target"] <= 100.0):
            raise ValueError("Calculation release curve contains invalid data points.")

    return {
        "predictedRelease": float(round(final_release, 1)),
        "peakReleaseRate": float(round(peak_rate, 2)),
        "timeTo50Percent": f"{time_to_50}h" if isinstance(time_to_50, (int, float)) else str(time_to_50),
        "estimatedDuration": f"{duration} hours",
        "controlledReleaseScore": int(score),
        "riskLevel": risk_level,
        "analysis": analysis,
        "releaseCurve": steps
    }
