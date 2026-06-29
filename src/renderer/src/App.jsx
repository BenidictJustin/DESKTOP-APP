import React, { useState, useEffect } from 'react';
import { listenToAuthChanges, logout } from './services/db';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import OfficeCoordinatorDashboard from './components/OfficeCoordinatorDashboard';

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
      <div className="min-h-screen w-screen bg-gray-100 flex flex-col items-center justify-center font-poppins">
        <div className="h-12 w-12 border-4 border-navy-blue border-t-sig-green rounded-full animate-spin mb-4"></div>
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

  if (user.role === 'department_coordinator') {
    return <CoordinatorDashboard user={user} onLogout={handleLogout} />;
  }

  // Fallback in case of incorrect roles
  return (
    <div className="min-h-screen w-screen bg-gray-100 flex flex-col items-center justify-center p-6 text-center font-poppins">
      <div className="bg-white rounded-3xl p-8 max-w-md shadow-lg border border-red-100 text-gray-800">
        <h2 className="text-lg font-bold text-red-600 mb-2">Access Restrict Alert</h2>
        <p className="text-xs text-gray-500 mb-6">
          Your account role "{user.role}" does not have access permissions to view this terminal panel.
        </p>
        <button
          onClick={handleLogout}
          className="bg-navy-blue text-white rounded-full text-xs font-semibold py-2 px-6 border-b-2 border-sig-green hover:opacity-90 transition cursor-pointer"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
}

export default App;
