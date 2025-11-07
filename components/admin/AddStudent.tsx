import React, { useState, useMemo, useEffect } from 'react';
import { dbService } from '../../services/dbService';
import { Student } from '../../types';
import { BrowseClassIcon, DirectoryIcon, EditIcon, TrashIcon, PlusIcon } from '../common/Icons';
import { MONTHS } from '../../constants';
import GlassCard from '../common/GlassCard';

const ACADEMIC_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200/80 ${className}`}>
    {children}
  </div>
);

const romanNumeralMap = [
    { value: 1, symbol: 'I', color: 'text-blue-500' },
    { value: 2, symbol: 'II', color: 'text-green-500' },
    { value: 3, symbol: 'III', color: 'text-purple-500' },
    { value: 4, symbol: 'IV', color: 'text-red-500' },
    { value: 5, symbol: 'V', color: 'text-yellow-600' },
    { value: 6, symbol: 'VI', color: 'text-indigo-500' },
    { value: 7, symbol: 'VII', color: 'text-pink-500' },
    { value: 8, symbol: 'VIII', color: 'text-teal-500' },
    { value: 9, symbol: 'IX', color: 'text-orange-500' },
    { value: 10, symbol: 'X', color: 'text-green-600' },
    { value: 11, symbol: 'XI', color: 'text-cyan-500' },
    { value: 12, symbol: 'XII', color: 'text-purple-600' },
];

const emptyStudent: Omit<Student, 'id' | 'password'> = {
  name: '', class: 1, section: 'A', guardianName: '', contact: ''
};

const StudentFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (student: Student) => void;
    initialData?: Student | null;
}> = ({ isOpen, onClose, onSave, initialData }) => {
    const isEditMode = !!initialData;
    const [student, setStudent] = useState<Omit<Student, 'id' | 'password'>>(emptyStudent);
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (isOpen) {
            setMessage(null);
            setNewPassword(''); // Always reset password field
            if (isEditMode && initialData) {
                const { password, ...restOfStudentData } = initialData;
                setStudent(restOfStudentData);
            } else {
                setStudent(emptyStudent);
            }
        }
    }, [isOpen, initialData, isEditMode]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStudent(prev => ({ ...prev, [name]: name === 'class' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        try {
            let savedStudent: Student;
            if (isEditMode) {
                 const studentToUpdate: Student = {
                    ...initialData!, // Use initialData to ensure ID and other fields are preserved
                    ...student,
                    password: newPassword || initialData?.password,
                };
                 if (!studentToUpdate.password) throw new Error("Password is missing.");
                 dbService.updateStudent(studentToUpdate);
                 savedStudent = studentToUpdate;
            } else { // Add new student
                if (!newPassword) throw new Error("Password is required for new students.");
                const studentToAdd: Omit<Student, 'id'> = {
                    ...student,
                    password: newPassword,
                };
                savedStudent = dbService.addStudent(studentToAdd);
            }

            onSave(savedStudent);
            setMessage({ type: 'success', text: `Student data saved successfully for ${savedStudent.name}.` });
            setTimeout(onClose, 1500);
        } catch (error) {
            setMessage({ type: 'error', text: error instanceof Error ? error.message : 'An unknown error occurred.' });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold text-slate-800 mb-6">{isEditMode ? 'Edit Student' : 'Add New Student'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input name="name" value={student.name} onChange={handleChange} placeholder="Full Name" required className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input name="guardianName" value={student.guardianName} onChange={handleChange} placeholder="Guardian's Name" required className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <select name="class" value={student.class} onChange={handleChange} required className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Class {c}</option>)}
                        </select>
                         <select name="section" value={student.section} onChange={handleChange} required className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                        <input name="contact" value={student.contact} onChange={handleChange} placeholder="Contact Number" required className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input name="password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={isEditMode ? "New Password (leave blank to keep current)" : "Set Password"} required={!isEditMode} className="w-full p-3 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-6 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-semibold transition-all">Cancel</button>
                        <button type="submit" className="py-2 px-6 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-md transition-all">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const StudentPaymentStatusModal: React.FC<{
  student: Student | null;
  onClose: () => void;
}> = ({ student, onClose }) => {
  const [monthlyStatus, setMonthlyStatus] = useState<{ month: string, isPaid: boolean }[]>([]);

  useEffect(() => {
    if (student) {
        const payments = dbService.getPaymentsByStudentId(student.id);
        const feeStructure = dbService.getFeeStructures().find(f => f.classLevel === student.class);

        if (feeStructure) {
            const breakdown = ACADEMIC_MONTHS.map(month => {
                const monthlyFee = feeStructure.monthlyFee;
                if (monthlyFee <= 0) return { month, isPaid: true }; // Assume paid if no fee

                const paymentsForMonth = payments.filter(p => p.month === month); 
                const paidAmount = paymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
                const isPaid = paidAmount >= monthlyFee;
                return { month, isPaid };
            });
            setMonthlyStatus(breakdown);
        }
    }
  }, [student]);

  if (!student) return null;

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <GlassCard>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{student.name}</h3>
            <p className="text-slate-500 mb-6">ID: {student.id}</p>
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


const StudentManagement: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [classFilter, setClassFilter] = useState<number | 'All'>('All');
    const [sectionFilter, setSectionFilter] = useState('All');
    const [idSearch, setIdSearch] = useState('');
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

    useEffect(() => {
        setStudents(dbService.getStudents());
    }, []);
    
    const handleSaveStudent = (savedStudent: Student) => {
        setStudents(dbService.getStudents()); // Re-fetch all students to reflect changes
        handleCloseModal();
    };

    const handleCloseModal = () => {
        setEditingStudent(null);
        setAddModalOpen(false);
    };

    const handleDelete = (studentToDelete: Student) => {
        if(window.confirm(`Are you sure you want to delete ${studentToDelete.name}? This action cannot be undone.`)){
            dbService.deleteStudent(studentToDelete.id);
            setStudents(prev => prev.filter(s => s.id !== studentToDelete.id));
        }
    };
    
    const handleEdit = (studentToEdit: Student) => {
        setEditingStudent(studentToEdit);
        setAddModalOpen(true);
    };

    const classCounts = useMemo(() => {
        const counts = new Map<number, number>();
        students.forEach(student => {
            counts.set(student.class, (counts.get(student.class) || 0) + 1);
        });
        return counts;
    }, [students]);

    const feeStatusByStudentId = useMemo(() => {
        const currentMonthName = MONTHS[new Date().getMonth()];
        const payments = dbService.getPayments();
        const fees = dbService.getFeeStructures();
        const statusMap = new Map<string, boolean>();

        students.forEach(student => {
            const classFee = fees.find(f => f.classLevel === student.class);
            if (!classFee || classFee.monthlyFee <= 0) {
                statusMap.set(student.id, true);
                return;
            }

            const monthlyFee = classFee.monthlyFee;
            const paymentsForCurrentMonth = payments.filter(p =>
                p.studentId === student.id && p.month === currentMonthName
            );
            const totalPaidForMonth = paymentsForCurrentMonth.reduce((sum, p) => sum + p.amount, 0);
            statusMap.set(student.id, totalPaidForMonth >= monthlyFee);
        });
        return statusMap;
    }, [students]);

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesClass = classFilter === 'All' || student.class === classFilter;
            const matchesSection = sectionFilter === 'All' || student.section === sectionFilter;
            const matchesId = idSearch === '' || student.id.toLowerCase().includes(idSearch.toLowerCase());
            return matchesClass && matchesSection && matchesId;
        });
    }, [students, classFilter, sectionFilter, idSearch]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Student Management</h1>
                <button 
                    onClick={() => setAddModalOpen(true)}
                    className="flex items-center gap-2 py-2 px-4 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-md transition-all">
                    <PlusIcon />
                    Add New Student
                </button>
            </div>
            
            <Card className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600"><BrowseClassIcon /></div>
                        <h2 className="text-xl font-bold text-slate-700">Browse by Class</h2>
                    </div>
                    <button onClick={() => setClassFilter('All')} className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-sm rounded-lg text-slate-700 font-semibold transition-all">
                        Show All Classes
                    </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {romanNumeralMap.map(({ value, symbol, color }) => (
                        <button key={value} onClick={() => setClassFilter(value)} className={`bg-slate-50 border border-slate-200/80 rounded-lg p-4 text-center transition-all focus:outline-none ${classFilter === value ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:shadow-md hover:-translate-y-1'}`}>
                            <p className={`text-3xl font-bold ${color}`}>{symbol}</p>
                            <p className="text-sm font-semibold text-slate-700 mt-2">{classCounts.get(value) || 0} Students</p>
                        </button>
                    ))}
                </div>
            </Card>

            <Card className="p-6">
                 <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="w-full md:w-auto">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Filter by Section</label>
                        <select 
                            value={sectionFilter} 
                            onChange={e => setSectionFilter(e.target.value)}
                            className="w-full p-2.5 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option value="All">All Sections</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                            <option value="D">Section D</option>
                        </select>
                    </div>
                     <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-slate-600 mb-1">Search by Student ID</label>
                        <input
                            type="text"
                            value={idSearch}
                            onChange={e => setIdSearch(e.target.value)}
                            placeholder="Enter student ID (e.g., HCS1234)"
                            className="w-full p-2.5 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="w-full md:w-auto self-end">
                         <button onClick={() => { setClassFilter('All'); setSectionFilter('All'); setIdSearch(''); }} className="w-full py-2.5 px-6 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-700 font-semibold transition-all">
                            Clear Filters
                        </button>
                    </div>
                 </div>
            </Card>

            <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><DirectoryIcon /></div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-700">Student Directory</h2>
                        <p className="text-sm text-slate-500">Complete list of all enrolled students</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                            <tr>
                                <th className="p-4 font-semibold">Student</th>
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Class</th>
                                <th className="p-4 font-semibold">Section</th>
                                <th className="p-4 font-semibold">Fee Status (Current Month)</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr key={student.id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="p-4 font-semibold text-slate-800">
                                        <button onClick={() => setViewingStudent(student)} className="text-indigo-600 hover:underline focus:outline-none">
                                            {student.name}
                                        </button>
                                    </td>
                                    <td className="p-4 text-slate-600">{student.id}</td>
                                    <td className="p-4 text-slate-600">{student.class}</td>
                                    <td className="p-4 text-slate-600">{student.section}</td>
                                    <td className="p-4">
                                        {feeStatusByStudentId.get(student.id) ? (
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                                                <span className="text-xs font-medium text-emerald-700">Paid</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                                                <span className="text-xs font-medium text-rose-700">Not Paid</span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-100 text-cyan-700">Active</span></td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(student)} className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md"><EditIcon /></button>
                                            <button onClick={() => handleDelete(student)} className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-slate-100 rounded-md"><TrashIcon /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredStudents.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-500">No students match your criteria.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            <StudentFormModal 
                isOpen={isAddModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveStudent}
                initialData={editingStudent}
            />
            
            <StudentPaymentStatusModal 
                student={viewingStudent}
                onClose={() => setViewingStudent(null)}
            />
        </div>
    );
};

export default StudentManagement;