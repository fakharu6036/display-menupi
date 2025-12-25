
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StorageService } from '../services/storage';

declare global {
  interface Window {
    google: any;
  }
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    const user = StorageService.getUser();
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  // Initialize Google Sign-In
  useEffect(() => {
    const initGoogle = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: "100878362406702614118",
          callback: handleGoogleResponse
        });
        window.google.accounts.id.renderButton(
          document.getElementById("googleBtnLogin")!,
          { theme: "outline", size: "large", width: 350, text: "signin_with" }
        );
      }
    };
    initGoogle();
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setIsLoading(true);
      setError(null);
      await StorageService.loginWithGoogle(response.credential);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google login failed');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
        await StorageService.login(email, password);
        navigate('/dashboard');
    } catch (err: any) {
        setError(err.message || "Invalid credentials. Please try again.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfbff] p-6">
      <div className="w-full max-w-md animate-fade">
        <div className="flex flex-col items-center mb-10 text-center">
          <img 
            src="https://www.menupi.com/src/menupi-logo-black.svg" 
            alt="MENUPI" 
            className="h-10 mb-8" 
          />
          <h1 className="text-3xl font-bold text-[#1b1b1f] tracking-tight">Welcome back</h1>
          <p className="text-[#44474e] mt-2 font-medium">Control your menus from anywhere.</p>
        </div>

        <div className="bg-white border border-[#e4e1ec] rounded-[32px] p-8 md:p-10 shadow-sm">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-[#ba1a1a] rounded-2xl text-sm font-medium flex items-center gap-3">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              placeholder="manager@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <div className="flex justify-end">
                <button type="button" className="text-xs font-bold text-[#3f51b5] hover:underline px-1">Forgot password?</button>
              </div>
            </div>
            
            <div className="pt-2">
              <Button type="submit" size="lg" isLoading={isLoading} className="w-full">
                Sign In
              </Button>
            </div>
          </form>

          <div className="mt-10 text-center space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#e4e1ec]"></div></div>
              <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold"><span className="bg-white px-4 text-[#777680]">Or</span></div>
            </div>
            
            <div id="googleBtnLogin" className="w-full flex justify-center"></div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm font-medium text-[#44474e]">
          Don't have an account? <Link to="/register" className="text-[#3f51b5] font-bold hover:underline">Start for free</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
