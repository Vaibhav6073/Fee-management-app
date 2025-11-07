import React, { useContext, useState, useEffect } from 'react';
import GlassCard from '../common/GlassCard';
import { AuthContext } from '../../contexts/AuthContext';
import { dbService } from '../../services/dbService';
import { Student, Payment, ClassFee } from '../../types';
import { MONTHS } from '../../constants';

interface MonthlyStatus {
  month: string;
  fee: number;
  paidAmount: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid';
}

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


const FeeDetails: React.FC = () => {
  const auth = useContext(AuthContext);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyStatus[]>([]);
  const dbVersion = useDbListener(); // Use the hook to listen for changes

  useEffect(() => {
    if (auth?.user) {
      const student = dbService.getStudentById(auth.user.id);
      if (!student) return;

      const payments = dbService.getPaymentsByStudentId(auth.user.id);
      const feeStructure = dbService.getFeeStructures().find(f => f.classLevel === student.class);

      if (feeStructure) {
        const breakdown = MONTHS.map(month => {
          const monthlyFee = feeStructure.monthlyFee;
          // Note: This logic assumes payments for a given month are for the current academic year.
          // A more complex system might need to check the payment's year property.
          const paymentsForMonth = payments.filter(p => p.month === month);
          const paidAmount = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
          
          let status: 'Paid' | 'Partially Paid' | 'Unpaid' = 'Unpaid';
          if (monthlyFee > 0 && paidAmount >= monthlyFee) {
            status = 'Paid';
          } else if (paidAmount > 0) {
            status = 'Partially Paid';
          }

          return { month, fee: monthlyFee, paidAmount, status };
        });
        setMonthlyBreakdown(breakdown);
      }
    }
  }, [auth?.user, dbVersion]); // Re-fetch data when user changes OR dbVersion changes

  const getStatusChip = (status: MonthlyStatus['status']) => {
    switch (status) {
      case 'Paid':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">Paid</span>;
      case 'Partially Paid':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Partial</span>;
      case 'Unpaid':
        return <span className="px-3 py-1 text-xs font-medium rounded-full bg-rose-100 text-rose-700">Unpaid</span>;
    }
  };

  const getMonthStatusColor = (status: MonthlyStatus['status']) => {
    switch (status) {
      case 'Paid':
        return 'text-emerald-700';
      case 'Partially Paid':
        return 'text-amber-700';
      case 'Unpaid':
        return 'text-rose-700';
      default:
        return 'text-slate-800';
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-slate-800">Monthly Fee Details ({new Date().getFullYear()})</h2>
      <GlassCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/5">
              <tr className="border-b border-black/10 text-slate-600">
                <th className="p-4 font-semibold">Month</th>
                <th className="p-4 font-semibold">Monthly Fee</th>
                <th className="p-4 font-semibold">Amount Paid</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {monthlyBreakdown.map(item => (
                <tr key={item.month} className="border-b border-black/5 hover:bg-black/5 transition-colors">
                  <td className={`p-4 font-bold ${getMonthStatusColor(item.status)}`}>{item.month}</td>
                  <td className="p-4">₹{item.fee.toLocaleString()}</td>
                  <td className="p-4">₹{item.paidAmount.toLocaleString()}</td>
                  <td className="p-4">{getStatusChip(item.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

export default FeeDetails;