import React, { useState, useEffect } from 'react';
import { Brain, Database, Award, Activity, BarChart2, Info } from 'lucide-react';
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

const defaultFeatureImportance = [
  { name: 'Patch Thickness', value: 33.1, color: '#ec4899' },
  { name: 'Temperature', value: 14.7, color: '#f59e0b' },
  { name: 'Metformin Drug', value: 12.5, color: '#6366f1' },
  { name: 'PLA Polymer', value: 8.9, color: '#0ea5e9' },
  { name: 'Gelatin Polymer', value: 6.4, color: '#10b981' },
  { name: 'Moisture', value: 5.7, color: '#14b8a6' },
  { name: 'Polymer Conc.', value: 5.2, color: '#8b5cf6' },
  { name: 'Duration', value: 3.5, color: '#f43f5e' }
];

const defaultValidationCurve = [
  { sample: 1, actual: 7.5, predicted: 9.5 },
  { sample: 2, actual: 7.8, predicted: 9.5 },
  { sample: 3, actual: 6.1, predicted: 9.3 },
  { sample: 4, actual: 1.0, predicted: 3.4 },
  { sample: 5, actual: 0.6, predicted: 1.4 },
  { sample: 6, actual: 10.0, predicted: 22.8 },
  { sample: 7, actual: 3.1, predicted: 10.2 },
  { sample: 8, actual: 0.7, predicted: 1.8 },
  { sample: 9, actual: 16.3, predicted: 26.1 },
  { sample: 10, actual: 15.6, predicted: 34.8 }
];

const featureColorPalette = ['#ec4899', '#f59e0b', '#6366f1', '#0ea5e9', '#10b981', '#14b8a6', '#8b5cf6', '#f43f5e'];

const AIPredictionPage = () => {
  const [metrics, setMetrics] = useState({
    r2: '0.7638',
    mae: '6.59%',
    rmse: '11.51%',
    samples: '1,200',
    modelName: 'Random Forest Regressor v2.0-verified',
    dataset: 'Synthetic In-Silico Dataset (1,200 runs)',
    experimentalStatus: 'In-silico mathematical Weibull formulations (non-wet-lab benchmark).'
  });
  const [featureImportance, setFeatureImportance] = useState(defaultFeatureImportance);
  const [performanceCurve, setPerformanceCurve] = useState(defaultValidationCurve);

  useEffect(() => {
    const fetchMetrics = async () => {
      if (!isMockMode()) {
        try {
          const res = await api.get('/predictions/metrics');
          const data = res.data;
          setMetrics({
            r2: data.r2 !== undefined ? data.r2.toString() : '0.7638',
            mae: data.mae || '6.59%',
            rmse: data.rmse || '11.51%',
            samples: data.samples ? data.samples.toLocaleString() : '1,200',
            modelName: `${data.model_name || 'Random Forest'} ${data.version || 'v2.0'}`,
            dataset: data.dataset || 'Synthetic In-Silico Dataset',
            experimentalStatus: data.experimental_data_status || 'In-silico benchmark'
          });

          if (Array.isArray(data.feature_importances) && data.feature_importances.length > 0) {
            const mapped = data.feature_importances.slice(0, 8).map((f, i) => {
              let label = f.name
                .replace('drug_', 'Drug: ')
                .replace('polymer_', 'Polymer: ')
                .replace('patchThickness', 'Patch Thickness')
                .replace('polymerConcentration', 'Polymer Conc.')
                .replace('drugLoading', 'Drug Loading')
                .replace('temperature', 'Temperature')
                .replace('moisture', 'Moisture')
                .replace('duration', 'Duration');
              return {
                name: label,
                value: f.importance,
                color: featureColorPalette[i % featureColorPalette.length]
              };
            });
            setFeatureImportance(mapped);
          }

          if (Array.isArray(data.validation_samples) && data.validation_samples.length > 0) {
            setPerformanceCurve(data.validation_samples);
          }
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
              <BarChart data={featureImportance} layout="vertical" margin={{ left: 10, right: 10 }}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="#475569" style={{ fontSize: 10 }} unit="%" />
                <YAxis dataKey="name" type="category" stroke="#475569" style={{ fontSize: 10 }} width={110} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                  formatter={(val) => [`${val}%`, 'Importance']}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {featureImportance.map((entry, index) => (
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
              <LineChart data={performanceCurve}>
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
            The AI regression engine uses a <strong>Random Forest Regression</strong> ensemble framework (v2.0-verified) trained on 1,200 multi-factorial formulation configurations with an 80/20 train/test split. <strong>Patch Thickness</strong> represents the primary physical diffusion resistance barrier (33.1% weighting), followed by <strong>Temperature</strong> (14.7%) and drug molecular solubility characteristics. Metrics are computed on an independent held-out validation subset ({metrics.r2} R², {metrics.mae} MAE).
          </p>
          <p className="text-slate-400 font-medium">
            <strong>Model Transparency & Scientific Limitations:</strong>
          </p>
          <ul className="list-disc pl-5 text-slate-400 space-y-1 font-medium">
            <li><strong>Dataset:</strong> {metrics.dataset}. This data is generated systematically from Weibull and Korsmeyer-Peppas kinetic equations for computational formulation screening and does not replace in-vitro Franz cell diffusion or in-vivo transdermal pharmacokinetic assays.</li>
            <li><strong>Experimental Status:</strong> {metrics.experimentalStatus}</li>
            <li><strong>Decision Boundary:</strong> Predictions provide computational pre-clinical screening guidance. Laboratory verification remains essential for clinical validation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AIPredictionPage;
