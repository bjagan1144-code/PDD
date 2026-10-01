import React, { useState, useEffect } from 'react';
import { Layers, Search, Plus, Edit, Trash2, Info, Eye } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import Badge from '../components/Badge';
import { polymerService } from '../services/polymerService';

const PolymerLibraryPage = () => {
  const [polymers, setPolymers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Selected Polymer for operations
  const [selectedPolymer, setSelectedPolymer] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [biodegradable, setBiodegradable] = useState('true');
  const [concentrationRange, setConcentrationRange] = useState('');
  const [releaseBehavior, setReleaseBehavior] = useState('');
  const [swellingRatio, setSwellingRatio] = useState('');
  const [degradationRate, setDegradationRate] = useState('');
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchPolymers = async () => {
    setIsLoading(true);
    try {
      const data = await polymerService.getPolymers();
      setPolymers(data);
    } catch (err) {
      console.error("Error fetching polymers:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolymers();
  }, []);

  const handleOpenAdd = () => {
    setSelectedPolymer(null);
    setName('');
    setType('');
    setBiodegradable('true');
    setConcentrationRange('');
    setReleaseBehavior('');
    setSwellingRatio('');
    setDegradationRate('');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (poly) => {
    setSelectedPolymer(poly);
    setName(poly.name);
    setType(poly.type);
    setBiodegradable(poly.biodegradable ? 'true' : 'false');
    setConcentrationRange(poly.concentrationRange || '');
    setReleaseBehavior(poly.releaseBehavior || '');
    setSwellingRatio(poly.swellingRatio || '');
    setDegradationRate(poly.degradationRate || '');
    setIsAddEditOpen(true);
  };

  const handleOpenView = (poly) => {
    setSelectedPolymer(poly);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (poly) => {
    setSelectedPolymer(poly);
    setIsDeleteOpen(true);
  };

  const handleSavePolymer = async (e) => {
    e.preventDefault();
    if (!name || !type || !releaseBehavior) {
      setToastType('error');
      setToastMessage("Name, Type, and Release Behavior are required.");
      return;
    }

    const payload = {
      name,
      type,
      biodegradable: biodegradable === 'true',
      concentrationRange,
      releaseBehavior,
      swellingRatio,
      degradationRate
    };

    try {
      if (selectedPolymer) {
        await polymerService.updatePolymer(selectedPolymer.id, payload);
        setToastType('success');
        setToastMessage(`Polymer "${name}" updated successfully.`);
      } else {
        await polymerService.addPolymer(payload);
        setToastType('success');
        setToastMessage(`New polymer "${name}" added to registry.`);
      }
      setIsAddEditOpen(false);
      fetchPolymers();
    } catch (err) {
      setToastType('error');
      setToastMessage("Error saving polymer records.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPolymer) return;
    try {
      await polymerService.deletePolymer(selectedPolymer.id);
      setToastType('success');
      setToastMessage(`Polymer "${selectedPolymer.name}" deleted successfully.`);
      setIsDeleteOpen(false);
      fetchPolymers();
    } catch (err) {
      setToastType('error');
      setToastMessage("Error deleting polymer record.");
    }
  };

  const filteredPolymers = polymers.filter(poly => 
    poly.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    poly.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center">
            <Layers className="h-5.5 w-5.5 text-medical-400 mr-2" />
            Biopolymer Library Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse biocompatibility classes, degradation profiles, and swellable diffusion behavior of polymers.
          </p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary" size="sm" icon={Plus}>
          Add Biopolymer
        </Button>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-medical-500 transition-colors w-full md:max-w-md">
        <Search className="h-5 w-5 text-slate-500 mr-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by polymer name or chemical type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-sm text-slate-200 focus:outline-none w-full placeholder-slate-500"
        />
      </div>

      {/* Grid of Polymer Cards */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full border-t-transparent border-medical-500 h-10 w-10 border-3" />
        </div>
      ) : filteredPolymers.length === 0 ? (
        <div className="glass-card p-12 border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-600 mb-4">
            <Layers className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1">
            No polymers match query
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Try adjusting your search criteria or register a new biodegradable carrier polymer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPolymers.map((poly) => (
            <div 
              key={poly.id} 
              className="glass-card p-5 border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="truncate w-3/4">
                    <h3 className="text-sm font-bold text-slate-200 truncate">{poly.name}</h3>
                    <span className="text-[10px] font-bold text-biotech-400 uppercase tracking-wider block mt-0.5 truncate">
                      {poly.type}
                    </span>
                  </div>
                  {poly.biodegradable ? (
                    <Badge variant="success">Biodegradable</Badge>
                  ) : (
                    <Badge variant="neutral">Synthetic</Badge>
                  )}
                </div>
                
                <div className="text-xs text-slate-400 leading-normal space-y-1.5 pt-1 font-medium">
                  <p><span className="text-slate-500 font-bold uppercase text-[9px] tracking-wider block">Kinetics:</span> {poly.releaseBehavior}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-800/60">
                  <div>Swelling: <span className="text-slate-300 font-bold">{poly.swellingRatio || 'N/A'}</span></div>
                  <div>Degradation: <span className="text-slate-300 font-bold">{poly.degradationRate || 'N/A'}</span></div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-800/50">
                <button
                  onClick={() => handleOpenView(poly)}
                  className="p-2 rounded bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(poly)}
                  className="p-2 rounded bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-medical-400 transition-colors"
                  title="Edit Record"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleOpenDelete(poly)}
                  className="p-2 rounded bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete Carrier"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedPolymer && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Polymer details: ${selectedPolymer.name}`}
        >
          <div className="space-y-4 text-xs font-medium leading-relaxed">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Chemical Type</span>
                <span className="text-sm font-bold text-slate-200">{selectedPolymer.type}</span>
              </div>
              {selectedPolymer.biodegradable ? (
                <Badge variant="success">Biodegradable matrix</Badge>
              ) : (
                <Badge variant="neutral">Synthetic carrier</Badge>
              )}
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Sustained Release Kinetics</span>
              <span className="text-slate-300">{selectedPolymer.releaseBehavior}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Swelling Ratio Index</span>
                <span className="text-slate-300">{selectedPolymer.swellingRatio || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Hydrolytic Degradation</span>
                <span className="text-slate-300">{selectedPolymer.degradationRate || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Concentration range</span>
              <span className="text-slate-300">{selectedPolymer.concentrationRange || 'Not evaluated'}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD/EDIT POLYMER MODAL */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={selectedPolymer ? `Edit Polymer: ${selectedPolymer.name}` : "Add Biopolymer"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSavePolymer}>
              Save Polymer
            </Button>
          </>
        }
      >
        <form onSubmit={handleSavePolymer} className="space-y-4">
          <Input
            label="Polymer Common Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sodium Alginate"
            required
          />

          <Input
            label="Chemical Classification"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="e.g. Natural Polysaccharide"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Biodegradable Capacity"
              name="biodegradable"
              value={biodegradable}
              onChange={(e) => setBiodegradable(e.target.value)}
              options={[
                { value: 'true', label: 'Yes, Biodegradable' },
                { value: 'false', label: 'No, Synthetic/Persistent' }
              ]}
              required
              placeholder=""
            />
            <Input
              label="Tested Concentration range"
              name="concentrationRange"
              value={concentrationRange}
              onChange={(e) => setConcentrationRange(e.target.value)}
              placeholder="e.g. 1.0% - 4.5%"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Swelling Ratio"
              name="swellingRatio"
              value={swellingRatio}
              onChange={(e) => setSwellingRatio(e.target.value)}
              placeholder="e.g. 350%"
            />
            <Input
              label="Hydrolytic Degradation Rate"
              name="degradationRate"
              value={degradationRate}
              onChange={(e) => setDegradationRate(e.target.value)}
              placeholder="e.g. 30-60 days"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Swelling & Release behavior description
            </label>
            <textarea
              value={releaseBehavior}
              onChange={(e) => setReleaseBehavior(e.target.value)}
              placeholder="Detail how the polymer swelling and molecular erosion properties govern release..."
              rows="3"
              className="block w-full rounded-lg border border-slate-800 bg-slate-900/60 text-slate-100 placeholder-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-medical-500 focus:border-transparent text-sm px-3.5 py-2.5"
              required
            />
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete biopolymer matrix"
        message={`Are you sure you want to delete "${selectedPolymer?.name}" from the carrier registry? Any historical runs saved with this matrix configuration will keep references.`}
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

export default PolymerLibraryPage;
