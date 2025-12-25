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

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    const user = StorageService.getUser();
    if (user) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [navigate]);

  useEffect(() => {
    // Initialize Google Button
    const initGoogle = () => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: "100878362406702614118",
                callback: handleGoogleResponse
            });
            window.google.accounts.id.renderButton(
                document.getElementById("googleBtnReg")!,
                { theme: "outline", size: "large", width: 350, text: "signup_with" }
            );
        }
    };
    initGoogle();
  }, []);

  const handleGoogleResponse = async (response: any) => {
      try {
          setIsLoading(true);
          const user = await StorageService.loginWithGoogle(response.credential);
          if (user) navigate('/dashboard');
      } catch (err: any) {
          setError(err.message || 'Google registration failed');
          setIsLoading(false);
      }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
        await StorageService.registerUser(name, email, password);
        navigate('/dashboard');
    } catch (err: any) {
        setError(err.message || 'Registration failed');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Create Account</h1>

        {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm text-center">
                {error}
            </div>
        )}

        <div className="flex justify-center mb-6">
            <div id="googleBtnReg" className="w-full"></div>
        </div>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">Or register with email</span>
            </div>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <Input label="Business Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>Sign Up</Button>
        </form>
        <div className="mt-4 text-center text-sm">
            Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;