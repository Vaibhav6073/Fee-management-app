import React, { useState, useMemo, useEffect } from 'react';
import GlassCard from '../common/GlassCard';
import { dbService } from '../../services/dbService';
import { Student } from '../../types';
import { ExportIcon, ViewDetailIcon, SearchIcon } from '../common/Icons';
import { SCHOOL_NAME } from '../../constants';


declare global {
  interface Window {
    jspdf: any;
  }
}

// Define a new type for the combined data
type StudentRecord = {
  student: Student;
  totalFee: number;
  paid: number;
  pending: number;
  status: 'Paid' | 'Partial' | 'Defaulter' | 'Unpaid';
  lastPaymentDate: string;
};

const ACADEMIC_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const generatePdf = (recordsToExport: StudentRecord[], title: string) => {
    if (typeof window.jspdf === 'undefined') {
        alert("PDF generation library (jsPDF) is not loaded. Please try refreshing the page.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    if (typeof doc.autoTable !== 'function') {
        alert("PDF table generation plugin (jsPDF-AutoTable) is not loaded. Please try refreshing the page.");
        return;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(SCHOOL_NAME, 14, 15);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() - 14, 22, { align: 'right' });


    const tableColumn = ["ID", "Name", "Class", "Total Fee", "Paid", "Pending", "Status", "Last Payment"];
    const tableRows: (string | number)[][] = [];

    recordsToExport.forEach(record => {
        const recordData = [
            record.student.id,
            record.student.name,
            `${record.student.class}-${record.student.section}`,
            `₹${record.totalFee.toLocaleString()}`,
            `₹${record.paid.toLocaleString()}`,
            `₹${record.pending > 0 ? record.pending.toLocaleString() : 0}`,
            record.status,
            record.lastPaymentDate,
        ];
        tableRows.push(recordData);
    });

    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 30,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [22, 78, 99] } // A dark cyan color
    });

    doc.save(`${title.replace(/\s+/g, '_')}.pdf`);
};


const ExportModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    allRecords: StudentRecord[];
    filteredRecords: StudentRecord[];
}> = ({ isOpen, onClose, allRecords, filteredRecords }) => {
    const [exportType, setExportType] = useState('filtered');
    const [selectedClass, setSelectedClass] = useState('1');
    const [studentSearch, setStudentSearch] = useState('');

    const studentSearchResults = useMemo(() => {
        if (!studentSearch) return [];
        const searchLower = studentSearch.toLowerCase();
        return allRecords.filter(r => 
            r.student.name.toLowerCase().includes(searchLower) || 
            r.student.id.toLowerCase().includes(searchLower)
        ).slice(0, 5);
    }, [studentSearch, allRecords]);
    
    const handleGenerate = () => {
        let recordsToExport: StudentRecord[] = [];
        let reportTitle = 'Student Payment Records';

        if (exportType === 'filtered') {
            recordsToExport = filteredRecords;
            reportTitle = 'Filtered Student Payment Records';
        } else if (exportType === 'class') {
            recordsToExport = allRecords.filter(r => r.student.class === parseInt(selectedClass, 10));
            reportTitle = `Payment Records for Class ${selectedClass}`;
        } else if (exportType === 'student') {
             // This case is handled by direct click now
             return;
        }

        if (recordsToExport.length === 0) {
            alert("No records to export for the selected criteria.");
            return;
        }

        generatePdf(recordsToExport, reportTitle);
        onClose();
    };
    
    const handleExportSingleStudent = (record: StudentRecord) => {
        const reportTitle = `Payment Record for ${record.student.name}`;
        generatePdf([record], reportTitle);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Export Records</h2>
                <div className="space-y-4">
                    <label className="flex items-center p-4 rounded-lg border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-300">
                        <input type="radio" name="exportType" value="filtered" checked={exportType === 'filtered'} onChange={e => setExportType(e.target.value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                        <span className="ml-3 text-slate-700">Export Current View ({filteredRecords.length} records)</span>
                    </label>
                    <label className="flex items-center p-4 rounded-lg border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-300">
                        <input type="radio" name="exportType" value="class" checked={exportType === 'class'} onChange={e => setExportType(e.target.value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                        <span className="ml-3 text-slate-700">Export by Class</span>
                    </label>
                    {exportType === 'class' && (
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-2 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                    )}
                     <label className="flex items-center p-4 rounded-lg border has-[:checked]:bg-indigo-50 has-[:checked]:border-indigo-300">
                        <input type="radio" name="exportType" value="student" checked={exportType === 'student'} onChange={e => setExportType(e.target.value)} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500" />
                        <span className="ml-3 text-slate-700">Export Single Student</span>
                    </label>
                    {exportType === 'student' && (
                        <div className="relative">
                            <input type="text" placeholder="Search by name or ID..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full p-2 pl-8 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            {studentSearchResults.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                    {studentSearchResults.map(record => (
                                        <li key={record.student.id} onClick={() => handleExportSingleStudent(record)} className="p-2 hover:bg-indigo-50 cursor-pointer">{record.student.name} ({record.student.id})</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-4 pt-6">
                    <button onClick={onClose} className="py-2 px-6 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-semibold transition-all">Cancel</button>
                    <button onClick={handleGenerate} disabled={exportType === 'student'} className="py-2 px-6 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-md transition-all disabled:bg-indigo-300 disabled:cursor-not-allowed">Generate & Download PDF</button>
                </div>
            </div>
        </div>
    );
};


// New Modal Component for Student Payment Details
const StudentPaymentDetailModal: React.FC<{
  record: StudentRecord;
  onClose: () => void;
}> = ({ record, onClose }) => {
  const [monthlyStatus, setMonthlyStatus] = useState<{ month: string, isPaid: boolean }[]>([]);

  useEffect(() => {
    const student = record.student;
    const payments = dbService.getPaymentsByStudentId(student.id);
    const feeStructure = dbService.getFeeStructures().find(f => f.classLevel === student.class);

    if (feeStructure) {
      const breakdown = ACADEMIC_MONTHS.map(month => {
        const monthlyFee = feeStructure.monthlyFee;
        const paymentsForMonth = payments.filter(p => p.month === month); 
        const paidAmount = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
        const isPaid = monthlyFee > 0 && paidAmount >= monthlyFee;
        return { month, isPaid };
      });
      setMonthlyStatus(breakdown);
    }
  }, [record]);

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <GlassCard>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{record.student.name}</h3>
            <p className="text-slate-500 mb-6">ID: {record.student.id}</p>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {monthlyStatus.map(({month, isPaid}) => (
                    <div key={month} className={`p-4 rounded-lg text-center font-semibold border ${isPaid 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                        : 'bg-rose-100 text-rose-800 border-rose-200'}`
                    }>
                        {month}
                    </div>
                ))}
            </div>
             <div className="flex justify-end mt-8">
                <button onClick={onClose} className="py-2 px-6 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-semibold transition-all">Close</button>
             </div>
        </GlassCard>
      </div>
    </div>
  );
};


const ViewRecords: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [records, setRecords] = useState<StudentRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<StudentRecord | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);


  useEffect(() => {
    // This effect runs once to fetch and process all data
    const students = dbService.getStudents();
    const payments = dbService.getPayments();
    const fees = dbService.getFeeStructures();

    const studentRecords = students.map((student): StudentRecord => {
      const classFee = fees.find(f => f.classLevel === student.class);
      const totalFee = classFee
        ? (classFee.monthlyFee * 12) + classFee.otherFees.reduce((sum, fee) => sum + fee.amount, 0)
        : 0;
      
      const studentPayments = payments.filter(p => p.studentId === student.id);
      const paid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      
      const pending = totalFee - paid;

      let status: StudentRecord['status'] = 'Unpaid';
      if (pending <= 0 && totalFee > 0) {
        status = 'Paid';
      } else if (paid > 0) {
        // Defaulter if more than 3 months of fee is pending
        const monthlyFee = classFee?.monthlyFee || 0;
        if (monthlyFee > 0 && pending >= monthlyFee * 3) {
            status = 'Defaulter';
        } else {
            status = 'Partial';
        }
      }
      
      const sortedPayments = studentPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastPaymentDate = sortedPayments.length > 0 ? new Date(sortedPayments[0].date).toLocaleDateString() : 'N/A';

      return { student, totalFee, paid, pending, status, lastPaymentDate };
    });

    setRecords(studentRecords);
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        record.student.name.toLowerCase().includes(searchTermLower) ||
        record.student.id.toLowerCase().includes(searchTermLower);
      
      const matchesStatus = 
        statusFilter === 'All' || record.status === statusFilter;
        
      return matchesSearch && matchesStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const getStatusChip = (status: StudentRecord['status']) => {
    const styles = {
      Paid: 'bg-emerald-100 text-emerald-700',
      Partial: 'bg-indigo-100 text-indigo-700',
      Defaulter: 'bg-amber-100 text-amber-700',
      Unpaid: 'bg-rose-100 text-rose-700'
    };
    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status] || 'bg-slate-100 text-slate-700'}`}>
        {status}
      </span>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold text-slate-800">View Records</h2>
      <p className="text-slate-500 mb-6">Browse all student payment records</p>
      
      {/* Filter bar */}
      <GlassCard className="mb-8">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-full md:flex-grow">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or ID..."
              className="w-full p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All">All Status</option>
            <option value="Paid">Paid</option>
            <option value="Partial">Partial</option>
            <option value="Defaulter">Defaulter</option>
            <option value="Unpaid">Unpaid</option>
          </select>
          <button onClick={() => setIsExportModalOpen(true)} className="w-full md:w-auto flex items-center justify-center gap-2 py-3 px-6 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-md transition-all">
            <ExportIcon />
            <span>Export</span>
          </button>
        </div>
      </GlassCard>

      {/* Records Table */}
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-slate-500 font-semibold">
                <th className="p-4">Student ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Class</th>
                <th className="p-4">Total Fee</th>
                <th className="p-4">Paid</th>
                <th className="p-4">Pending</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr key={record.student.id} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                  <td className="p-4 font-medium text-slate-700">{record.student.id}</td>
                  <td className="p-4 font-bold text-slate-800">{record.student.name}</td>
                  <td className="p-4 text-slate-600">{record.student.class}</td>
                  <td className="p-4 text-slate-600">₹{record.totalFee.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-emerald-600">₹{record.paid.toLocaleString()}</td>
                  <td className="p-4 font-semibold text-amber-600">₹{record.pending > 0 ? record.pending.toLocaleString() : 0}</td>
                  <td className="p-4">{getStatusChip(record.status)}</td>
                  <td className="p-4">
                    <button onClick={() => setSelectedRecord(record)} className="text-slate-500 hover:text-indigo-600">
                        <ViewDetailIcon />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No records match your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
       {selectedRecord && (
        <StudentPaymentDetailModal 
            record={selectedRecord}
            onClose={() => setSelectedRecord(null)}
        />
    )}
     <ExportModal 
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        allRecords={records}
        filteredRecords={filteredRecords}
     />
    </div>
  );
};

export default ViewRecords;