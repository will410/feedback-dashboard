import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import LoginScreen from './LoginScreen'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check storage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('fresho_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (email: string) => {
    localStorage.setItem('fresho_auth', 'true');
    localStorage.setItem('fresho_user', email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('fresho_auth');
    localStorage.removeItem('fresho_user');
    setIsAuthenticated(false);
  };

  if (loading) return null; // Or a loading spinner

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} />
}

export default App
