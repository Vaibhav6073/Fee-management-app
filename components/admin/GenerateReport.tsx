import React, { useState, useMemo } from 'react';
import GlassCard from '../common/GlassCard';
import { dbService } from '../../services/dbService';
import { SCHOOL_NAME } from '../../constants';
import { Student } from '../../types';

type ReportType = 'collection_summary' | 'defaulter_list';

interface StudentRecord {
  student: Student;
  totalFee: number;
  paid: number;
  pending: number;
}

const GenerateReport: React.FC = () => {
    const [reportType, setReportType] = useState<ReportType>('collection_summary');
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        classLevel: 'All'
    });
    const [reportData, setReportData] = useState<any>(null);
    const [isGenerated, setIsGenerated] = useState(false);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleGenerateReport = () => {
        let data: any = null;
        if (reportType === 'collection_summary') {
            if (!filters.startDate || !filters.endDate) {
                alert("Please select a start and end date for the collection summary.");
                return;
            }
            const allPayments = dbService.getPayments();
            const startDate = new Date(filters.startDate);
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999); // Include the whole end day

            const paymentsInDateRange = allPayments.filter(p => {
                const paymentDate = new Date(p.date);
                return paymentDate >= startDate && paymentDate <= endDate;
            });
            const totalCollection = paymentsInDateRange.reduce((sum, p) => sum + p.amount, 0);
            data = { totalCollection, payments: paymentsInDateRange.length };

        } else if (reportType === 'defaulter_list') {
            const students = filters.classLevel === 'All'
                ? dbService.getStudents()
                : dbService.getStudents().filter(s => s.class === parseInt(filters.classLevel));

            const payments = dbService.getPayments();
            const fees = dbService.getFeeStructures();

            const studentRecords = students.map((student): StudentRecord => {
                const classFee = fees.find(f => f.classLevel === student.class);
                const totalFee = classFee ? (classFee.monthlyFee * 12) + classFee.otherFees.reduce((sum, fee) => sum + fee.amount, 0) : 0;
                const paid = payments.filter(p => p.studentId === student.id).reduce((sum, p) => sum + p.amount, 0);
                return { student, totalFee, paid, pending: totalFee - paid };
            });
            
            data = studentRecords.filter(r => r.pending > 0).sort((a,b) => b.pending - a.pending);
        }
        setReportData(data);
        setIsGenerated(true);
    };
    
    const handlePrint = () => {
        window.print();
    };
    
    const ReportDisplay = () => {
        if (!isGenerated) return null;
        if (!reportData) return <p className="text-center text-slate-500 mt-8">No data available for the selected criteria.</p>;

        const reportTitle = reportType === 'collection_summary' ? 'Fee Collection Summary' : `Defaulter List - ${filters.classLevel === 'All' ? 'All Classes' : `Class ${filters.classLevel}`}`;
        const dateRange = (filters.startDate && filters.endDate) ? `${new Date(filters.startDate).toLocaleDateString()} to ${new Date(filters.endDate).toLocaleDateString()}` : `Generated on ${new Date().toLocaleDateString()}`;

        return (
            <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-bold text-slate-800">Generated Report</h3>
                    <button onClick={handlePrint} className="no-print py-2 px-6 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-md transition-all">
                        Print Report
                    </button>
                </div>
                <GlassCard>
                    <div className="printable-area p-4">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-bold text-slate-800">{SCHOOL_NAME}</h1>
                            <h2 className="text-xl font-semibold text-slate-600">{reportTitle}</h2>
                            <p className="text-sm text-slate-500">{dateRange}</p>
                        </div>

                        {reportType === 'collection_summary' && (
                           <div className="text-center">
                                <p className="text-lg text-slate-600">Total Payments Received:</p>
                                <p className="text-4xl font-bold text-emerald-600 my-2">₹{reportData.totalCollection.toLocaleString()}</p>
                                <p className="text-md text-slate-500">from {reportData.payments} transactions</p>
                           </div>
                        )}
                        
                        {reportType === 'defaulter_list' && (
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50">
                                    <tr className="border-b border-slate-200">
                                        <th className="p-3 font-semibold text-slate-600">ID</th>
                                        <th className="p-3 font-semibold text-slate-600">Name</th>
                                        <th className="p-3 font-semibold text-slate-600">Class</th>
                                        <th className="p-3 font-semibold text-slate-600">Total Fee</th>
                                        <th className="p-3 font-semibold text-slate-600">Amount Paid</th>
                                        <th className="p-3 font-semibold text-slate-600">Pending Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.map((record: StudentRecord) => (
                                        <tr key={record.student.id} className="border-b border-slate-100">
                                            <td className="p-3">{record.student.id}</td>
                                            <td className="p-3 font-medium text-slate-800">{record.student.name}</td>
                                            <td className="p-3">{record.student.class}-{record.student.section}</td>
                                            <td className="p-3">₹{record.totalFee.toLocaleString()}</td>
                                            <td className="p-3 text-emerald-600">₹{record.paid.toLocaleString()}</td>
                                            <td className="p-3 font-bold text-rose-600">₹{record.pending.toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </GlassCard>
            </div>
        );
    };

    return (
        <div className="no-print">
            <h2 className="text-3xl font-bold text-slate-800">Generate Reports</h2>
            <p className="text-slate-500 mb-6">Select report type and filters to generate a report.</p>

            <GlassCard>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Report Type</label>
                        <select name="reportType" value={reportType} onChange={e => setReportType(e.target.value as ReportType)} className="w-full p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="collection_summary">Fee Collection Summary</option>
                            <option value="defaulter_list">Class Defaulter List</option>
                        </select>
                    </div>

                    {reportType === 'collection_summary' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Start Date</label>
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full p-2.5 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">End Date</label>
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full p-2.5 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                        </>
                    ) : (
                         <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Class</label>
                            <select name="classLevel" value={filters.classLevel} onChange={handleFilterChange} className="w-full p-3 bg-white/50 rounded-lg border border-slate-300/50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="All">All Classes</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Class {c}</option>)}
                            </select>
                        </div>
                    )}
                    
                    <div className="lg:col-start-4">
                        <button onClick={handleGenerateReport} className="w-full py-3 px-6 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold shadow-md transition-all">
                            Generate Report
                        </button>
                    </div>
                </div>
            </GlassCard>

            <ReportDisplay />
        </div>
    );
};

export default GenerateReport;