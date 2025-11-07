import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../common/GlassCard';
import { dbService } from '../../services/dbService';
import { Student, ClassFee } from '../../types';
import { SearchIcon } from '../common/Icons';

const ACADEMIC_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
const RECENTS_STORAGE_KEY = 'hcs_recent_searches';

const RecordPayment: React.FC = () => {
  const [searchParams, setSearchParams] = useState({ term: '', class: 'All', section: 'All' });
  const [searchResults, setSearchResults] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [feeDetails, setFeeDetails] = useState<ClassFee | null>(null);
  const [paidMonths, setPaidMonths] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);

  useEffect(() => {
    const recentIdsJSON = localStorage.getItem(RECENTS_STORAGE_KEY);
    if (recentIdsJSON) {
      const recentIds = JSON.parse(recentIdsJSON) as string[];
      const students = dbService.getStudents().filter(s => recentIds.includes(s.id));
      const orderedStudents = recentIds
        .map(id => students.find(s => s.id === id))
        .filter((s): s is Student => !!s);
      setRecentStudents(orderedStudents);
    }
  }, []);

  const addStudentToRecents = (student: Student) => {
    const updatedRecents = [student, ...recentStudents.filter(s => s.id !== student.id)].slice(0, 5);
    setRecentStudents(updatedRecents);
    localStorage.setItem(RECENTS_STORAGE_KEY, JSON.stringify(updatedRecents.map(s => s.id)));
  };

  const handleSelectStudent = (studentToSelect: Student) => {
    setMessage(null);
    setSelectedStudent(studentToSelect);
    
    const studentFeeDetails = dbService.getFeeStructures().find(f => f.classLevel === studentToSelect.class);
    setFeeDetails(studentFeeDetails || null);
    
    const payments = dbService.getPaymentsByStudentId(studentToSelect.id);
    const currentlyPaidMonths = new Set(payments.map(p => p.month));
    setPaidMonths(currentlyPaidMonths);

    addStudentToRecents(studentToSelect);
    setSearchResults([]); 
    setSearchParams({ term: '', class: 'All', section: 'All' });
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setSelectedStudent(null);
    setFeeDetails(null);
    setPaidMonths(new Set());

    const allStudents = dbService.getStudents();
    const results = allStudents.filter(s => {
      const termLower = searchParams.term.toLowerCase();
      const matchesTerm = searchParams.term === '' || 
                          s.name.toLowerCase().includes(termLower) || 
                          s.id.toLowerCase().includes(termLower);
      const matchesClass = searchParams.class === 'All' || s.class === parseInt(searchParams.class, 10);
      const matchesSection = searchParams.section === 'All' || s.section === searchParams.section;
      return matchesTerm && matchesClass && matchesSection;
    });

    if (results.length === 1) {
      handleSelectStudent(results[0]);
    } else if (results.length > 0) {
      setSearchResults(results);
    } else {
      setSearchResults([]);
      setMessage({ type: 'error', text: 'No students found matching your criteria.' });
    }
  };

  const handleMonthChange = (month: string, isChecked: boolean) => {
    setPaidMonths(prev => {
      const newPaidMonths = new Set(prev);
      if (isChecked) {
        newPaidMonths.add(month);
      } else {
        newPaidMonths.delete(month);
      }
      return newPaidMonths;
    });
  };

  const handleSaveChanges = () => {
    if (!selectedStudent) return;
    setIsLoading(true);
    setMessage(null);
    try {
      dbService.updateMonthlyPayments(selectedStudent.id, paidMonths);
      setMessage({ type: 'success', text: `Payment records for ${selectedStudent.name} updated successfully.` });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save changes.' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const paymentSummary = useMemo(() => {
    if (!feeDetails) return { totalPaid: 0, pending: 0, annualTotal: 0 };
    const monthlyFee = feeDetails.monthlyFee;
    const totalPaid = paidMonths.size * monthlyFee;
    const annualTotal = monthlyFee * 12;
    const pending = annualTotal - totalPaid;
    return { totalPaid, pending, annualTotal };
  }, [paidMonths, feeDetails]);

  const handleParamChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800">Record Payment</h2>
      <p className="text-slate-500 mb-6">Search student and update fee payment status</p>
      
      <GlassCard className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">Search Student</h3>
        <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-600 mb-1">Name or ID</label>
              <input type="text" name="term" value={searchParams.term} onChange={handleParamChange} placeholder="e.g., Rahul Sharma or HCS1234" className="w-full p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Class</label>
              <select name="class" value={searchParams.class} onChange={handleParamChange} className="w-full p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="All">All Classes</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
          </div>
          <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Section</label>
              <select name="section" value={searchParams.section} onChange={handleParamChange} className="w-full p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="All">All Sections</option>
                  {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
          </div>
          <button type="submit" className="md:col-start-4 py-3 px-8 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-md transition-all flex items-center justify-center gap-2">
            <SearchIcon className="w-5 h-5" /> Search
          </button>
        </form>
      </GlassCard>

      {message && (
        <div className={`p-3 rounded-lg text-sm my-6 ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}

      {searchResults.length > 0 && (
          <GlassCard className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">Search Results</h3>
              <ul className="space-y-2">
                  {searchResults.map(s => (
                      <li key={s.id}>
                          <button onClick={() => handleSelectStudent(s)} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 transition-colors flex justify-between items-center">
                              <div>
                                  <p className="font-semibold text-slate-800">{s.name}</p>
                                  <p className="text-xs text-slate-500">{s.id}</p>
                              </div>
                              <p className="text-sm text-slate-600">Class {s.class}-{s.section}</p>
                          </button>
                      </li>
                  ))}
              </ul>
          </GlassCard>
      )}

      {!selectedStudent && searchResults.length === 0 && recentStudents.length > 0 && (
          <GlassCard className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-slate-700">Recent Searches</h3>
              <ul className="space-y-2">
                  {recentStudents.map(s => (
                      <li key={s.id}>
                          <button onClick={() => handleSelectStudent(s)} className="w-full text-left p-3 rounded-lg hover:bg-indigo-50 transition-colors flex justify-between items-center">
                              <div>
                                  <p className="font-semibold text-slate-800">{s.name}</p>
                                  <p className="text-xs text-slate-500">{s.id}</p>
                              </div>
                              <p className="text-sm text-slate-600">Class {s.class}-{s.section}</p>
                          </button>
                      </li>
                  ))}
              </ul>
          </GlassCard>
      )}

      {selectedStudent && feeDetails && (
        <>
          <GlassCard className="mb-8 p-6">
             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xl font-bold">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedStudent.name}</h3>
                    <p className="text-slate-500">
                        ID: {selectedStudent.id} | Class: {selectedStudent.class}
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="bg-emerald-50 p-4 rounded-lg">
                <p className="text-sm text-emerald-600">Total Paid</p>
                <p className="text-2xl font-bold text-emerald-800">₹{paymentSummary.totalPaid.toLocaleString()}</p>
                <p className="text-xs text-slate-500">{paidMonths.size} months</p>
              </div>
              <div className="bg-rose-50 p-4 rounded-lg">
                <p className="text-sm text-rose-600">Pending</p>
                <p className="text-2xl font-bold text-rose-800">₹{paymentSummary.pending.toLocaleString()}</p>
                <p className="text-xs text-slate-500">{12 - paidMonths.size} months</p>
              </div>
              <div className="bg-sky-50 p-4 rounded-lg">
                <p className="text-sm text-sky-600">Annual Total</p>
                <p className="text-2xl font-bold text-sky-800">₹{paymentSummary.annualTotal.toLocaleString()}</p>
                <p className="text-xs text-slate-500">12 months</p>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <h3 className="text-xl font-semibold mb-4 text-slate-700">Monthly Fee Payment Status by Month</h3>
            <p className="text-sm text-slate-500 mb-6">Check the box to mark the month as paid. Uncheck to mark as unpaid.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {ACADEMIC_MONTHS.map(month => (
                <label key={month} className="flex items-center p-3 bg-white/50 rounded-lg border border-slate-300/50 cursor-pointer hover:bg-indigo-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={paidMonths.has(month)}
                    onChange={(e) => handleMonthChange(month, e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-slate-700 font-medium">{month}</span>
                </label>
              ))}
            </div>
            <div className="mt-8 text-right">
              <button
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="py-3 px-8 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all disabled:bg-indigo-300 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
};

export default RecordPayment;
