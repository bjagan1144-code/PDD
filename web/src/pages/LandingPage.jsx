import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Activity, 
  Cpu, 
  Brain, 
  Layers, 
  ArrowRight, 
  Sparkles, 
  FileCheck2, 
  TrendingUp, 
  Microscope 
} from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

const sampleChartData = [
  { time: 0, predicted: 0, target: 0 },
  { time: 2, predicted: 18, target: 16 },
  { time: 4, predicted: 36, target: 33 },
  { time: 6, predicted: 51, target: 50 },
  { time: 8, predicted: 67, target: 66 },
  { time: 10, predicted: 84, target: 83 },
  { time: 12, predicted: 95, target: 100 }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const handleExplore = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 flex flex-col font-sans overflow-x-hidden relative">
      {/* GLOWING AMBIENT GRAPHICS */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-radial-gradient from-medical-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/2 left-0 w-[40vw] h-[40vw] bg-radial-gradient from-biotech-500/5 via-transparent to-transparent pointer-events-none" />

      {/* TOP HEADER */}
      <header className="h-20 flex items-center justify-between px-6 lg:px-12 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-medical-600 to-biotech-400 flex items-center justify-center shadow-lg shadow-medical-500/20">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-base tracking-widest text-slate-200">
            BIOPATCH <span className="text-medical-400 font-extrabold text-xs">AI</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <Button onClick={() => navigate('/dashboard')} variant="outline" size="sm">
              Console
            </Button>
          ) : (
            <>
              <Link to="/login" className="text-sm font-semibold text-slate-400 hover:text-slate-200 transition-colors">
                Sign In
              </Link>
              <Button onClick={() => navigate('/register')} variant="primary" size="sm">
                Get Started
              </Button>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="flex-1 max-w-7xl mx-auto px-6 lg:px-12 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-medical-500/10 border border-medical-500/20 text-xs text-medical-400 font-semibold shadow-inner shadow-medical-500/5 uppercase tracking-widest">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            <span>AI-Driven Biopolymer Research</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-medical-300 font-sans">
            Development of an Intelligent Biopolymer Drug-Delivery Patch with Real-Time Release Modeling
          </h1>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-lg">
            An intelligent research platform for simulating controlled drug release using biopolymer-based delivery systems and AI-powered release kinetics modeling. Configure formulation parameters and environmental factors to evaluate kinetics dynamically.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Button onClick={handleStart} variant="primary" size="lg" icon={ArrowRight} iconPosition="right">
              Start Simulation
            </Button>
            <Button onClick={handleExplore} variant="secondary" size="lg">
              Explore Platform
            </Button>
          </div>
        </div>

        {/* Dynamic Graphic Preview */}
        <div className="glass-card p-6 border-slate-800 relative overflow-hidden group">
          <div className="absolute top-2 right-2 flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">
            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping mr-1" />
            Live Preview Model
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Simulated Sustained Release (Zero-Order)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sampleChartData}>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Time (Hours)', position: 'insideBottom', offset: -5 }} stroke="#475569" style={{ fontSize: 10 }} />
                <YAxis label={{ value: 'Release (%)', angle: -90, position: 'insideLeft' }} stroke="#475569" style={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                <Line type="monotone" dataKey="predicted" stroke="#0ea5e9" strokeWidth={3} name="Predicted Release" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="target" stroke="#64748b" strokeDasharray="5 5" name="Target Profile" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* DETAILS / FEATURES SECTION */}
      <section id="features" className="max-w-7xl mx-auto px-6 lg:px-12 py-20 border-t border-slate-900 bg-slate-950/20 w-full z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            How BioPatch AI Accelerates Formulations
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Integrating machine learning algorithms with biocompatible polymer physics to eliminate trial-and-error laboratory iterations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-6 border-slate-800/80 hover:border-medical-500/20 hover:-translate-y-1 transition-all">
            <div className="h-10 w-10 rounded-lg bg-medical-500/10 border border-medical-500/20 flex items-center justify-center text-medical-400 mb-4 shadow-inner">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider mb-2">
              Biopolymer Intelligence
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore biodegradable polymers (Chitosan, Alginate, Gelatin, PLA). Understand and model hydration, swelling capacity, degradation metrics, and chemical cross-linking.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 border-slate-800/80 hover:border-biotech-500/20 hover:-translate-y-1 transition-all">
            <div className="h-10 w-10 rounded-lg bg-biotech-500/10 border border-biotech-500/20 flex items-center justify-center text-biotech-400 mb-4 shadow-inner">
              <Brain className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider mb-2">
              AI-Powered Release Prediction
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Leverage machine learning regression models trained on multi-parameter datasets (pH, temperature, loading ratio, matrix density) to predict drug delivery curves in seconds.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 border-slate-800/80 hover:border-science-500/20 hover:-translate-y-1 transition-all">
            <div className="h-10 w-10 rounded-lg bg-science-500/10 border border-science-500/20 flex items-center justify-center text-science-400 mb-4 shadow-inner">
              <Activity className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider mb-2">
              Real-Time Monitoring Simulation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluate real-time concentration variables under dynamic environments. Plot continuous kinetic pathways to detect overdose burst spikes or sub-therapeutic plateauing.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 border-slate-800/80 hover:border-medical-500/20 hover:-translate-y-1 transition-all">
            <div className="h-10 w-10 rounded-lg bg-medical-500/10 border border-medical-500/20 flex items-center justify-center text-medical-400 mb-4 shadow-inner">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider mb-2">
              Intelligent Drug Delivery
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Configure parameters such as drug loading, target duration, temperature index, and molecular weights to evaluate active diffusion pathways and release exponents.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-card p-6 border-slate-800/80 hover:border-biotech-500/20 hover:-translate-y-1 transition-all">
            <div className="h-10 w-10 rounded-lg bg-biotech-500/10 border border-biotech-500/20 flex items-center justify-center text-biotech-400 mb-4 shadow-inner">
              <Microscope className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider mb-2">
              Personalized Research
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Customize formulations on demand by feeding arbitrary custom polymer or drug properties into the modeling core, making it an adaptable simulator for medical studies.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-card p-6 border-slate-800/80 hover:border-science-500/20 hover:-translate-y-1 transition-all">
            <div className="h-10 w-10 rounded-lg bg-science-500/10 border border-science-500/20 flex items-center justify-center text-science-400 mb-4 shadow-inner">
              <FileCheck2 className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-200 uppercase tracking-wider mb-2">
              Academic Validation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Export high-fidelity summary reports detailing formulation profiles, safety margins, mathematical indicators, and kinetic charts, optimized for external evaluation.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-900 bg-slate-950 mt-auto text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="h-7 w-7 rounded bg-gradient-to-tr from-medical-600 to-biotech-400 flex items-center justify-center">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-xs tracking-wider text-slate-400">BIOPATCH AI</span>
          </div>
          <div className="text-center md:text-right">
            <p>© 2026 BioPatch AI. All Rights Reserved.</p>
            <p className="mt-1 text-[10px] text-slate-600">Development of an Intelligent Biopolymer Drug-Delivery Patch with Real-Time Release Modeling</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
