import React, { useContext, useState, useEffect } from 'react';
import GlassCard from '../common/GlassCard';
import { AuthContext } from '../../contexts/AuthContext';
import { dbService } from '../../services/dbService';
import { Student, Payment, ClassFee } from '../../types';

// Custom hook to listen for database changes from other tabs/windows
const useDbListener = () => {
    const [version, setVersion] = useState(0);

    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'hcs_payments' || event.key === 'hcs_students' || event.key === 'hcs_fees') {
                setVersion(v => v + 1); // Increment version to trigger re-fetch
            }
        };

        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return version;
};


const StudentDashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const [student, setStudent] = useState<Student | null>(null);
  const [totalPaid, setTotalPaid] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [feeDetails, setFeeDetails] = useState<ClassFee | null>(null);
  const dbVersion = useDbListener(); // Use the hook to listen for changes

  useEffect(() => {
    if (auth?.user) {
      const currentStudent = dbService.getStudentById(auth.user.id);
      if (currentStudent) {
        setStudent(currentStudent);
        const payments = dbService.getPaymentsByStudentId(auth.user.id);
        const paidSum = payments.reduce((sum, p) => sum + p.amount, 0);
        setTotalPaid(paidSum);

        const feeStructure = dbService.getFeeStructures().find(f => f.classLevel === currentStudent.class);
        if (feeStructure) {
            setFeeDetails(feeStructure);
            const otherFeesTotal = feeStructure.otherFees.reduce((sum, fee) => sum + fee.amount, 0);
            const yearlyTotal = (feeStructure.monthlyFee * 12) + otherFeesTotal;
            setTotalDue(yearlyTotal - paidSum);
        }
      }
    }
  }, [auth?.user, dbVersion]); // Re-fetch data when user changes OR dbVersion changes

  if (!student) {
    return <p>Loading student data...</p>;
  }
  
  const StatCard = ({ title, value, color }: { title: string, value: string | number, color: string }) => (
    <GlassCard>
      <p className="text-sm text-slate-500">{title}</p>
      <p className={`text-3xl font-bold text-${color}-500 mt-2`}>{value}</p>
    </GlassCard>
  );

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-slate-800">Fee Dashboard</h2>
      
      <GlassCard className="mb-8">
        <h3 className="text-xl font-semibold mb-4 text-slate-700">Student Information</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-slate-600">
          <div><span className="font-bold text-slate-800">Name:</span> {student.name}</div>
          <div><span className="font-bold text-slate-800">Student ID:</span> {student.id}</div>
          <div><span className="font-bold text-slate-800">Class:</span> {student.class}</div>
          <div><span className="font-bold text-slate-800">Guardian:</span> {student.guardianName}</div>
        </div>
      </GlassCard>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Paid" value={`₹${totalPaid.toLocaleString()}`} color="emerald" />
        <StatCard title="Total Outstanding" value={`₹${totalDue > 0 ? totalDue.toLocaleString() : 0}`} color="rose" />
        <StatCard title="Monthly Fee" value={`₹${feeDetails?.monthlyFee.toLocaleString() || 'N/A'}`} color="cyan" />
      </div>

      <GlassCard>
        <h3 className="text-xl font-semibold mb-4 text-slate-700">Recent Payment History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/10 text-slate-500">
                <th className="p-3">Date</th>
                <th className="p-3">Month Paid For</th>
                <th className="p-3">Amount</th>
              </tr>
            </thead>
            <tbody>
              {dbService.getPaymentsByStudentId(student.id).slice(-5).reverse().map(p => (
                <tr key={p.id} className="border-b border-black/5 hover:bg-black/5">
                  <td className="p-3">{new Date(p.date).toLocaleDateString()}</td>
                  <td className="p-3">{p.month}, {p.year}</td>
                  <td className="p-3">₹{p.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default StudentDashboard;