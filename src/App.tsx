import { useState, useEffect } from 'react'
import Dashboard from './Dashboard'
import LoginScreen from './LoginScreen'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check storage on mount
  useEffect(() => {
    const storedAuth = localStorage.getItem('fresho_auth');
    const storedToken = localStorage.getItem('fresho_token');
    if (storedAuth === 'true' && storedToken) {
      setIsAuthenticated(true);
      setAccessToken(storedToken);
    }
    setLoading(false);
  }, []);

  const handleLogin = (email: string, token: string) => {
    localStorage.setItem('fresho_auth', 'true');
    localStorage.setItem('fresho_user', email);
    localStorage.setItem('fresho_token', token);
    setIsAuthenticated(true);
    setAccessToken(token);
  };

  const handleLogout = () => {
    localStorage.removeItem('fresho_auth');
    localStorage.removeItem('fresho_user');
    localStorage.removeItem('fresho_token');
    setIsAuthenticated(false);
    setAccessToken(null);
  };

  if (loading) return null; // Or a loading spinner

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <Dashboard onLogout={handleLogout} accessToken={accessToken} />
}

export default App
