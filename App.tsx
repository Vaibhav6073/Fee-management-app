import React, { useState, useMemo } from 'react';
import { AuthContext } from './contexts/AuthContext';
import LoginPage from './components/login/LoginPage';
import AdminLayout from './components/admin/AdminLayout';
import StudentLayout from './components/student/StudentLayout';
import { User, UserRole } from './types';
import { dbService } from './services/dbService';

// Initialize mock database on first load
dbService.initialize();

function App() {
  const [user, setUser] = useState<User | null>(null);

  const login = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  
  // Persist login across reloads
  React.useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const authContextValue = useMemo(() => ({ user, login, logout }), [user]);

  const renderContent = () => {
    if (!user) {
      return <LoginPage />;
    }
    switch (user.role) {
      case UserRole.Admin:
        return <AdminLayout />;
      case UserRole.Student:
        return <StudentLayout />;
      default:
        return <LoginPage />;
    }
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <div className="min-h-screen w-full text-slate-800 font-sans">
        {renderContent()}
      </div>
    </AuthContext.Provider>
  );
}

export default App;