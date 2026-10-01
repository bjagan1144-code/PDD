import React, { useState, useEffect } from 'react';
import { Brain, Database, Award, Activity, BarChart2, Info, AlertTriangle } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Cell,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  LineChart, 
  Line 
} from 'recharts';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import api, { isMockMode } from '../services/api';

const featureImportanceData = [
  { name: 'Polymer Conc.', value: 28, color: '#0ea5e9' },
  { name: 'pH Index', value: 24, color: '#10b981' },
  { name: 'Temperature', value: 18, color: '#f59e0b' },
  { name: 'Drug Loading', value: 15, color: '#6366f1' },
  { name: 'Thickness', value: 10, color: '#ec4899' },
  { name: 'Moisture', value: 5, color: '#14b8a6' }
];

const performanceCurveData = [
  { sample: 1, actual: 12, predicted: 11.5 },
  { sample: 2, actual: 24, predicted: 25.2 },
  { sample: 3, actual: 38, predicted: 37.1 },
  { sample: 4, actual: 50, predicted: 50.8 },
  { sample: 5, actual: 64, predicted: 62.9 },
  { sample: 6, actual: 75, predicted: 76.4 },
  { sample: 7, actual: 88, predicted: 86.8 },
  { sample: 8, actual: 98, predicted: 97.5 }
];

const AIPredictionPage = () => {
  const [metrics, setMetrics] = useState({
    r2: '0.948',
    mae: '1.84%',
    rmse: '2.45%',
    samples: '4,500',
    modelName: 'Random Forest Regression v1.0',
    dataset: 'Synthetic Research Dataset - For Academic Demonstration'
  });

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!isMockMode()) {
        try {
          const res = await api.get('/predictions/metrics');
          const data = res.data;
          setMetrics({
            r2: data.r2.toString(),
            mae: data.mae,
            rmse: data.rmse,
            samples: data.samples.toLocaleString(),
            modelName: `${data.model_name} v${data.version}`,
            dataset: data.dataset
          });
        } catch (err) {
          console.warn("Failed to fetch ML metrics from backend:", err);
        }
      }
    };
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center">
            <Brain className="h-5.5 w-5.5 text-medical-400 mr-2" />
            AI Prediction & Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate artificial intelligence regression model accuracies, training subsets, and parameter weightings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="info">{metrics.modelName}</Badge>
          <Badge variant="warning">{metrics.dataset}</Badge>
          <Badge variant="success" hasDot>Active</Badge>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="flex items-start space-x-3 p-4 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300 leading-normal">
        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold uppercase tracking-wider block mb-0.5">Academic Research Prototype Notice:</span>
          BioPatch AI is an academic research and simulation prototype. Predictions and release profiles are computational estimates based on mathematical and machine-learning models. They are not clinical dosing recommendations, medical advice, or validated pharmaceutical specifications. The results must not be used for patient treatment or real-world drug formulation decisions.
        </div>
      </div>

      {/* Model Information & Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="R² Score"
          value={metrics.r2}
          icon={Award}
          description="Coefficient of determination"
          trend={{ value: `${(parseFloat(metrics.r2) * 100).toFixed(1)}% accuracy`, positive: true }}
          variant="cyan"
        />
        <StatCard
          title="MAE"
          value={metrics.mae}
          icon={Activity}
          description="Mean Absolute Error rate"
          trend={{ value: 'Lower is better', positive: true }}
          variant="blue"
        />
        <StatCard
          title="RMSE"
          value={metrics.rmse}
          icon={BarChart2}
          description="Root Mean Squared Error"
          trend={{ value: 'Low variance deviation', positive: true }}
          variant="teal"
        />
        <StatCard
          title="Training Samples"
          value={metrics.samples}
          icon={Database}
          description="Formulation data records"
          variant="purple"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Feature Importance BarChart */}
        <div className="glass-card p-6 border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                Parameter Feature Importance Weightings
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                Relative influence on cumulative drug release speed
              </p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureImportanceData} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#475569" style={{ fontSize: 10 }} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#475569" style={{ fontSize: 10 }} width={85} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                  formatter={(val) => [`${val}%`, 'Importance']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {featureImportanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Accuracy Chart */}
        <div className="glass-card p-6 border-slate-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                Predicted vs. Target Validation Curve
              </h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                Alignment index across cross-validation tests
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[10px] uppercase font-semibold">
              <span className="flex items-center text-slate-400">
                <span className="w-2 h-2 rounded-full bg-medical-500 mr-1" />
                Predicted
              </span>
              <span className="flex items-center text-slate-600">
                <span className="w-2 h-2 rounded-full bg-slate-600 mr-1 border border-dashed border-slate-500" />
                Actual Target
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceCurveData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="sample" stroke="#475569" style={{ fontSize: 10 }} label={{ value: 'Test Batches', position: 'insideBottom', offset: -5 }} />
                <YAxis stroke="#475569" style={{ fontSize: 10 }} label={{ value: 'Release (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Line type="monotone" dataKey="predicted" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 4 }} name="Predicted Release" />
                <Line type="monotone" dataKey="actual" stroke="#475569" strokeDasharray="4 4" strokeWidth={2} name="Actual Release" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Model performance overview text */}
      <div className="glass-card p-5 border-slate-800 flex items-start space-x-4 bg-slate-900/20">
        <Info className="h-5 w-5 text-slate-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-xs leading-normal">
          <h4 className="font-bold text-slate-200 uppercase tracking-widest">Model Calibration & Limitations</h4>
          <p className="text-slate-400 font-medium">
            The AI regression engine uses a <strong>Random Forest Regression</strong> ensemble framework (v1.0) to model matrix diffusion velocities. Polymer concentration indexes represent the highest weighting factor (28%), as matrix densities directly impact Fickian boundaries. pH weighting (24%) captures electrostatic repulsions in pH-swelling hydrogels (e.g. chitosan/pectin). These statistics represent validation metrics computed on synthetically augmented benchmark records.
          </p>
          <p className="text-slate-400 font-medium">
            <strong>Model Transparency & Limitations:</strong>
          </p>
          <ul className="list-disc pl-5 text-slate-400 space-y-1 font-medium">
            <li><strong>Dataset:</strong> Synthetic Research Dataset — For Academic Demonstration. This data is synthetically generated for software demonstration purposes and does not represent laboratory measurements, clinical measurements, or human study results.</li>
            <li><strong>Model performance</strong> depends on the quality and representativeness of the training data.</li>
            <li><strong>The machine-learning model</strong> is an academic prototype trained on the available dataset. Predictions may not generalize to real-world formulations or experimental conditions. Computational model outputs should be interpreted strictly as computational estimates.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIPredictionPage;
