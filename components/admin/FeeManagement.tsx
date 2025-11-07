import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../common/GlassCard';
import { dbService } from '../../services/dbService';
import { ClassFee } from '../../types';
import { BookIcon, TrashIcon } from '../common/Icons';

// Modal Component for Editing Fees
const FeeEditModal: React.FC<{
  classFee: ClassFee;
  onClose: () => void;
  onSave: (updatedFee: ClassFee) => void;
}> = ({ classFee, onClose, onSave }) => {
  const [editableFee, setEditableFee] = useState<ClassFee>(
    JSON.parse(JSON.stringify(classFee)) // Deep copy to avoid direct mutation
  );

  const handleMonthlyFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditableFee({ ...editableFee, monthlyFee: Number(e.target.value) });
  };

  const handleOtherFeeChange = (index: number, field: 'name' | 'amount', value: string | number) => {
    const newOtherFees = [...editableFee.otherFees];
    newOtherFees[index] = { ...newOtherFees[index], [field]: value };
    setEditableFee({ ...editableFee, otherFees: newOtherFees });
  };

  const addOtherFee = () => {
    setEditableFee({
      ...editableFee,
      otherFees: [...editableFee.otherFees, { name: '', amount: 0 }],
    });
  };

  const removeOtherFee = (index: number) => {
    const newOtherFees = editableFee.otherFees.filter((_, i) => i !== index);
    setEditableFee({ ...editableFee, otherFees: newOtherFees });
  };

  const totalAnnualFee = useMemo(() => {
    const otherFeesTotal = editableFee.otherFees.reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
    return editableFee.monthlyFee * 12 + otherFeesTotal;
  }, [editableFee]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <GlassCard className="max-h-[90vh] overflow-y-auto">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">Manage Fees for Class {editableFee.classLevel}</h3>
          
          {/* Monthly Fee */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-600 mb-2">Monthly Tuition Fee</label>
            <input
              type="number"
              value={editableFee.monthlyFee}
              onChange={handleMonthlyFeeChange}
              className="w-full p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Other Fees */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-slate-700 mb-3">Other Fees</h4>
            <div className="space-y-3">
              {editableFee.otherFees.map((fee, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Fee Name (e.g., Sports Fee)"
                    value={fee.name}
                    onChange={(e) => handleOtherFeeChange(index, 'name', e.target.value)}
                    className="flex-grow p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    placeholder="Amount"
                    value={fee.amount}
                    onChange={(e) => handleOtherFeeChange(index, 'amount', Number(e.target.value))}
                    className="w-32 p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button onClick={() => removeOtherFee(index)} className="p-3 text-red-500 hover:bg-red-500/10 rounded-lg">
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
            <button onClick={addOtherFee} className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800">+ Add Another Fee</button>
          </div>

          <hr className="w-full border-black/10 my-6" />

          {/* Summary and Actions */}
          <div className="flex justify-between items-center">
             <div>
                <span className="text-slate-500">Total Annual Fee:</span>
                <span className="ml-2 text-2xl font-bold text-slate-800">₹{totalAnnualFee.toLocaleString()}</span>
             </div>
            <div className="flex gap-4">
              <button onClick={onClose} className="py-2 px-6 bg-black/5 hover:bg-black/10 rounded-lg text-slate-700 font-semibold transition-all">Cancel</button>
              <button onClick={() => onSave(editableFee)} className="py-2 px-6 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-md transition-all">Save Changes</button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

// Main Component
const ClassFeeCard: React.FC<{ fee: ClassFee, onClick: () => void }> = ({ fee, onClick }) => {
  const annualFee = useMemo(() => {
    const otherFeesTotal = fee.otherFees.reduce((sum, f) => sum + f.amount, 0);
    return fee.monthlyFee * 12 + otherFeesTotal;
  }, [fee]);

  return (
    <button onClick={onClick} className="w-full text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-2xl">
      <GlassCard className="h-full group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex flex-col items-center text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-xl mb-4 text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                <BookIcon />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Class {fee.classLevel}</h3>
            <p className="text-slate-500 text-sm mb-4">Click to manage fees</p>
            <hr className="w-full border-black/10 my-2" />
            <div className="w-full flex justify-between items-center mt-2">
                <span className="text-slate-500 text-sm">Total Annual</span>
                <span className="text-slate-800 font-bold text-lg">₹{annualFee.toLocaleString()}</span>
            </div>
        </div>
      </GlassCard>
    </button>
  );
};

const FeeManagement: React.FC = () => {
  const [fees, setFees] = useState<ClassFee[]>(dbService.getFeeStructures());
  const [selectedClass, setSelectedClass] = useState<ClassFee | null>(null);

  const handleSave = (updatedFee: ClassFee) => {
    const newFees = fees.map(f => f.classLevel === updatedFee.classLevel ? updatedFee : f);
    dbService.updateFeeStructure(newFees);
    setFees(newFees);
    setSelectedClass(null);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800">Fee Structure Management</h2>
      <p className="text-slate-500 mb-6">Configure fees for each class by month</p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {fees
          .sort((a, b) => a.classLevel - b.classLevel)
          .map(fee => (
            <ClassFeeCard key={fee.classLevel} fee={fee} onClick={() => setSelectedClass(fee)} />
        ))}
      </div>

      {selectedClass && (
        <FeeEditModal
          classFee={selectedClass}
          onClose={() => setSelectedClass(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default FeeManagement;