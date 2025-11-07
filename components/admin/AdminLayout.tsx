import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { DashboardIcon, StudentManagementIcon, RecordPaymentIcon, ViewRecordsIcon, FeeManagementIcon, ReportIcon, LogoutIcon } from '../common/Icons';
import AdminDashboard from './AdminDashboard';
import AddStudent from './AddStudent';
import RecordPayment from './RecordPayment';
import ViewRecords from './ViewRecords';
import FeeManagement from './FeeManagement';
import GenerateReport from './GenerateReport';
import { SCHOOL_NAME } from '../../constants';

type AdminView = 'dashboard' | 'add-student' | 'record-payment' | 'view-records' | 'fee-management' | 'generate-report';

const adminNavItems = [
  { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { id: 'add-student', label: 'Student Management', icon: <StudentManagementIcon /> },
  { id: 'record-payment', label: 'Record Payment', icon: <RecordPaymentIcon /> },
  { id: 'view-records', label: 'View Records', icon: <ViewRecordsIcon /> },
  { id: 'fee-management', label: 'Fee Management', icon: <FeeManagementIcon /> },
  { id: 'generate-report', label: 'Generate Report', icon: <ReportIcon /> },
];

const AdminLayout: React.FC = () => {
  const [activeView, setActiveView] = useState<AdminView>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const auth = useContext(AuthContext);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <AdminDashboard />;
      case 'add-student': return <AddStudent />;
      case 'record-payment': return <RecordPayment />;
      case 'view-records': return <ViewRecords />;
      case 'fee-management': return <FeeManagement />;
      case 'generate-report': return <GenerateReport />;
      default: return <AdminDashboard />;
    }
  };
  
  const NavLink: React.FC<{item: typeof adminNavItems[0]}> = ({ item }) => (
    <button
      onClick={() => { setActiveView(item.id as AdminView); setSidebarOpen(false); }}
      className={`flex items-center w-full px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 group transform hover:translate-x-1 ${
        activeView === item.id 
        ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md' 
        : 'text-slate-500 hover:bg-indigo-500/10 hover:text-indigo-700'
      }`}
    >
      <div className={`${activeView === item.id ? 'text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}>
        {item.icon}
      </div>
      <span className="ml-4">{item.label}</span>
    </button>
  );

  return (
    <div className="flex h-screen overflow-hidden">
       <aside className={`absolute z-30 md:relative inset-y-0 left-0 w-64 bg-white shadow-xl transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center h-20 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
            <h1 className="text-xl font-bold tracking-wider">{SCHOOL_NAME}</h1>
            <span className="ml-2 text-xs font-semibold bg-white/20 px-2 py-0.5 rounded-full">Admin</span>
          </div>
          <nav className="flex-1 p-4 space-y-2">
            {adminNavItems.map(item => <NavLink key={item.id} item={item} />)}
          </nav>
          <div className="p-4 border-t border-black/5">
            <button
              onClick={auth?.logout}
              className="flex items-center w-full px-4 py-3 text-base font-medium rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-700 transition-colors duration-200"
            >
              <LogoutIcon />
              <span className="ml-4">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between md:justify-end h-20 px-6 bg-white/50 backdrop-blur-lg border-b border-black/5">
           <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-500 hover:text-slate-800">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
               </svg>
           </button>
          <div className="flex items-center">
            <span className="text-slate-600 mr-4">Welcome, {auth?.user?.name}</span>
            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center font-bold text-white">
              {auth?.user?.name?.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8 soft-animated-bg">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;