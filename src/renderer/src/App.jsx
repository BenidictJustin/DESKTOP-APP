import React, { useState, useEffect } from 'react';
import { listenToAuthChanges, logout } from './services/db';
import Login from './components/Login';
import AdminDashboard from './modules/admin/AdminDashboard';
import OfficeCoordinatorDashboard from './modules/office-coordinator/OfficeCoordinatorDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to changes in auth context (either Firebase auth or LocalStorage simulation)
    const unsubscribe = listenToAuthChanges((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center font-poppins">
        <div className="h-10 w-10 border-[3px] border-navy-blue/20 border-t-sig-green rounded-full animate-spin mb-4"></div>
        <p className="text-xs text-navy-blue font-semibold tracking-wide">Securing DommUnity Workspace Session...</p>
      </div>
    );
  }

  // Routing gateway based on user session & role credentials
  if (!user) {
    return <Login onLoginSuccess={setUser} />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard user={user} onLogout={handleLogout} />;
  }

  if (user.role === 'office_coordinator') {
    return <OfficeCoordinatorDashboard user={user} onLogout={handleLogout} />;
  }

  // Fallback in case of incorrect roles
  return (
    <div className="min-h-screen w-screen flex flex-col items-center justify-center p-6 text-center font-poppins">
      <div className="glass-modal rounded-2xl p-8 max-w-md shadow-glass-xl border border-white/80 text-gray-800 animate-fade-in-scale">
        <h2 className="text-lg font-bold text-error-600 mb-2 tracking-tight">Access Restrict Alert</h2>
        <p className="text-sm text-gray-600 font-medium mb-6">
          Your account role "{user.role}" does not have access permissions to view this terminal panel.
        </p>
        <button
          onClick={handleLogout}
          className="bg-navy-blue hover:bg-navy-blue-600 text-white rounded-xl text-sm font-semibold py-2.5 px-6 shadow-glass-sm hover:shadow-md transition-all duration-150 cursor-pointer border border-white/20"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}

export default App;
