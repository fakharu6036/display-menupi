import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { StorageService } from '../services/storage';
import { UserRole } from '../types';

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
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleGoogleResponse = async (response: any) => {
      try {
          setIsLoading(true);
          const user = await StorageService.loginWithGoogle(response.credential);
          if (user) navigate('/dashboard');
      } catch (err: any) {
          setError(err.message || 'Google login failed');
          setIsLoading(false);
      }
  };

  useEffect(() => {
    // Initialize Google Button
    const initGoogle = () => {
        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "200711223390-ktq256ali111vm4104kqdp9db58ufck8.apps.googleusercontent.com",
                callback: handleGoogleResponse
            });
            window.google.accounts.id.renderButton(
                document.getElementById("googleBtn")!,
                { theme: "outline", size: "large", width: 350, text: "signin_with" }
            );
        }
    };
    initGoogle();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setRequiresVerification(false);
    setResendMessage(null);

    try {
        const user = await StorageService.login(email, password);
        if (user) {
            if (user.role === UserRole.SUPER_ADMIN) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    } catch (err: any) {
        const errorMessage = err.message || "Login failed";
        setError(errorMessage);
        
        // Check if error is due to unverified email
        if (err.requiresVerification || errorMessage.includes('verify your email') || errorMessage.includes('Please verify')) {
            setRequiresVerification(true);
        }
    } finally {
        setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setIsResending(true);
    setResendMessage(null);
    setError(null);

    try {
      await StorageService.resendVerification(email);
      setResendMessage('Verification email sent! Please check your inbox.');
      setRequiresVerification(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 p-8 md:p-12">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-6 select-none">
            <img src="https://www.menupi.com/src/menupi-logo-black.svg" alt="MENUPI" className="h-10" />
            <span className="text-2xl font-black text-slate-900 tracking-tighter">signage</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500 mt-2 text-center">Manage your digital screens with ease.</p>
        </div>

        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-red-700 text-sm text-center font-medium mb-2">{error}</p>
                {requiresVerification && (
                    <div className="mt-3 pt-3 border-t border-red-200">
                        <p className="text-xs text-red-600 mb-3 text-center">Didn't receive the email?</p>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={handleResendVerification}
                            disabled={isResending}
                            className="w-full"
                        >
                            {isResending ? 'Sending...' : 'Resend Verification Email'}
                        </Button>
                    </div>
                )}
            </div>
        )}

        {resendMessage && (
            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm text-center">
                {resendMessage}
            </div>
        )}

        <div className="flex justify-center mb-6">
            <div id="googleBtn" className="w-full"></div>
        </div>

        <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-slate-500">Or continue with email</span>
            </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <div className="pt-2">
            <Button type="submit" size="lg" isLoading={isLoading}>
              Sign In to Dashboard
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center space-y-4">
          <div className="text-sm">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-bold hover:underline">Sign up</Link>
          </div>
          <button className="text-sm text-slate-400 hover:text-indigo-600 transition-colors block mx-auto">
            Forgot your password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;