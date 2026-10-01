import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  History as HistoryIcon, 
  Search, 
  Trash2, 
  Eye, 
  Play, 
  FileText,
  Thermometer,
  Activity,
  Droplet,
  Ruler,
  AlertTriangle
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { simulationService } from '../services/simulationService';
import { reportService } from '../services/reportService';

const SimulationHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [simulations, setSimulations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSim, setSelectedSim] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchSimulations = async () => {
    setIsLoading(true);
    try {
      const data = await simulationService.getSimulations();
      setSimulations(data);
      
      // Auto-open detail modal if passed in route state
      const stateSimId = location.state?.selectedSimId;
      if (stateSimId) {
        const found = data.find(s => s.id === stateSimId);
        if (found) {
          setSelectedSim(found);
          setIsDetailsOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSimulations();
  }, [location.state]);

  const handleOpenDetails = (sim) => {
    setSelectedSim(sim);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (sim) => {
    setSelectedSim(sim);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSim) return;
    try {
      await simulationService.deleteSimulation(selectedSim.id);
      setToastType('success');
      setToastMessage(`Simulation ${selectedSim.id} deleted successfully.`);
      setIsDeleteOpen(false);
      setIsDetailsOpen(false);
      fetchSimulations();
    } catch (err) {
      setToastType('error');
      setToastMessage("Error deleting simulation.");
    }
  };

  const handleRerun = (sim) => {
    // Navigate back to simulator, pushing parameters in router state
    // Simulator page will pick up this state and pre-populate!
    navigate('/simulator', { state: { rerunParams: sim } });
  };

  const handleGenerateReport = async (sim) => {
    try {
      await reportService.generateReport(sim);
      setToastType('success');
      setToastMessage(`Report compiled for simulation ${sim.id}. Check Reports view.`);
    } catch (err) {
      setToastType('error');
      setToastMessage("Could not generate report files.");
    }
  };

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low':
      default:
        return 'success';
    }
  };

  const filteredSims = simulations.filter(sim => {
    const matchesSearch = 
      sim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.drugName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.polymerName.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesRisk = riskFilter === 'All' || sim.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center">
          <HistoryIcon className="h-5.5 w-5.5 text-medical-400 mr-2" />
          Simulation History Registry
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Access all historical modeling computations, kinetic reports, and safety coefficients.
        </p>
      </div>

      {/* Search & Filter controls */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2 focus-within:border-medical-500 transition-colors w-full md:max-w-xs">
          <Search className="h-4.5 w-4.5 text-slate-500 mr-2.5 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by ID, drug, polymer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs text-slate-200 focus:outline-none w-full placeholder-slate-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs w-full md:w-auto justify-end">
          <span className="text-slate-500 font-semibold uppercase tracking-wider">Risk Filter:</span>
          {['All', 'Low', 'Medium', 'High'].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-1.5 rounded-lg border font-semibold transition-colors ${
                riskFilter === r 
                  ? 'bg-slate-800 text-slate-200 border-slate-700 shadow-md' 
                  : 'bg-transparent text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full border-t-transparent border-medical-500 h-10 w-10 border-3" />
        </div>
      ) : filteredSims.length === 0 ? (
        <div className="glass-card p-12 border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-600 mb-4">
            <HistoryIcon className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1.5">
            No history recorded
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            You haven't run any AI formulations matching this filter yet. Navigate to the simulator workspace to start.
          </p>
        </div>
      ) : (
        <div className="glass-card border-slate-800 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-[#0d111d]">
                  <th className="py-3 px-4">Run ID</th>
                  <th className="py-3 px-4">Active Drug</th>
                  <th className="py-3 px-4">Polymer Matrix</th>
                  <th className="py-3 px-4">Release %</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Safety Score</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Date Run</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredSims.map((sim) => (
                  <tr key={sim.id} className="hover:bg-slate-800/35 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-400">{sim.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{sim.drugName}</td>
                    <td className="py-3.5 px-4">{sim.polymerName}</td>
                    <td className="py-3.5 px-4 font-bold text-medical-400">{sim.predictedRelease}%</td>
                    <td className="py-3.5 px-4">{sim.duration}h</td>
                    <td className="py-3.5 px-4 font-bold">{sim.controlledReleaseScore}/100</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={getRiskColor(sim.riskLevel)}>
                        {sim.riskLevel}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{sim.date}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenDetails(sim)}
                          className="p-1.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
                          title="Open Details Panel"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleRerun(sim)}
                          className="p-1.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-medical-400 transition-all"
                          title="Load Parameters in Simulator"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(sim)}
                          className="p-1.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-rose-400 transition-all"
                          title="Purge Calculation"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILS VIEW MODAL */}
      {selectedSim && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Simulation Summary: ${selectedSim.id}`}
          size="lg"
          footer={
            <>
              <Button variant="danger" size="sm" onClick={() => handleOpenDelete(selectedSim)}>
                Delete Run
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleGenerateReport(selectedSim)}>
                Generate PDF Report
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleRerun(selectedSim)}>
                Re-run Formulation
              </Button>
            </>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
            {/* Input Details */}
            <div className="space-y-4 text-xs font-semibold">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">Parameter Configs</span>
                <Badge variant={getRiskColor(selectedSim.riskLevel)}>Risk: {selectedSim.riskLevel}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 text-slate-400">
                <div>Drug Compound: <span className="text-slate-200 block font-bold">{selectedSim.drugName}</span></div>
                <div>Polymer Matrix: <span className="text-slate-200 block font-bold">{selectedSim.polymerName}</span></div>
                <div>Drug Loading: <span className="text-slate-200 block font-bold">{selectedSim.drugLoading} mg</span></div>
                <div>Polymer Conc.: <span className="text-slate-200 block font-bold">{selectedSim.polymerConcentration}%</span></div>
              </div>

              <div className="flex items-center space-x-2 pt-2 border-t border-slate-800" />

              <div className="grid grid-cols-2 gap-3 text-slate-400">
                <div className="flex items-center"><Thermometer className="h-4 w-4 mr-1 text-amber-500" /> Temp: <span className="text-slate-200 ml-1 font-bold">{selectedSim.temperature}°C</span></div>
                <div className="flex items-center"><Activity className="h-4 w-4 mr-1 text-emerald-500" /> pH Index: <span className="text-slate-200 ml-1 font-bold">{selectedSim.pH}</span></div>
                <div className="flex items-center"><Droplet className="h-4 w-4 mr-1 text-cyan-500" /> Moisture: <span className="text-slate-200 ml-1 font-bold">{selectedSim.moisture}%</span></div>
                <div className="flex items-center"><Ruler className="h-4 w-4 mr-1 text-purple-500" /> Thickness: <span className="text-slate-200 ml-1 font-bold">{selectedSim.patchThickness} mm</span></div>
              </div>

              <div className="p-3 rounded-lg border border-slate-800 bg-[#0d1222]/80 mt-2 text-slate-400 leading-normal font-medium">
                <span className="font-bold text-slate-300 block mb-0.5 text-[9px] uppercase tracking-wider">AI Kinetics Verdict</span>
                {selectedSim.analysis}
              </div>
            </div>

            {/* Recharts chart */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Predicted Cumulative curve</h4>
              <div className="h-56 w-full border border-slate-800 rounded-lg p-2 bg-[#090c15]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSim.releaseCurve}>
                    <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                    <XAxis dataKey="time" stroke="#475569" style={{ fontSize: 9 }} />
                    <YAxis stroke="#475569" style={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 4, fontSize: 10 }} />
                    <Line type="monotone" dataKey="predicted" stroke="#0ea5e9" strokeWidth={2.5} name="Release" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Purge computation record"
        message={`Are you sure you want to permanently erase simulation ${selectedSim?.id} from local archives?`}
      />

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

export default SimulationHistoryPage;
