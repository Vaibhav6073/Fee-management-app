import React, { useState, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import { dbService } from '../../services/dbService';
import { SCHOOL_NAME } from '../../constants';
import { UserIcon, LockIcon } from '../common/Icons';

const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');
  const [studentId, setStudentId] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const auth = useContext(AuthContext);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      try {
        if (activeTab === 'student') {
          const student = dbService.getStudentById(studentId.toUpperCase());
          if (student && student.password === studentPassword) {
            auth?.login({ id: student.id, role: UserRole.Student, name: student.name });
          } else {
            throw new Error('Invalid School ID or Password.');
          }
        } else { // Admin login
          if (adminEmail === 'admin@hcs.edu' && adminPassword === 'admin123') {
            auth?.login({ id: 'admin01', role: UserRole.Admin, name: 'Admin' });
          } else {
            throw new Error('Invalid Admin Email or Password.');
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      } finally {
        setIsLoading(false);
      }
    }, 1000); // Simulate network delay
  };

  const fillStudentDemo = () => {
    setStudentId('HCS1234');
    setStudentPassword('0000');
  }

  const fillAdminDemo = () => {
    setAdminEmail('admin@hcs.edu');
    setAdminPassword('admin123');
  }

  const renderStudentForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="flex items-end gap-x-3">
        <UserIcon className="h-5 w-5 text-slate-400 mb-2 flex-shrink-0" />
        <div className="input-anim-container w-full">
            <input
                id="studentId"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="input-field input-field-student"
                placeholder=" "
                required
                pattern="HCS\d{4}"
                title="School ID must be in the format HCSXXXX (e.g., HCS1234)"
            />
            <label htmlFor="studentId" className="input-label">
                School ID (e.g., HCS1234)
            </label>
        </div>
      </div>
      <div className="flex items-end gap-x-3">
        <LockIcon className="h-5 w-5 text-slate-400 mb-2 flex-shrink-0" />
        <div className="input-anim-container w-full">
            <input
                id="studentPassword"
                type="password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                className="input-field input-field-student"
                placeholder=" "
                required
            />
            <label htmlFor="studentPassword" className="input-label">
                Password
            </label>
        </div>
      </div>
      <div className="pt-4">
        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-600 rounded-lg text-white font-semibold shadow-lg shadow-cyan-500/30 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-cyan-700 disabled:cursor-not-allowed">
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </div>
       <p className="text-center text-xs text-slate-500 pt-2">
        Try demo? <span onClick={fillStudentDemo} className="font-semibold text-cyan-600 cursor-pointer hover:underline">Click here</span>
      </p>
    </form>
  );

  const renderAdminForm = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      <div className="flex items-end gap-x-3">
        <UserIcon className="h-5 w-5 text-slate-400 mb-2 flex-shrink-0" />
        <div className="input-anim-container w-full">
            <input
                id="adminEmail"
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="input-field input-field-admin"
                placeholder=" "
                required
            />
            <label htmlFor="adminEmail" className="input-label">
                Email Address
            </label>
        </div>
      </div>
      <div className="flex items-end gap-x-3">
        <LockIcon className="h-5 w-5 text-slate-400 mb-2 flex-shrink-0" />
        <div className="input-anim-container w-full">
            <input
                id="adminPassword"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="input-field input-field-admin"
                placeholder=" "
                required
            />
            <label htmlFor="adminPassword" className="input-label">
                Password
            </label>
        </div>
      </div>
       <div className="pt-4">
        <button type="submit" disabled={isLoading} className="w-full py-3 px-4 bg-indigo-500 hover:bg-indigo-600 rounded-lg text-white font-semibold shadow-lg shadow-indigo-500/30 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-indigo-700 disabled:cursor-not-allowed">
          {isLoading ? 'Signing In...' : 'Sign In'}
        </button>
      </div>
      <p className="text-center text-xs text-slate-500 pt-2">
        Try demo? <span onClick={fillAdminDemo} className="font-semibold text-indigo-600 cursor-pointer hover:underline">Click here</span>
      </p>
    </form>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4 overflow-hidden relative soft-animated-bg">
       {/* Animated Background Shapes & Effects */}
       <div className="absolute inset-0 z-0 opacity-60">
          {/* Floating Shapes */}
          <div className="shape bg-cyan-300 w-64 h-64 top-10 left-10" style={{ animationDelay: '2s', animationDuration: '25s' }}></div>
          <div className="shape bg-indigo-300 w-72 h-72 bottom-10 right-10" style={{ animationDelay: '0s', animationDuration: '30s' }}></div>
          <div className="shape bg-purple-300 w-56 h-56 top-1/2 left-1/3" style={{ animationDelay: '5s', animationDuration: '20s' }}></div>
          <div className="shape bg-pink-200 w-48 h-48 top-1/4 right-1/4" style={{ animationDelay: '8s', animationDuration: '35s' }}></div>

          {/* Shooting Stars */}
          <div className="shooting-star w-96" style={{ top: '20%', right: '0', animationDelay: '1.2s', animationDuration: '6s' }}></div>
          <div className="shooting-star w-80" style={{ top: '50%', right: '0', animationDelay: '4.5s', animationDuration: '8s' }}></div>
          <div className="shooting-star w-64" style={{ top: '90%', right: '0', animationDelay: '9s', animationDuration: '5s' }}></div>
      </div>

      <div className="w-full max-w-md mx-auto relative z-10 animate-fade-in-up">
        <div className="bg-white/60 backdrop-blur-3xl border border-white/30 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500">
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-800 tracking-wider animate-fade-in-up animation-delay-100">{SCHOOL_NAME}</h1>
              <p className="text-slate-500 mt-2 animate-fade-in-up animation-delay-200">Fee Management Portal</p>
            </div>

            <div className="flex bg-black/5 rounded-lg p-1 mb-8 animate-fade-in-up animation-delay-300">
              <button
                onClick={() => setActiveTab('student')}
                className={`w-1/2 p-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'student' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-500 hover:bg-black/5'}`}
              >
                Student Login
              </button>
              <button
                onClick={() => setActiveTab('admin')}
                className={`w-1/2 p-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'admin' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:bg-black/5'}`}
              >
                Admin Login
              </button>
            </div>

            {error && <div className="bg-red-100 border border-red-300 text-red-700 text-sm rounded-lg p-3 mb-6 text-center animate-fade-in-up">{error}</div>}

            <div key={activeTab} className="animate-fade-in-up animation-delay-400">
                {activeTab === 'student' ? renderStudentForm() : renderAdminForm()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;