import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { listenToAuthChanges, logout } from './services/db';
import Login from './components/Login';
import AdminDashboard from './modules/admin/AdminDashboard';
import OfficeCoordinatorDashboard from './modules/office-coordinator/OfficeCoordinatorDashboard';
import SplashScreen from './components/SplashScreen';
import { authTransitionVariants, authTransition } from './components/motion/motionConfig';

function App() {
  const [user, setUser] = useState(null);
  const [activeUser, setActiveUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Listen to changes in auth context (either Firebase auth or LocalStorage simulation)
    const unsubscribe = listenToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (loading) {
        setActiveUser(currentUser);
        setLoading(false);
      } else if (!currentUser) {
        setActiveUser(null);
      }
    });

    return () => unsubscribe();
  }, [loading]);

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setActiveUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleLoginSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    setActiveUser(authenticatedUser);
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={() => setShowSplash(false)} />
        )}
      </AnimatePresence>

      {!showSplash && (
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="min-h-screen w-screen flex flex-col items-center justify-center font-poppins bg-[#030728]"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            />
          ) : !activeUser ? (
            <motion.div
              key="login"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <Login onLoginSuccess={handleLoginSuccess} />
            </motion.div>
          ) : activeUser.role === 'admin' ? (
            <motion.div
              key="admin-dashboard"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <AdminDashboard user={activeUser} onLogout={handleLogout} />
            </motion.div>
          ) : activeUser.role === 'office_coordinator' ? (
            <motion.div
              key="coordinator-dashboard"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <OfficeCoordinatorDashboard user={activeUser} onLogout={handleLogout} />
            </motion.div>
          ) : (
            <motion.div
              key="access-denied"
              className="min-h-screen w-screen flex flex-col items-center justify-center p-6 text-center font-poppins bg-[#030728]"
              variants={authTransitionVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={authTransition}
            >
              <div className="glass-modal rounded-2xl p-8 max-w-md shadow-glass-xl border border-white/80 text-gray-800 animate-fade-in-scale">
                <h2 className="text-lg font-bold text-error-600 mb-2 tracking-tight">Access Restrict Alert</h2>
                <p className="text-sm text-gray-600 font-medium mb-6">
                  Your account role "{activeUser.role}" does not have access permissions to view this terminal panel.
                </p>
                <button
                  onClick={handleLogout}
                  className="bg-navy-blue hover:bg-navy-blue-600 text-white rounded-xl text-sm font-semibold py-2.5 px-6 shadow-glass-sm hover:shadow-md transition-all duration-150 cursor-pointer border border-white/20"
                >
                  Return to Login
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}

export default App;
