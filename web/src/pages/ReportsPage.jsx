import React, { useState, useEffect } from 'react';
import { FileText, Eye, Download, Trash2, Printer, Activity, ShieldCheck } from 'lucide-react';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import { reportService } from '../services/reportService';
import { simulationService } from '../services/simulationService';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal controls
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedSimDetails, setSelectedSimDetails] = useState(null);

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await reportService.getReports();
      setReports(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleOpenView = async (report) => {
    setSelectedReport(report);
    try {
      // Find simulation details from history
      const sims = await simulationService.getSimulations();
      const match = sims.find(s => s.id === report.simulationId);
      setSelectedSimDetails(match);
      setIsViewOpen(true);
    } catch (err) {
      setToastType('error');
      setToastMessage("Failed to retrieve simulation logs for report.");
    }
  };

  const handleOpenDelete = (report) => {
    setSelectedReport(report);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedReport) return;
    try {
      await reportService.deleteReport(selectedReport.id);
      setToastType('success');
      setToastMessage(`Report ${selectedReport.id} deleted successfully.`);
      setIsDeleteOpen(false);
      setIsViewOpen(false);
      fetchReports();
    } catch (err) {
      setToastType('error');
      setToastMessage("Failed to delete report.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportText = (report, sim) => {
    if (!report || !sim) return;
    
    const content = `
==================================================
BIOPATCH AI - DRUG-RELEASE SIMULATION REPORT
==================================================
Report ID: ${report.id}
Simulation Reference: ${sim.id}
Date Compiled: ${report.date}
System Status: Demo Sandbox

--------------------------------------------------
1. FORMULATION SCHEMATIC
--------------------------------------------------
Active Drug Compound: ${sim.drugName}
Biopolymer Matrix Carrier: ${sim.polymerName}
Drug Loading Dose: ${sim.drugLoading} mg
Polymer Concentration Index: ${sim.polymerConcentration}%
Patch Matrix Thickness: ${sim.patchThickness} mm

--------------------------------------------------
2. BIOLOGICAL ENVIRONMENTAL CONDITIONS
--------------------------------------------------
Simulated Temperature: ${sim.temperature} C
Matrix pH Value: ${sim.pH}
Relative Humidity: ${sim.moisture}%
Total Study Duration: ${sim.duration} hours

--------------------------------------------------
3. AI KINETIC VERDICT & ACCURACY
--------------------------------------------------
Average Predicted Release: ${sim.predictedRelease}%
Peak Dissolution Rate: ${sim.peakReleaseRate}% / hour
Time to 50% Concentration: ${sim.timeTo50Percent}
Controlled Release Score — Research Metric: ${sim.controlledReleaseScore}/100
Simulation Risk Indicator: ${sim.riskLevel.toUpperCase()}

Kinetics Analysis Summary:
${sim.analysis}

--------------------------------------------------
4. MODEL ACCREDITATION
--------------------------------------------------
Modeling Algorithm: Random Forest Regression
Accreditation: Computational Research Prototype
Dataset: Synthetic Research Dataset — For Academic Demonstration
==================================================
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BioPatch_AI_Report_${report.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setToastType('success');
    setToastMessage("Report text file downloaded.");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center">
          <FileText className="h-5.5 w-5.5 text-medical-400 mr-2" />
          Simulation Reports Archive
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review, print, or download pre-clinical formulation modeling summaries.
        </p>
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full border-t-transparent border-medical-500 h-10 w-10 border-3" />
        </div>
      ) : reports.length === 0 ? (
        <div className="glass-card p-12 border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-600 mb-4">
            <FileText className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1.5">
            No reports compiled
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Save a completed simulation in the simulator dashboard to compile safety and kinetics documentation here.
          </p>
        </div>
      ) : (
        <div className="glass-card border-slate-800 overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold bg-[#0d111d]">
                  <th className="py-3 px-4">Report ID</th>
                  <th className="py-3 px-4">Reference Run</th>
                  <th className="py-3 px-4">Drug Compound</th>
                  <th className="py-3 px-4">Polymer Carrier</th>
                  <th className="py-3 px-4">Kinetics Summary</th>
                  <th className="py-3 px-4">Date Compiled</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {reports.map((rep) => (
                  <tr key={rep.id} className="hover:bg-slate-800/35 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-medical-400">{rep.id}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-400">{rep.simulationId}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-200">{rep.drugName}</td>
                    <td className="py-3.5 px-4">{rep.polymerName}</td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">{rep.summary}</td>
                    <td className="py-3.5 px-4 text-slate-500">{rep.date}</td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => handleOpenView(rep)}
                          className="p-1.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-slate-200 transition-all"
                          title="Preview Report"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={async () => {
                            const sims = await simulationService.getSimulations();
                            const match = sims.find(s => s.id === rep.simulationId);
                            handleExportText(rep, match);
                          }}
                          className="p-1.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-medical-400 transition-all"
                          title="Download Text File"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(rep)}
                          className="p-1.5 rounded hover:bg-slate-900 border border-transparent hover:border-slate-800 text-slate-400 hover:text-rose-400 transition-all"
                          title="Purge Report"
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

      {/* VIEW PREVIEW MODAL */}
      {selectedReport && selectedSimDetails && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Report Preview: ${selectedReport.id}`}
          size="lg"
          footer={
            <>
              <Button variant="danger" size="sm" onClick={() => handleOpenDelete(selectedReport)}>
                Delete Report
              </Button>
              <Button variant="secondary" size="sm" onClick={handlePrint} icon={Printer}>
                Print Layout
              </Button>
              <Button variant="primary" size="sm" onClick={() => handleExportText(selectedReport, selectedSimDetails)} icon={Download}>
                Download Text Report
              </Button>
            </>
          }
        >
          {/* Printable container */}
          <div className="print-report p-6 bg-[#0c0f1b] border border-slate-800 rounded-lg text-slate-200 space-y-6 select-text max-h-[60vh] overflow-y-auto">
            
            {/* Report Header */}
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded bg-gradient-to-tr from-medical-600 to-biotech-400 flex items-center justify-center print:border print:border-black">
                  <Activity className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-wider block text-slate-100">BIOPATCH AI</span>
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Formulation Kinetics Center</span>
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-500 font-semibold uppercase tracking-wider space-y-0.5">
                <div>Report: <span className="text-slate-300 font-bold">{selectedReport.id}</span></div>
                <div>Run Ref: <span className="text-slate-300 font-bold">{selectedReport.simulationId}</span></div>
                <div>Date: <span className="text-slate-300 font-bold">{selectedReport.date}</span></div>
              </div>
            </div>

            <div className="text-center py-2 bg-slate-900/60 border border-slate-800/80 rounded">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">
                Intelligent Biopolymer Drug-Delivery Simulation Report
              </h3>
            </div>

            {/* Grid layout */}
            <div className="grid grid-cols-2 gap-6 text-[11px] font-medium leading-relaxed">
              
              {/* Section 1: Simulation Info */}
              <div className="space-y-2.5">
                <h4 className="font-bold uppercase tracking-wider text-medical-400 border-b border-slate-800/80 pb-1">
                  1. Formulation Information
                </h4>
                <div className="space-y-1.5 text-slate-400">
                  <p>Active Drug Agent: <span className="text-slate-200 font-bold">{selectedSimDetails.drugName}</span></p>
                  <p>Biopolymer Matrix Carrier: <span className="text-slate-200 font-bold">{selectedSimDetails.polymerName}</span></p>
                  <p>Drug Loading Dose: <span className="text-slate-200 font-bold">{selectedSimDetails.drugLoading} mg</span></p>
                  <p>Polymer Concentration Index: <span className="text-slate-200 font-bold">{selectedSimDetails.polymerConcentration}%</span></p>
                  <p>Matrix Membrane Thickness: <span className="text-slate-200 font-bold">{selectedSimDetails.patchThickness} mm</span></p>
                </div>
              </div>

              {/* Section 2: Env Info */}
              <div className="space-y-2.5">
                <h4 className="font-bold uppercase tracking-wider text-biotech-400 border-b border-slate-800/80 pb-1">
                  2. Environmental Conditions
                </h4>
                <div className="space-y-1.5 text-slate-400">
                  <p>Simulated Body Temp: <span className="text-slate-200 font-bold">{selectedSimDetails.temperature} C</span></p>
                  <p>Testing pH Swelling Index: <span className="text-slate-200 font-bold">{selectedSimDetails.pH}</span></p>
                  <p>Relative Matrix Moisture: <span className="text-slate-200 font-bold">{selectedSimDetails.moisture}%</span></p>
                  <p>Total Sim Study Duration: <span className="text-slate-200 font-bold">{selectedSimDetails.duration} hours</span></p>
                </div>
              </div>
            </div>
 
            {/* AI Predictions */}
            <div className="space-y-2.5 pt-2">
              <h4 className="font-bold uppercase tracking-wider text-slate-200 border-b border-slate-800/80 pb-1 text-[11px]">
                3. AI Prediction & Research Metrics
              </h4>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Average Release</span>
                  <span className="text-xs font-bold text-slate-200">{selectedSimDetails.predictedRelease}%</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider block">Peak Release Rate</span>
                  <span className="text-xs font-bold text-slate-200">{selectedSimDetails.peakReleaseRate}% / h</span>
                </div>
                <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
                  <span className="text-[7.5px] text-slate-500 uppercase font-bold tracking-wider block leading-tight">Controlled Release Score — Research Metric</span>
                  <span className="text-xs font-bold text-slate-200">{selectedSimDetails.controlledReleaseScore}/100</span>
                </div>
              </div>
              
              <div className="p-3 rounded border border-slate-800 bg-slate-900/40 text-[10px] text-slate-400 font-medium mt-1 leading-normal flex items-start space-x-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 uppercase tracking-wide">Kinetics Verdict:</span>{' '}
                  {selectedSimDetails.analysis}
                </div>
              </div>
            </div>
 
            {/* Model Info */}
            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-medium">
              <div className="flex justify-between">
                <span>Model Calibration: Random Forest ensemble</span>
                <span>Dataset: Synthetic Research Dataset — For Academic Demonstration</span>
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
        title="Delete Compiled Report"
        message={`Are you sure you want to purge report reference "${selectedReport?.id}" from archives?`}
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

export default ReportsPage;
