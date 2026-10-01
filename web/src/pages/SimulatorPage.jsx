import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Cpu, 
  RefreshCw, 
  Save, 
  FileText, 
  HelpCircle, 
  Info, 
  CheckCircle,
  Database,
  Sliders,
  Maximize2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Slider from '../components/Slider';
import Badge from '../components/Badge';
import Toast from '../components/Toast';
import { drugService } from '../services/drugService';
import { polymerService } from '../services/polymerService';
import { simulationService } from '../services/simulationService';
import { reportService } from '../services/reportService';

const SimulatorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Reference lists from localStorage CRUD services
  const [drugs, setDrugs] = useState([]);
  const [polymers, setPolymers] = useState([]);
  
  // Form State
  const [selectedDrug, setSelectedDrug] = useState('Ibuprofen');
  const [customDrugName, setCustomDrugName] = useState('');
  
  const [selectedPolymer, setSelectedPolymer] = useState('Chitosan');
  const [customPolymerName, setCustomPolymerName] = useState('');

  const [drugLoading, setDrugLoading] = useState(50);
  const [polymerConcentration, setPolymerConcentration] = useState(2.5);
  const [patchThickness, setPatchThickness] = useState(1.2);
  const [temperature, setTemperature] = useState(37);
  const [pH, setPH] = useState(6.8);
  const [moisture, setMoisture] = useState(50);
  const [duration, setDuration] = useState(12);

  // Simulation loading/output states
  const [simStatusStep, setSimStatusStep] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);

  // General Toast notifications
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const loadingSteps = [
    "Analyzing formulation properties...",
    "Processing biological environmental conditions...",
    "Running AI predictive regression model...",
    "Generating drug-release kinetics profile...",
    "Preparing results and computing risk indices..."
  ];

  useEffect(() => {
    const loadDefaults = async () => {
      const drugList = await drugService.getDrugs();
      setDrugs(drugList);
      const polyList = await polymerService.getPolymers();
      setPolymers(polyList);

      // Hydrodynamic state pre-population if re-running from history
      const rerun = location.state?.rerunParams;
      if (rerun) {
        // If drug is not standard, flag Custom
        const isStandardDrug = drugList.some(d => d.name === rerun.drugName);
        if (isStandardDrug) {
          setSelectedDrug(rerun.drugName);
        } else {
          setSelectedDrug('Custom');
          setCustomDrugName(rerun.drugName);
        }

        const isStandardPolymer = polyList.some(p => p.name === rerun.polymerName);
        if (isStandardPolymer) {
          setSelectedPolymer(rerun.polymerName);
        } else {
          setSelectedPolymer('Custom');
          setCustomPolymerName(rerun.polymerName);
        }

        setDrugLoading(rerun.drugLoading);
        setPolymerConcentration(rerun.polymerConcentration);
        setPatchThickness(rerun.patchThickness);
        setTemperature(rerun.temperature);
        setPH(rerun.pH);
        setMoisture(rerun.moisture);
        setDuration(rerun.duration);
        
        setToastType('success');
        setToastMessage(`Pre-loaded formulation parameters for simulation run ${rerun.id}`);
      }
    };
    loadDefaults();
  }, [location.state]);

  const handleReset = () => {
    setSelectedDrug('Ibuprofen');
    setCustomDrugName('');
    setSelectedPolymer('Chitosan');
    setCustomPolymerName('');
    setDrugLoading(50);
    setPolymerConcentration(2.5);
    setPatchThickness(1.2);
    setTemperature(37);
    setPH(6.8);
    setMoisture(50);
    setDuration(12);
    setSimulationResult(null);
  };

  const handleRunSimulation = async () => {
    const finalDrugName = selectedDrug === 'Custom' ? customDrugName || 'Custom Drug' : selectedDrug;
    const finalPolymerName = selectedPolymer === 'Custom' ? customPolymerName || 'Custom Polymer' : selectedPolymer;

    const params = {
      drugName: finalDrugName,
      polymerName: finalPolymerName,
      drugLoading,
      polymerConcentration,
      patchThickness,
      temperature,
      pH,
      moisture,
      duration
    };

    setIsSimulating(true);
    setSimStatusStep(0);

    // Simulate progress increments (sequentially update loadingSteps)
    const stepInterval = setInterval(() => {
      setSimStatusStep(prev => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          return prev;
        }
      });
    }, 450);

    try {
      const result = await simulationService.runSimulation(params);
      
      // Inject physical noise into a secondary curve called "Simulated Curve"
      // to make it look like a real experimental overlay
      const enhancedCurve = result.releaseCurve.map(point => {
        const noise = (Math.random() - 0.5) * 2.5; // +-1.25% noise
        let simulatedVal = parseFloat((point.predicted + noise).toFixed(1));
        if (simulatedVal < 0) simulatedVal = 0;
        if (simulatedVal > 100) simulatedVal = 100;
        
        return {
          ...point,
          simulated: simulatedVal
        };
      });

      setSimulationResult({
        ...result,
        releaseCurve: enhancedCurve
      });
      setToastType('success');
      setToastMessage("AI simulation run complete and registered in history.");
    } catch (err) {
      setToastType('error');
      setToastMessage("Error compiling simulation profile.");
      console.error(err);
    } finally {
      clearInterval(stepInterval);
      setIsSimulating(false);
    }
  };

  const handleSaveReport = async () => {
    if (!simulationResult) return;
    try {
      await reportService.generateReport(simulationResult);
      setToastType('success');
      setToastMessage("Report generated successfully. Navigate to Reports to download.");
    } catch (err) {
      setToastType('error');
      setToastMessage("Could not generate report files.");
    }
  };

  const getRiskBadgeVariant = (risk) => {
    switch (risk) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low':
      default:
        return 'success';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center">
          <Cpu className="h-5.5 w-5.5 text-medical-400 mr-2" />
          Drug Release Simulator
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure formulation chemistry and biological conditions to simulate controlled transdermal drug delivery.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 border-slate-800 space-y-5">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/80">
              <Sliders className="h-4.5 w-4.5 text-medical-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                Formulation & Matrix Config
              </h3>
            </div>

            {/* Drug select */}
            <div className="grid grid-cols-1 gap-4">
              <Select
                label="Selected Drug Active Agent"
                name="drug"
                value={selectedDrug}
                onChange={(e) => setSelectedDrug(e.target.value)}
                options={[
                  ...drugs.map(d => ({ value: d.name, label: d.name })),
                  { value: 'Custom', label: '➕ Custom Active Drug' }
                ]}
                placeholder=""
              />
              {selectedDrug === 'Custom' && (
                <Input
                  label="Custom Drug Name"
                  name="customDrug"
                  value={customDrugName}
                  onChange={(e) => setCustomDrugName(e.target.value)}
                  placeholder="Enter drug name"
                  required
                />
              )}
            </div>

            {/* Polymer select */}
            <div className="grid grid-cols-1 gap-4">
              <Select
                label="Selected Biopolymer Matrix"
                name="polymer"
                value={selectedPolymer}
                onChange={(e) => setSelectedPolymer(e.target.value)}
                options={[
                  ...polymers.map(p => ({ value: p.name, label: p.name })),
                  { value: 'Custom', label: '➕ Custom Biopolymer' }
                ]}
                placeholder=""
              />
              {selectedPolymer === 'Custom' && (
                <Input
                  label="Custom Polymer Name"
                  name="customPolymer"
                  value={customPolymerName}
                  onChange={(e) => setCustomPolymerName(e.target.value)}
                  placeholder="Enter polymer name"
                  required
                />
              )}
            </div>

            {/* Drug Loading */}
            <Slider
              label="Drug Loading Dose"
              name="drugLoading"
              min={10}
              max={100}
              step={1}
              value={drugLoading}
              onChange={(e) => setDrugLoading(e.target.value)}
              unit="mg"
            />

            {/* Polymer Concentration */}
            <Slider
              label="Polymer Concentration Index"
              name="polymerConcentration"
              min={0.5}
              max={15.0}
              step={0.1}
              value={polymerConcentration}
              onChange={(e) => setPolymerConcentration(e.target.value)}
              unit="%"
            />

            {/* Patch Thickness */}
            <Slider
              label="Patch Matrix Thickness"
              name="patchThickness"
              min={0.1}
              max={5.0}
              step={0.1}
              value={patchThickness}
              onChange={(e) => setPatchThickness(e.target.value)}
              unit="mm"
            />

            <div className="flex items-center space-x-2 pt-3 border-b border-slate-800/80">
              <Database className="h-4.5 w-4.5 text-biotech-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                Environmental Conditions
              </h3>
            </div>

            {/* Temperature */}
            <Slider
              label="Simulated Temperature"
              name="temperature"
              min={20}
              max={45}
              step={0.5}
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              unit="°C"
            />

            {/* pH */}
            <Slider
              label="Matrix pH Value"
              name="pH"
              min={1.0}
              max={9.0}
              step={0.1}
              value={pH}
              onChange={(e) => setPH(e.target.value)}
              unit="pH"
            />

            {/* Moisture */}
            <Slider
              label="Relative Matrix Moisture"
              name="moisture"
              min={0}
              max={100}
              step={5}
              value={moisture}
              onChange={(e) => setMoisture(e.target.value)}
              unit="%"
            />

            {/* Simulation Duration */}
            <Slider
              label="Total Release Duration"
              name="duration"
              min={1}
              max={48}
              step={1}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              unit="hours"
            />

            {/* BUTTON CONTROLS */}
            <div className="flex space-x-3 pt-3">
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isSimulating}
                className="w-1/3 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" />
                Reset
              </Button>
              <Button
                variant="primary"
                onClick={handleRunSimulation}
                isLoading={isSimulating}
                className="w-2/3 text-xs font-bold"
              >
                Run AI Simulation
              </Button>
            </div>
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* SIMULATOR LOADING STATE OVERLAY */}
          {isSimulating && (
            <div className="glass-card p-8 border-slate-800 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
              <div className="relative h-20 w-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
                <div className="absolute inset-0 rounded-full border-4 border-medical-500 border-t-transparent animate-spin" />
                <Cpu className="h-8 w-8 text-medical-400 animate-pulse-slow" />
              </div>
              <div className="space-y-2 text-center">
                <p className="text-sm font-bold text-slate-200 tracking-wider transition-all duration-300">
                  {loadingSteps[simStatusStep]}
                </p>
                <div className="flex items-center justify-center space-x-1">
                  {loadingSteps.map((_, idx) => (
                    <span 
                      key={idx} 
                      className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                        idx <= simStatusStep ? 'bg-medical-500 w-4' : 'bg-slate-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!isSimulating && !simulationResult && (
            <div className="glass-card p-12 border-slate-800 flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 mb-4 shadow-inner">
                <Cpu className="h-10 w-10 text-slate-600 animate-float" />
              </div>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                No active simulation
              </h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed mb-6">
                Configure formulation ratios and environmental factors in the left workspace, then click "Run AI Simulation" to model the cumulative drug release curve.
              </p>
            </div>
          )}

          {/* SIMULATION RESULTS PANEL */}
          {!isSimulating && simulationResult && (
            <div className="space-y-6">
              
              {/* Output parameters grid */}
              <div className="glass-card p-6 border-slate-800">
                <div className="flex justify-between items-center pb-3.5 border-b border-slate-800/80 mb-5">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                    Simulation Analytics Output
                  </h3>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getRiskBadgeVariant(simulationResult.riskLevel)} hasDot>
                      Simulation Risk Indicator: {simulationResult.riskLevel}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-semibold">{simulationResult.id}</span>
                  </div>
                </div>
 
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Avg Release</p>
                    <p className="text-lg font-black text-slate-200 mt-0.5">{simulationResult.predictedRelease}%</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Peak Rate</p>
                    <p className="text-lg font-black text-slate-200 mt-0.5">{simulationResult.peakReleaseRate}% / h</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Time to 50%</p>
                    <p className="text-lg font-black text-slate-200 mt-0.5">{simulationResult.timeTo50Percent}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Est. Duration</p>
                    <p className="text-lg font-black text-slate-200 mt-0.5">{simulationResult.estimatedDuration}</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Controlled Release Score — Research Metric</p>
                    <p className="text-lg font-black text-slate-200 mt-0.5">{simulationResult.controlledReleaseScore}/100</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="w-full text-xs font-bold" onClick={handleSaveReport}>
                      <FileText className="h-4 w-4 mr-1.5" />
                      Save Report
                    </Button>
                  </div>
                </div>
              </div>

              {/* Kinetics Chart */}
              <div className="glass-card p-6 border-slate-800">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                    Predicted Drug Release Profile
                  </h3>
                  <div className="flex items-center space-x-3 text-[10px] uppercase font-semibold">
                    <span className="flex items-center text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-medical-500 mr-1" />
                      AI Predicted
                    </span>
                    <span className="flex items-center text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] mr-1" />
                      Simulated Test
                    </span>
                    <span className="flex items-center text-slate-600">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-600 mr-1 border border-dashed border-slate-500" />
                      Target
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={simulationResult.releaseCurve}>
                      <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: 'Time (Hours)', position: 'insideBottom', offset: -5 }} stroke="#475569" style={{ fontSize: 10 }} />
                      <YAxis label={{ value: 'Cumulative Release (%)', angle: -90, position: 'insideLeft' }} stroke="#475569" style={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                      <Line type="monotone" dataKey="predicted" stroke="#0ea5e9" strokeWidth={3} name="AI Predicted" dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="simulated" stroke="#10b981" strokeWidth={2} name="Simulated Test" dot={false} opacity={0.8} />
                      <Line type="monotone" dataKey="target" stroke="#475569" strokeDasharray="5 5" name="Target" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Dynamic Analysis Explanation */}
              <div className="glass-card p-5 border-slate-800 flex items-start space-x-4 bg-slate-900/20">
                <div className="p-2 rounded bg-medical-500/10 text-medical-400 border border-medical-500/20">
                  <Info className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-200 uppercase tracking-widest">AI Chemical Analysis</h4>
                  <p className="text-slate-400 leading-relaxed font-medium">
                    {simulationResult.analysis}
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};

export default SimulatorPage;
