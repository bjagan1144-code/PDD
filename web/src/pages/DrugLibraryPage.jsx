import React, { useState, useEffect } from 'react';
import { Pill, Search, Plus, Edit, Trash2, Info, Eye } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import Badge from '../components/Badge';
import { drugService } from '../services/drugService';

const DrugLibraryPage = () => {
  const [drugs, setDrugs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  // Selected Drug for operations
  const [selectedDrug, setSelectedDrug] = useState(null);
  
  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [molecularWeight, setMolecularWeight] = useState('');
  const [solubility, setSolubility] = useState('');
  const [halfLife, setHalfLife] = useState('');
  
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const fetchDrugs = async () => {
    setIsLoading(true);
    try {
      const data = await drugService.getDrugs();
      setDrugs(data);
    } catch (err) {
      console.error("Error fetching drugs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  const handleOpenAdd = () => {
    setSelectedDrug(null);
    setName('');
    setCategory('');
    setDescription('');
    setMolecularWeight('');
    setSolubility('');
    setHalfLife('');
    setIsAddEditOpen(true);
  };

  const handleOpenEdit = (drug) => {
    setSelectedDrug(drug);
    setName(drug.name);
    setCategory(drug.category);
    setDescription(drug.description);
    setMolecularWeight(drug.molecularWeight || '');
    setSolubility(drug.solubility || '');
    setHalfLife(drug.halfLife || '');
    setIsAddEditOpen(true);
  };

  const handleOpenView = (drug) => {
    setSelectedDrug(drug);
    setIsViewOpen(true);
  };

  const handleOpenDelete = (drug) => {
    setSelectedDrug(drug);
    setIsDeleteOpen(true);
  };

  const handleSaveDrug = async (e) => {
    e.preventDefault();
    if (!name || !category || !description) {
      setToastType('error');
      setToastMessage("Name, Category, and Description are required.");
      return;
    }

    const payload = {
      name,
      category,
      description,
      molecularWeight: molecularWeight ? parseFloat(molecularWeight) : null,
      solubility,
      halfLife,
      status: "Completed"
    };

    try {
      if (selectedDrug) {
        await drugService.updateDrug(selectedDrug.id, payload);
        setToastType('success');
        setToastMessage(`Drug "${name}" updated successfully.`);
      } else {
        await drugService.addDrug(payload);
        setToastType('success');
        setToastMessage(`New drug "${name}" added to library.`);
      }
      setIsAddEditOpen(false);
      fetchDrugs();
    } catch (err) {
      setToastType('error');
      setToastMessage("Error saving drug records.");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDrug) return;
    try {
      await drugService.deleteDrug(selectedDrug.id);
      setToastType('success');
      setToastMessage(`Drug "${selectedDrug.name}" deleted successfully.`);
      setIsDeleteOpen(false);
      fetchDrugs();
    } catch (err) {
      setToastType('error');
      setToastMessage("Error deleting drug record.");
    }
  };

  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center">
            <Pill className="h-5.5 w-5.5 text-medical-400 mr-2" />
            Drug Library Registry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search molecular categories, half-lives, solubility indices, and formulations available for modeling.
          </p>
        </div>
        <Button onClick={handleOpenAdd} variant="primary" size="sm" icon={Plus}>
          Add Active Drug
        </Button>
      </div>

      {/* Search Filter Bar */}
      <div className="flex items-center bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-2.5 focus-within:border-medical-500 transition-colors w-full md:max-w-md">
        <Search className="h-5 w-5 text-slate-500 mr-3 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by drug name or classification..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-sm text-slate-200 focus:outline-none w-full placeholder-slate-500"
        />
      </div>

      {/* Grid of Drugs Cards */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <div className="animate-spin rounded-full border-t-transparent border-medical-500 h-10 w-10 border-3" />
        </div>
      ) : filteredDrugs.length === 0 ? (
        <div className="glass-card p-12 border-slate-800 flex flex-col items-center justify-center text-center">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-600 mb-4">
            <Pill className="h-8 w-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-1">
            No drugs match query
          </h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Try adjusting your search criteria or register a new custom active compound in the library.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDrugs.map((drug) => (
            <div 
              key={drug.id} 
              className="glass-card p-5 border-slate-800/80 flex flex-col justify-between hover:border-slate-700/80 group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="truncate w-3/4">
                    <h3 className="text-sm font-bold text-slate-200 truncate">{drug.name}</h3>
                    <span className="text-[10px] font-bold text-medical-400 uppercase tracking-wider block mt-0.5 truncate">
                      {drug.category}
                    </span>
                  </div>
                  <Badge variant="info">Dose Ready</Badge>
                </div>
                
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {drug.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider pt-2 border-t border-slate-800/60">
                  <div>MW: <span className="text-slate-300 font-bold">{drug.molecularWeight ? `${drug.molecularWeight} g/mol` : 'N/A'}</span></div>
                  <div>Half-life: <span className="text-slate-300 font-bold">{drug.halfLife || 'N/A'}</span></div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 mt-4 border-t border-slate-800/50">
                <button
                  onClick={() => handleOpenView(drug)}
                  className="p-2 rounded bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-slate-200 transition-colors"
                  title="View Details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleOpenEdit(drug)}
                  className="p-2 rounded bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-medical-400 transition-colors"
                  title="Edit Record"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleOpenDelete(drug)}
                  className="p-2 rounded bg-slate-900 border border-slate-800/60 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete Compound"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {selectedDrug && (
        <Modal
          isOpen={isViewOpen}
          onClose={() => setIsViewOpen(false)}
          title={`Drug profile: ${selectedDrug.name}`}
        >
          <div className="space-y-4 text-xs font-medium leading-relaxed">
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Classification Category</span>
              <span className="text-sm font-bold text-slate-200">{selectedDrug.category}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Solubility characteristics</span>
              <span className="text-slate-300">{selectedDrug.solubility || 'Not evaluated'}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Molecular Weight</span>
                <span className="text-slate-300">{selectedDrug.molecularWeight ? `${selectedDrug.molecularWeight} g/mol` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Biological Half-Life</span>
                <span className="text-slate-300">{selectedDrug.halfLife || 'N/A'}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Therapeutic description</span>
              <p className="text-slate-400 mt-1">{selectedDrug.description}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* ADD/EDIT DRUG MODAL */}
      <Modal
        isOpen={isAddEditOpen}
        onClose={() => setIsAddEditOpen(false)}
        title={selectedDrug ? `Edit Drug: ${selectedDrug.name}` : "Add Active Compound"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddEditOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveDrug}>
              Save Compound
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveDrug} className="space-y-4">
          <Input
            label="Active Compound Name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Losartan Potassium"
            required
          />

          <Input
            label="Category Classification"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Antihypertensive"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Mol. Weight (g/mol)"
              name="mw"
              type="number"
              step="0.01"
              value={molecularWeight}
              onChange={(e) => setMolecularWeight(e.target.value)}
              placeholder="e.g. 422.91"
            />
            <Input
              label="Solubility Index"
              name="solubility"
              value={solubility}
              onChange={(e) => setSolubility(e.target.value)}
              placeholder="e.g. Soluble in water"
            />
            <Input
              label="Half-Life"
              name="halfLife"
              value={halfLife}
              onChange={(e) => setHalfLife(e.target.value)}
              placeholder="e.g. 2.0 hours"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Therapeutic Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a scientific overview of therapeutic applications..."
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
        title="Delete active compound"
        message={`Are you sure you want to delete "${selectedDrug?.name}" from the drug registry? Simulations configured with this drug will remain, but you won't be able to run new runs with it unless re-added.`}
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

export default DrugLibraryPage;
