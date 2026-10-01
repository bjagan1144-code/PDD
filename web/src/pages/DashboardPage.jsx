import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Cpu, 
  Layers, 
  Brain, 
  FileText, 
  Calendar, 
  Thermometer, 
  Droplet, 
  Ruler, 
  Gauge, 
  ArrowUpRight,
  History as HistoryIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { simulationService } from '../services/simulationService';
import { defaultDashboardStats } from '../data/dashboard';
import api, { isMockMode } from '../services/api';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState([]);
  const [stats, setStats] = useState(defaultDashboardStats);
  const [isLoading, setIsLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('offline');
  const [modelStatus, setModelStatus] = useState('unavailable');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!isMockMode()) {
          try {
            const res = await api.get('/dashboard/summary');
            const summary = res.data;
            setStats(summary);
            setBackendStatus(summary.backendStatus || 'connected');
            setModelStatus(summary.modelStatus || 'loaded');
            setSimulations(summary.recentSimulations || []);
            setIsLoading(false);
            return;
          } catch (err) {
            console.warn('FastAPI summary endpoint failed, falling back to mock storage:', err);
          }
        }

        // Mock mode local storage calculation
        const data = await simulationService.getSimulations();
        setSimulations(data);
        setBackendStatus('offline');
        setModelStatus('unavailable');
        
        if (data.length > 0) {
          const avgRelease = (data.reduce((acc, s) => acc + s.predictedRelease, 0) / data.length).toFixed(1);
          const avgScore = Math.round(data.reduce((acc, s) => acc + s.controlledReleaseScore, 0) / data.length);
          const latestSim = data[0];

          setStats({
            totalSimulations: data.length,
            avgPredictedRelease: `${avgRelease}%`,
            controlledReleaseScore: `${avgScore}/100`,
            activeAIModel: "Random Forest (Offline)",
            environmentalConditions: {
              temperature: latestSim.temperature,
              pH: latestSim.pH,
              moisture: latestSim.moisture,
              patchThickness: latestSim.patchThickness
            }
          });
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRowClick = (sim) => {
    navigate('/history', { state: { selectedSimId: sim.id } });
  };

  // Build the chart data using the latest simulation curve
  const latestSim = simulations[0] || {
    drugName: 'No Active Formulation',
    polymerName: 'None',
    releaseCurve: [
      { time: 0, predicted: 0, target: 0 },
      { time: 6, predicted: 50, target: 50 },
      { time: 12, predicted: 100, target: 100 }
    ]
  };

  if (isLoading) {
    return <LoadingSpinner message="Generating analytics workspace..." size="lg" />;
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center">
            Good Morning, Researcher
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitor intelligent drug-release simulations and AI predictions.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 bg-[#0d111d] border border-slate-800 rounded-lg px-3.5 py-2">
          <Calendar className="h-4 w-4 mr-1.5 text-slate-400" />
          <span>Active Session: 2026-08-21</span>
        </div>
      </div>

      {/* Stats Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Simulations"
          value={stats.totalSimulations}
          icon={Gauge}
          description="Total pre-clinical runs"
          trend={{ value: '14.2%', positive: true }}
          variant="cyan"
        />
        <StatCard
          title="Avg Predicted Release"
          value={stats.avgPredictedRelease}
          icon={Activity}
          description="Sustained rate target"
          trend={{ value: '3.1%', positive: true }}
          variant="blue"
        />
        <StatCard
          title="Controlled Release Score — Research Metric"
          value={stats.controlledReleaseScore}
          icon={Layers}
          description="Formulation profile index"
          trend={{ value: '8.4%', positive: true }}
          variant="teal"
        />
        <StatCard
          title="Active AI Model"
          value={stats.activeAIModel}
          icon={Brain}
          description="Decision regression network"
          variant="purple"
        />
      </div>

      {/* Main Chart + Environmental grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Release Kinetics Chart */}
        <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
                Drug Release Kinetics Profile
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Formulation: <span className="font-semibold text-medical-400">{latestSim.drugName}</span> in <span className="font-semibold text-biotech-400">{latestSim.polymerName}</span> matrix (ID: {latestSim.id || 'N/A'})
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-medical-500 mr-1.5" />
                Predicted
              </span>
              <span className="flex items-center text-slate-500">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-600 mr-1.5 border border-dashed border-slate-500" />
                Target (Linear)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={latestSim.releaseCurve}>
                <defs>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Time (hours)', position: 'insideBottom', offset: -5 }} stroke="#475569" style={{ fontSize: 11 }} />
                <YAxis label={{ value: 'Cumulative Release (%)', angle: -90, position: 'insideLeft' }} stroke="#475569" style={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="predicted" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorPredicted)" name="Predicted Release" />
                <Area type="monotone" dataKey="target" stroke="#475569" strokeDasharray="4 4" fill="none" name="Linear Target" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Environmental Conditions Panel */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-1">
              Active Environment Factors
            </h3>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              Current Simulation Settings
            </span>

            <div className="mt-6 space-y-4">
              {/* Temperature */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Thermometer className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Temperature</span>
                </div>
                <span className="text-sm font-bold text-slate-100">{stats.environmentalConditions.temperature}°C</span>
              </div>

              {/* pH */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Activity className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">pH Index</span>
                </div>
                <span className="text-sm font-bold text-slate-100">{stats.environmentalConditions.pH}</span>
              </div>

              {/* Moisture */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    <Droplet className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Relative Humidity</span>
                </div>
                <span className="text-sm font-bold text-slate-100">{stats.environmentalConditions.moisture}%</span>
              </div>

              {/* Thickness */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Ruler className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-slate-300">Patch Thickness</span>
                </div>
                <span className="text-sm font-bold text-slate-100">{stats.environmentalConditions.patchThickness} mm</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 mt-4 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Sensors: Simulated Streaming</span>
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Simulations + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent simulations table */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest">
              Recent Modeling History
            </h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
              View All History
            </Button>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-slate-900/30">
                  <th className="py-2.5 px-3">Drug</th>
                  <th className="py-2.5 px-3">Polymer</th>
                  <th className="py-2.5 px-3">predicted Release</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Simulation Risk Indicator</th>
                  <th className="py-2.5 px-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {simulations.slice(0, 4).map((sim, i) => (
                  <tr 
                    key={i} 
                    onClick={() => handleRowClick(sim)}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-3 font-semibold text-slate-200 flex items-center">
                      {sim.drugName}
                      <ArrowUpRight className="h-3 w-3 text-slate-500 opacity-0 group-hover:opacity-100 ml-1 transition-opacity" />
                    </td>
                    <td className="py-3.5 px-3">{sim.polymerName}</td>
                    <td className="py-3.5 px-3 font-bold text-medical-400">{sim.predictedRelease}%</td>
                    <td className="py-3.5 px-3">{sim.duration}h</td>
                    <td className="py-3.5 px-3">
                      <Badge variant={sim.riskLevel === 'High' ? 'danger' : sim.riskLevel === 'Medium' ? 'warning' : 'success'}>
                        {sim.riskLevel}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-500">{sim.date.split(' ')[0]}</td>
                  </tr>
                ))}
                {simulations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      No simulations run. Run your first configuration in the simulator.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest mb-4">
              Quick Actions
            </h3>
            
            <div className="space-y-3">
              <Button 
                onClick={() => navigate('/simulator')} 
                className="w-full justify-start text-xs" 
                variant="primary" 
                icon={Cpu}
              >
                New AI Simulation
              </Button>
              <Button 
                onClick={() => navigate('/history')} 
                className="w-full justify-start text-xs" 
                variant="secondary" 
                icon={HistoryIcon}
              >
                View History Registry
              </Button>
              <Button 
                onClick={() => navigate('/reports')} 
                className="w-full justify-start text-xs" 
                variant="secondary" 
                icon={FileText}
              >
                Generate Model Report
              </Button>
              <Button 
                onClick={() => navigate('/ai-prediction')} 
                className="w-full justify-start text-xs" 
                variant="outline" 
                icon={Brain}
              >
                View ML Analytics
              </Button>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 mt-4 leading-normal space-y-2.5">
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[10px] block mb-1">
              Platform Status
            </span>
            <div className="flex justify-between items-center text-slate-300">
              <span>Backend Core API:</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                backendStatus === 'connected' 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              }`}>
                {backendStatus === 'connected' ? 'Connected' : 'Offline Mode'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>AI Predictor Module:</span>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                modelStatus === 'loaded' 
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                  : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              }`}>
                {modelStatus === 'loaded' ? 'Loaded' : 'Unavailable'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 pt-1 leading-normal">
              Active Model: Random Forest Regression (v1.0) trained on Synthetic Research Dataset — For Academic Demonstration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
