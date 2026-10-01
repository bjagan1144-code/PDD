/**
 * BioPatch AI — Deterministic Simulation Engine
 * Simulates drug release kinetics using modified Higuchi & Korsmeyer-Peppas diffusion models.
 */

const isValidNum = (v, min = null, max = null) => {
  const num = parseFloat(v);
  if (isNaN(num) || !isFinite(num)) return false;
  if (min !== null && num < min) return false;
  if (max !== null && num > max) return false;
  return true;
};

export const simulateRelease = (params) => {
  const {
    drugName,
    polymerName,
    drugLoading: rawDrugLoading,
    polymerConcentration: rawPolymerConcentration,
    patchThickness: rawPatchThickness,
    temperature: rawTemperature,
    pH: rawpH,
    moisture: rawMoisture,
    duration: rawDuration
  } = params;

  // Validate inputs
  if (!isValidNum(rawDrugLoading, 0.001) ||
      !isValidNum(rawPolymerConcentration, 0.001) ||
      !isValidNum(rawPatchThickness, 0.001) ||
      !isValidNum(rawTemperature, 10, 60) ||
      !isValidNum(rawpH, 0, 14) ||
      !isValidNum(rawMoisture, 0, 100) ||
      !isValidNum(rawDuration, 0.001)) {
    throw new Error("Invalid formulation parameter input. Please check all numerical values.");
  }

  const drugLoading = parseFloat(rawDrugLoading);
  const polymerConcentration = parseFloat(rawPolymerConcentration);
  const patchThickness = parseFloat(rawPatchThickness);
  const temperature = parseFloat(rawTemperature);
  const pH = parseFloat(rawpH);
  const moisture = parseFloat(rawMoisture);
  const duration = parseFloat(rawDuration);


  // 1. Establish baseline drug diffusion constant (D_drug)
  // Higher molecular weight = slower diffusion; higher solubility = faster diffusion
  let drugSolubilityModifier = 1.0;
  let drugMWModifier = 1.0;

  switch (drugName) {
    case "Metformin":
      drugSolubilityModifier = 2.2; // highly soluble
      drugMWModifier = 1.4;         // low MW (faster)
      break;
    case "Paracetamol":
      drugSolubilityModifier = 1.2; // sparingly soluble
      drugMWModifier = 1.2;
      break;
    case "Losartan":
      drugSolubilityModifier = 1.0;
      drugMWModifier = 0.8;         // high MW (slower)
      break;
    case "Ibuprofen":
    default:
      drugSolubilityModifier = 0.4; // poorly soluble
      drugMWModifier = 1.0;
      break;
  }

  // 2. Establish baseline polymer barrier constant (K_poly)
  let polymerDiffusionModifier = 1.0;
  let phSensitivity = 0.0; // 0 = none, positive = swells in acid, negative = swells in base
  let tempSensitivity = 0.0; // sensitive to higher temp

  switch (polymerName) {
    case "PLA":
      polymerDiffusionModifier = 0.15; // hydrophobic bulk erosion (slow)
      break;
    case "Alginate":
      polymerDiffusionModifier = 0.7;  // swellable cross-linked hydrogel
      break;
    case "Gelatin":
      polymerDiffusionModifier = 1.5;  // protein matrix
      tempSensitivity = 0.08;          // melts/dissolves faster at high temperature
      break;
    case "Pectin":
      polymerDiffusionModifier = 0.8;
      phSensitivity = -0.05;           // slightly pH responsive
      break;
    case "Cellulose":
      polymerDiffusionModifier = 0.6;
      break;
    case "Chitosan":
    default:
      polymerDiffusionModifier = 0.9;
      phSensitivity = 0.12;            // swells fast in acidic conditions (low pH)
      break;
  }

  // 3. Environment effects
  // Temperature increases molecular kinetic energy (Arrhenius relation: k ~ e^(-Ea/RT))
  const tempFactor = 1.0 + (temperature - 37) * 0.05 + (tempSensitivity * Math.max(0, temperature - 30));
  
  // pH swelling effect
  let pHFactor = 1.0;
  if (phSensitivity > 0) {
    // Chitosan: Swells in acid (low pH = higher swelling = faster release)
    pHFactor = 1.0 + (7.0 - pH) * phSensitivity;
  } else if (phSensitivity < 0) {
    // Pectin: Swells more in alkaline (high pH = higher swelling)
    pHFactor = 1.0 + (pH - 7.0) * Math.abs(phSensitivity);
  }

  // Moisture hydrates the polymer matrix
  const moistureFactor = 0.2 + (moisture / 100) * 0.8;

  // 4. Formulation physical parameters
  // Thicker patch increases diffusion path length (rate decreases with thickness^2, but let's model as thickness^-1.2 for stability)
  const thicknessFactor = Math.pow(patchThickness, -1.1);

  // Higher polymer concentration increases viscosity and matrix density (slower release)
  const concentrationFactor = Math.pow(1.0 + (polymerConcentration / 10), -1.2);

  // Drug loading influences saturation solubility and concentration gradient
  const loadingFactor = 1.0 + (drugLoading / 150);

  // 5. Final combined release rate constant (K)
  const releaseRateConstant = 0.12 * 
    drugSolubilityModifier * 
    drugMWModifier * 
    polymerDiffusionModifier * 
    tempFactor * 
    pHFactor * 
    moistureFactor * 
    thicknessFactor * 
    concentrationFactor * 
    loadingFactor;

  // 6. Generate the release curve
  // Using a mathematical diffusion function: Q(t) = 100 * (1 - e^(-K * t^n))
  // Where n is the diffusion exponent. Usually 0.5 (Fickian) to 0.7 (Anomalous)
  // Let's model n based on swelling index of the polymer
  let n = 0.5;
  if (polymerName === "Alginate" || polymerName === "Chitosan") {
    n = 0.55; // anomalous swelling transport
  } else if (polymerName === "PLA") {
    n = 0.45; // Fickian matrix release
  }

  // Time steps: We will output 10 points or hourly points up to the duration
  const steps = [];
  const hoursStep = Math.max(1, Math.round(duration / 10));
  
  let peakRate = 0;
  let lastVal = 0;
  let timeTo50 = -1;

  for (let t = 0; t <= duration; t += hoursStep) {
    // Higuchi/Korsmeyer equation
    let predicted = 100 * (1 - Math.exp(-releaseRateConstant * Math.pow(t, n)));
    
    // Cap at 100%
    if (predicted > 100) predicted = 100;
    
    // Target release profile is assumed to be linear for zero-order controlled release
    const target = (t / duration) * 100;

    steps.push({
      time: t,
      predicted: parseFloat(predicted.toFixed(1)),
      target: parseFloat(target.toFixed(1))
    });

    if (t > 0) {
      const currentRate = (predicted - lastVal) / hoursStep;
      if (currentRate > peakRate) {
        peakRate = currentRate;
      }
    }
    
    if (predicted >= 50 && timeTo50 === -1) {
      timeTo50 = t;
    }

    lastVal = predicted;
  }

  // Ensure last element matches exactly the final duration if not hit by steps
  if (steps[steps.length - 1].time !== duration) {
    const finalPredicted = 100 * (1 - Math.exp(-releaseRateConstant * Math.pow(duration, n)));
    steps.push({
      time: duration,
      predicted: parseFloat(Math.min(100, finalPredicted).toFixed(1)),
      target: 100
    });
  }

  const finalRelease = steps[steps.length - 1].predicted;

  // Determine timeTo50 if not found in steps (by interpolation)
  if (timeTo50 === -1) {
    if (finalRelease >= 50) {
      // Find where it crossed 50
      for (let i = 0; i < steps.length - 1; i++) {
        if (steps[i].predicted < 50 && steps[i+1].predicted >= 50) {
          const ratio = (50 - steps[i].predicted) / (steps[i+1].predicted - steps[i].predicted);
          timeTo50 = parseFloat((steps[i].time + ratio * (steps[i+1].time - steps[i].time)).toFixed(1));
          break;
        }
      }
    } else {
      timeTo50 = "> " + duration;
    }
  }

  // 7. Controlled Release Score calculation
  // Perfect score is 100. Penalties for:
  // - High initial burst release (release in first 2 hours should be under 30%)
  // - Incomplete release (final release under 80% at end of simulated period)
  // - Deviation from zero-order release line (target)
  let score = 100;

  // Penalty for initial burst
  const releaseAt2 = steps.find(s => s.time >= 2)?.predicted || 0;
  if (releaseAt2 > 35) {
    score -= (releaseAt2 - 35) * 1.5;
  }

  // Penalty for low final release (incomplete dose delivery)
  if (finalRelease < 75) {
    score -= (75 - finalRelease) * 1.2;
  }

  // Mean Absolute Error (MAE) relative to linear target profile
  let totalDev = 0;
  steps.forEach(s => {
    totalDev += Math.abs(s.predicted - s.target);
  });
  const meanDev = totalDev / steps.length;
  score -= meanDev * 0.4;

  score = Math.max(10, Math.min(100, Math.round(score)));

  // 8. Risk Level
  let riskLevel = "Low";
  let analysis = "";

  if (releaseAt2 > 50) {
    riskLevel = "High";
    analysis = `Warning: High risk of initial dose dumping (burst release of ${releaseAt2.toFixed(1)}% in the first 2 hours). This could cause localized toxicity or systemic side effects due to rapid drug absorption. Consider increasing the polymer concentration or patch thickness.`;
  } else if (finalRelease < 30) {
    riskLevel = "High";
    analysis = `Warning: High risk of sub-therapeutic delivery. The patch only releases ${finalRelease.toFixed(1)}% of ${drugName} over ${duration} hours, indicating entrapment within the dense ${polymerName} matrix. Consider reducing polymer concentration, reducing thickness, or increasing temperature/moisture conditions.`;
  } else if (releaseAt2 > 35 || finalRelease < 65) {
    riskLevel = "Medium";
    analysis = `Caution: Moderate risk of inconsistent therapeutic levels. The formulation shows moderate initial burst release or incomplete total drug delivery (${finalRelease.toFixed(1)}% at ${duration} hours). Minor formulation optimization is recommended.`;
  } else {
    riskLevel = "Low";
    analysis = `Success: Stable, sustained release profile achieved. The ${polymerName} matrix provides excellent controlled barrier properties for ${drugName}. Sustained release kinetics conform nicely to zero-order diffusion expectations with low burst risks.`;
  }

  // Validate output fields for numerical stability and constraints
  if (!isFinite(finalRelease) || isNaN(finalRelease) || finalRelease < 0 || finalRelease > 100 ||
      !isFinite(peakRate) || isNaN(peakRate) || peakRate < 0 ||
      !isFinite(score) || isNaN(score) || score < 10 || score > 100) {
    throw new Error("Numerical instability detected: calculation output fields are out of bounds.");
  }

  for (const step of steps) {
    if (!isFinite(step.time) || isNaN(step.time) || step.time < 0 ||
        !isFinite(step.predicted) || isNaN(step.predicted) || step.predicted < 0 || step.predicted > 100 ||
        !isFinite(step.target) || isNaN(step.target) || step.target < 0 || step.target > 100) {
      throw new Error("Numerical instability detected: release curve steps contain invalid values.");
    }
  }

  return {
    predictedRelease: parseFloat(finalRelease.toFixed(1)),
    peakReleaseRate: parseFloat(peakRate.toFixed(2)),
    timeTo50Percent: typeof timeTo50 === 'number' ? `${timeTo50}h` : timeTo50,
    estimatedDuration: `${duration} hours`,
    controlledReleaseScore: score,
    riskLevel,
    analysis,
    releaseCurve: steps
  };
};
