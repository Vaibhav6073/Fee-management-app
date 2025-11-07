import { Student, Payment, ClassFee } from '../types';
import { MONTHS } from '../constants';

const STUDENTS_KEY = 'hcs_students';
const PAYMENTS_KEY = 'hcs_payments';
const FEES_KEY = 'hcs_fees';

const getFromStorage = <T,>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : defaultValue;
};

const saveToStorage = <T,>(key: string, data: T) => {
  localStorage.setItem(key, JSON.stringify(data));
};

const initialize = () => {
    if (!localStorage.getItem(STUDENTS_KEY)) {
        const existingStudents: Student[] = [
            { id: 'HCS1234', name: 'Rahul Sharma', class: 10, section: 'A', password: '0000', guardianName: 'Ramesh Sharma', contact: '1234567890' },
            { id: 'HCS1235', name: 'Priya Patel', class: 9, section: 'B', password: '0000', guardianName: 'Sunil Patel', contact: '0987654321' },
            { id: 'HCS1236', name: 'Amit Kumar', class: 11, section: 'A', password: '0000', guardianName: 'Anil Kumar', contact: '1122334455' },
            { id: 'HCS2341', name: 'Sneha Gupta', class: 8, section: 'C', password: '0000', guardianName: 'Rajesh Gupta', contact: '2233445566' },
            { id: 'HCS2342', name: 'Rohan Das', class: 12, section: 'B', password: '0000', guardianName: 'Suresh Das', contact: '3344556677' },
            { id: 'HCS0003', name: 'Michael Johnson', class: 10, section: 'B', password: '0000', guardianName: 'Mary Johnson', contact: '1122334455' },
        ];

        const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Ananya', 'Diya', 'Saanvi', 'Aadhya', 'Myra', 'Aarohi', 'Siya', 'Pari', 'Riya', 'Ira'];
        const lastNames = ['Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Reddy', 'Mehta', 'Jain', 'Shah', 'Mishra', 'Yadav', 'Das', 'Roy', 'Khan', 'Ali'];

        const generatedStudents: Student[] = [];
        let studentIdCounter = 3001;
        const sections = ['A', 'B', 'C', 'D'];

        for (let classLevel = 1; classLevel <= 12; classLevel++) {
            for (const section of sections) {
                for (let i = 0; i < 5; i++) {
                    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                    const studentName = `${firstName} ${lastName}`;
                    const guardianName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastName}`;
                    const contact = `9${Math.floor(100000000 + Math.random() * 900000000)}`;

                    generatedStudents.push({
                        id: `HCS${studentIdCounter++}`,
                        name: studentName,
                        class: classLevel,
                        section: section,
                        password: '0000',
                        guardianName: guardianName,
                        contact: contact,
                    });
                }
            }
        }
        
        const allStudents = [...existingStudents, ...generatedStudents];
        saveToStorage(STUDENTS_KEY, allStudents);
    }
    if (!localStorage.getItem(FEES_KEY)) {
        const initialFees: ClassFee[] = [];
        for (let i = 1; i <= 12; i++) {
            let monthlyFee = 10000;
            let otherFeeTotal = 24000; // Total 144,000 for classes < 11
            if (i >= 11) {
                 monthlyFee = 12000;
                 otherFeeTotal = 36000; // Total 180,000 for classes >= 11
            }
            
            initialFees.push({
                classLevel: i,
                monthlyFee: monthlyFee,
                otherFees: [
                    { name: 'Admission Fee', amount: Math.floor(otherFeeTotal * 0.6) },
                    { name: 'Annual Fee', amount: Math.floor(otherFeeTotal * 0.4) }
                ]
            });
        }
        saveToStorage(FEES_KEY, initialFees);
    }
     if (!localStorage.getItem(PAYMENTS_KEY)) {
        const initialPayments: Payment[] = [
          // Payments that produce the screenshot values
          // Rahul Sharma (HCS1234) - Total 144k, Paid 120k
          { id: 'P001', studentId: 'HCS1234', amount: 120000, month: 'Multiple', year: new Date().getFullYear(), date: new Date().toISOString() },
          // Priya Patel (HCS1235) - Total 144k, Paid 144k
          { id: 'P002', studentId: 'HCS1235', amount: 144000, month: 'Multiple', year: new Date().getFullYear(), date: new Date().toISOString() },
          // Amit Kumar (HCS1236) - Total 180k, Paid 145k
          { id: 'P003', studentId: 'HCS1236', amount: 145000, month: 'Multiple', year: new Date().getFullYear(), date: new Date().toISOString() },
          // Sneha Gupta (HCS2341) - Total 144k, Paid 96k
          { id: 'P004', studentId: 'HCS2341', amount: 96000, month: 'Multiple', year: new Date().getFullYear(), date: new Date().toISOString() },
          // Rohan Das (HCS2342) - Total 180k, Paid 180k
          { id: 'P005', studentId: 'HCS2342', amount: 180000, month: 'Multiple', year: new Date().getFullYear(), date: new Date().toISOString() },
          // Michael Johnson (HCS0003) - Unpaid
          // No payments
        ];
        saveToStorage(PAYMENTS_KEY, initialPayments);
    }
};

const getStudents = (): Student[] => getFromStorage(STUDENTS_KEY, []);
const addStudent = (student: Omit<Student, 'id'>) => {
  const students = getStudents();
  const nextIdNum = students.reduce((max, s) => {
      const idNum = parseInt(s.id.replace('HCS', ''), 10);
      return idNum > max ? idNum : max;
  }, 0) + 1;

  const newId = `HCS${nextIdNum.toString().padStart(4, '0')}`;
  const newStudent: Student = { ...student, id: newId };
  
  if (students.some(s => s.id === newStudent.id)) {
    // This case is less likely with the new ID generation but is a safeguard.
    throw new Error('Student with this ID already exists.');
  }

  saveToStorage(STUDENTS_KEY, [...students, newStudent]);
  return newStudent;
};
const getStudentById = (id: string): Student | undefined => getStudents().find(s => s.id === id);

const getPayments = (): Payment[] => getFromStorage(PAYMENTS_KEY, []);
const recordPayment = (payment: Omit<Payment, 'id' | 'date'>) => {
  const payments = getPayments();
  const newPayment: Payment = {
    ...payment,
    id: `P${Date.now()}`,
    date: new Date().toISOString(),
  };
  saveToStorage(PAYMENTS_KEY, [...payments, newPayment]);
  return newPayment;
};
const getPaymentsByStudentId = (studentId: string): Payment[] => getPayments().filter(p => p.studentId === studentId);

const getFeeStructures = (): ClassFee[] => getFromStorage(FEES_KEY, []);
const updateFeeStructure = (updatedFees: ClassFee[]) => {
  saveToStorage(FEES_KEY, updatedFees);
};

const updateMonthlyPayments = (studentId: string, paidMonths: Set<string>) => {
  const student = getStudentById(studentId);
  if (!student) throw new Error("Student not found for payment update");

  const feeStructure = getFeeStructures().find(f => f.classLevel === student.class);
  if (!feeStructure) throw new Error("Fee structure not found for student's class");
  
  const monthlyFee = feeStructure.monthlyFee;
  const allPayments = getPayments();

  const ACADEMIC_MONTHS = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];
  
  // Remove all of this student's payments that fall within the academic months.
  const otherPayments = allPayments.filter(p => 
    p.studentId !== studentId || !ACADEMIC_MONTHS.includes(p.month)
  );

  const currentMonth = new Date().getMonth(); // 0-11
  const currentCalendarYear = new Date().getFullYear();
  const academicYearStart = currentMonth < 3 ? currentCalendarYear - 1 : currentCalendarYear;

  const newStudentPayments: Payment[] = Array.from(paidMonths).map(month => {
    const isNextCalendarYear = ['January', 'February', 'March'].includes(month);
    const paymentYear = isNextCalendarYear ? academicYearStart + 1 : academicYearStart;

    return {
      id: `P${Date.now()}${Math.random()}`,
      studentId,
      amount: monthlyFee,
      month,
      year: paymentYear,
      date: new Date().toISOString(),
    };
  });
  
  saveToStorage(PAYMENTS_KEY, [...otherPayments, ...newStudentPayments]);
};

const updateStudent = (updatedStudent: Student) => {
  const students = getStudents();
  const studentIndex = students.findIndex(s => s.id === updatedStudent.id);
  if (studentIndex === -1) {
    throw new Error('Student not found for update.');
  }
  const updatedStudents = [...students];
  updatedStudents[studentIndex] = updatedStudent;
  saveToStorage(STUDENTS_KEY, updatedStudents);
};

const deleteStudent = (studentId: string) => {
  const students = getStudents();
  const updatedStudents = students.filter(s => s.id !== studentId);
  saveToStorage(STUDENTS_KEY, updatedStudents);

  // Also remove associated payments
  const payments = getPayments();
  const updatedPayments = payments.filter(p => p.studentId !== studentId);
  saveToStorage(PAYMENTS_KEY, updatedPayments);
};

export const dbService = {
  initialize,
  getStudents,
  addStudent,
  getStudentById,
  getPayments,
  recordPayment,
  getPaymentsByStudentId,
  getFeeStructures,
  updateFeeStructure,
  updateMonthlyPayments,
  updateStudent,
  deleteStudent,
};