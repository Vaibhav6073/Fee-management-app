import React, { useState, useEffect, useMemo } from 'react';
import GlassCard from '../common/GlassCard';
import { TotalStudentsIcon, TotalCollectionIcon, PendingPaymentsIcon } from '../common/Icons';
import { dbService } from '../../services/dbService';

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalCollection: 0,
        pendingPayments: 0,
    });
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [paymentStatusData, setPaymentStatusData] = useState({ paid: 0, partial: 0, unpaid: 0 });
    const [classWiseChartData, setClassWiseChartData] = useState<any[]>([]);

    useEffect(() => {
        const students = dbService.getStudents();
        const payments = dbService.getPayments();
        const fees = dbService.getFeeStructures();

        let totalPotentialFees = 0;
        let paidCount = 0;
        let partialCount = 0;
        let unpaidCount = 0;
        
        const classData: Record<number, { paid: number; pending: number; total: number }> = {};
        for (let i = 1; i <= 12; i++) {
            classData[i] = { paid: 0, pending: 0, total: 0 };
        }

        students.forEach(student => {
            const classFee = fees.find(f => f.classLevel === student.class);
            const studentTotalFee = classFee ? (classFee.monthlyFee * 12) + classFee.otherFees.reduce((sum, fee) => sum + fee.amount, 0) : 0;
            totalPotentialFees += studentTotalFee;
            
            const studentPaid = payments.filter(p => p.studentId === student.id).reduce((sum, p) => sum + p.amount, 0);

            if (student.class in classData) {
                classData[student.class].paid += studentPaid;
                classData[student.class].total += studentTotalFee;
            }

            if (studentTotalFee > 0) {
                if (studentPaid >= studentTotalFee) {
                    paidCount++;
                } else if (studentPaid > 0) {
                    partialCount++;
                } else {
                    unpaidCount++;
                }
            } else { 
                paidCount++;
            }
        });
        
        const formattedClassData = Object.entries(classData).map(([classLevel, data]) => ({
            name: `Class ${classLevel}`,
            paid: data.paid,
            pending: Math.max(0, data.total - data.paid),
        }));
        setClassWiseChartData(formattedClassData);
        
        setPaymentStatusData({ paid: paidCount, partial: partialCount, unpaid: unpaidCount });

        const totalCollection = payments.reduce((sum, p) => sum + p.amount, 0);

        setStats({
            totalStudents: students.length,
            totalCollection,
            pendingPayments: totalPotentialFees - totalCollection,
        });

        const recent = payments
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(p => {
                const student = dbService.getStudentById(p.studentId);
                return {
                    name: student?.name || 'Unknown',
                    id: p.studentId,
                    amount: p.amount,
                    time: new Date(p.date).toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
                };
            });
        setRecentPayments(recent);

        const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const statCardsData = [
        { title: "Total Students", value: stats.totalStudents.toLocaleString(), icon: <TotalStudentsIcon />, color: "from-cyan-400 to-blue-500", iconBg: "bg-blue-100", iconText: "text-blue-500", change: { value: "+2", isPositive: true } },
        { title: "Total Collection", value: `₹${(stats.totalCollection / 100000).toFixed(2)}L`, icon: <TotalCollectionIcon />, color: "from-emerald-400 to-green-500", iconBg: "bg-green-100", iconText: "text-green-500", change: { value: "+5.2%", isPositive: true } },
        { title: "Total Pending", value: `₹${(stats.pendingPayments / 1000).toFixed(1)}K`, icon: <PendingPaymentsIcon />, color: "from-amber-400 to-orange-500", iconBg: "bg-orange-100", iconText: "text-orange-500", change: { value: "-1.8%", isPositive: false } },
    ];

    const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; color: string; iconBg: string; iconText: string; change: { value: string, isPositive: boolean } }> = ({ icon, title, value, color, iconBg, iconText, change }) => (
        <GlassCard className="relative overflow-hidden p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className={`absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br ${color} rounded-full opacity-20 blur-xl`}></div>
            <div className="relative z-10 flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-600">{title}</p>
                    <p className="text-4xl font-bold text-slate-800 mt-1">{value}</p>
                     <p className="text-xs text-slate-500 mt-2 flex items-center">
                        <span className={`font-semibold mr-1 ${change.isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {change.isPositive ? '▲' : '▼'} {change.value}
                        </span>
                        vs last month
                    </p>
                </div>
                <div className={`p-3 rounded-full ${iconBg} ${iconText}`}>
                    {icon}
                </div>
            </div>
        </GlassCard>
    );

    const RealtimeClock = () => (
        <div className="text-right">
            <p className="text-3xl font-bold text-slate-700 tracking-wider">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>
            <p className="text-sm text-slate-500">{currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
    );
    
    const CardTitle: React.FC<{children:React.ReactNode, className?: string}> = ({ children, className }) => (
        <h3 className={`text-xl font-semibold text-slate-700 px-4 pt-4 ${className}`}>{children}</h3>
    );
    
    const DoughnutChart = ({ data }: { data: { paid: number, partial: number, unpaid: number } }) => {
        const { paid, partial, unpaid } = data;
        const total = paid + partial + unpaid;
        if (total === 0) return <div className="flex items-center justify-center h-full"><p className="text-slate-500">No student data to display.</p></div>;

        const paidPercent = (paid / total) * 100;
        const partialPercent = (partial / total) * 100;

        const gradient = `conic-gradient(from 0deg, #10B981 0% ${paidPercent}%, #3B82F6 ${paidPercent}% ${paidPercent + partialPercent}%, #F43F5E ${paidPercent + partialPercent}% 100%)`;

        const legendItems = [
            { label: 'Fully Paid', value: paid, color: 'bg-emerald-500' },
            { label: 'Partial Payment', value: partial, color: 'bg-blue-500' },
            { label: 'Unpaid', value: unpaid, color: 'bg-rose-500' },
        ];

        return (
            <div className="flex flex-col md:flex-row items-center gap-8 p-4">
                <div className="relative w-40 h-40">
                    <div className="w-full h-full rounded-full" style={{ background: gradient }}></div>
                    <div className="absolute inset-4 bg-white/60 rounded-full flex items-center justify-center flex-col">
                        <span className="text-3xl font-bold text-slate-800">{total}</span>
                        <span className="text-xs text-slate-500">Students</span>
                    </div>
                </div>
                <div className="flex-1 space-y-3 w-full">
                    {legendItems.map(item => (
                        <div key={item.label} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${item.color}`}></span>
                                <span className="text-slate-600">{item.label}</span>
                            </div>
                            <div className="text-right">
                                <span className="font-semibold text-slate-800">{item.value}</span>
                                <span className="text-xs text-slate-500 ml-2">({(item.value / total * 100).toFixed(1)}%)</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const formatCurrency = (value: number) => {
        if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
        return `₹${value}`;
    };

    const ClassWiseBarChart = ({ data }: { data: { name: string; paid: number; pending: number; }[] }) => {
        const maxValue = useMemo(() => {
            if (!data || data.length === 0) return 100000;
            const maxVal = Math.max(...data.map(d => d.paid + d.pending));
            const power = Math.pow(10, Math.floor(Math.log10(maxVal || 1)));
            return Math.ceil((maxVal || 1) / power) * power;
        }, [data]);

        const yAxisTicks = 5;

        if (!data || data.length === 0) {
            return <div className="h-64 flex items-center justify-center text-slate-500">No class data for chart.</div>;
        }

        return (
            <div className="h-80 flex gap-4 p-4">
                <div className="flex flex-col justify-between text-xs text-slate-500 text-right h-[calc(100%-1.5rem)]">
                    {Array.from({ length: yAxisTicks + 1 }).map((_, i) => (
                        <span key={i}>{formatCurrency(maxValue - (maxValue / yAxisTicks) * i)}</span>
                    ))}
                </div>
                <div className="flex-1 flex flex-col">
                    <div className="flex-1 grid grid-cols-12 gap-1.5 relative border-l border-slate-200/80">
                        <div className="absolute inset-0 grid grid-rows-5 -z-10">
                            {Array.from({ length: yAxisTicks }).map((_, i) => (
                                <div key={i} className={`border-t border-slate-200/80 ${i === yAxisTicks - 1 ? 'border-b' : ''}`}></div>
                            ))}
                        </div>
                        {data.map((item, index) => (
                           <div key={index} className="relative group flex items-end justify-center h-full">
                                <div className="w-full h-full flex flex-col items-center justify-end">
                                    <div 
                                        className="w-1/2 bg-rose-500 rounded-t-md" 
                                        style={{ height: `${(item.pending / maxValue) * 100}%` }}
                                    ></div>
                                    <div 
                                        className="w-1/2 bg-emerald-500" 
                                        style={{ height: `${(item.paid / maxValue) * 100}%` }}
                                    ></div>
                                </div>
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-slate-900 text-white text-xs px-3 py-1.5 rounded-md shadow-lg z-20 pointer-events-none w-max">
                                    <strong className="font-bold">{item.name}</strong><br/>
                                    <span className="text-emerald-400">Paid: {formatCurrency(item.paid)}</span><br/>
                                    <span className="text-rose-400">Pending: {formatCurrency(item.pending)}</span>
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-12 gap-2 border-t border-slate-200/80 pt-1.5">
                        {data.map((item) => (
                            <p key={item.name} className="text-xs font-medium text-slate-600 text-center">{item.name.replace('Class ', '')}</p>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center animate-fade-in-up">
                <div>
                    <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">Dashboard</h2>
                    <p className="text-slate-500">Overview of the school's financial status.</p>
                </div>
                <RealtimeClock />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-100">
                {statCardsData.map(card => <StatCard key={card.title} {...card} />)}
            </div>
            
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 animate-fade-in-up animation-delay-300">
                <GlassCard className="xl:col-span-3 bg-gradient-to-br from-white/70 via-white/60 to-emerald-50/20">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 pb-0">
                        <CardTitle className="p-0">Class-wise Fee Summary</CardTitle>
                        <div className="flex items-center gap-4 text-xs mt-2 sm:mt-0">
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div><span>Total Paid</span></div>
                            <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-rose-500"></div><span>Total Pending</span></div>
                        </div>
                    </div>
                    <ClassWiseBarChart data={classWiseChartData} />
                </GlassCard>
                <div className="xl:col-span-2 space-y-8">
                    <GlassCard className="bg-gradient-to-br from-white/70 via-white/60 to-violet-50/20">
                        <CardTitle className="p-0 pb-0">Student Fee Status</CardTitle>
                        <DoughnutChart data={paymentStatusData} />
                    </GlassCard>
                    <GlassCard className="bg-gradient-to-br from-white/70 via-white/60 to-cyan-50/20">
                        <CardTitle>Recent Payments</CardTitle>
                         {recentPayments.length > 0 ? (
                            <div className="p-4">
                                <div className="flex justify-between items-center text-xs text-slate-500 font-semibold px-3 py-2 bg-slate-50/50 rounded-t-lg">
                                    <span>Student</span>
                                    <span>Amount</span>
                                </div>
                                <ul className="space-y-1">
                                    {recentPayments.map((payment, index) => (
                                        <li key={index} className="flex justify-between items-center px-3 py-2.5 rounded-lg hover:bg-black/5">
                                            <div>
                                                <p className="font-semibold text-sm text-slate-800">{payment.name}</p>
                                                <p className="text-xs text-slate-500">{payment.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-sm text-emerald-600">₹{payment.amount.toLocaleString()}</p>
                                                <p className="text-xs text-slate-500">{payment.time.split(',')[0]}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                         ) : (
                            <p className="text-slate-500 text-center p-8">No recent payments recorded.</p>
                         )}
                    </GlassCard>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;