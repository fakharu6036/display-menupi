import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { CheckCircle, XCircle, Mail, Loader2, RefreshCw } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'already-verified'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/verify-email?token=${token}`);
      const data = await res.json();

      if (res.ok) {
        if (data.alreadyVerified) {
          setStatus('already-verified');
          setMessage(data.message);
        } else {
          setStatus('success');
          setMessage(data.message);
          if (data.email) {
            setEmail(data.email);
          }
        }
      } else {
        if (data.error?.includes('expired')) {
          setStatus('expired');
        } else {
          setStatus('error');
        }
        setMessage(data.error || 'Verification failed');
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Failed to verify email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      // Try to get email from URL or show input
      return;
    }

    setIsResending(true);
    setResendMessage(null);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (res.ok) {
        setResendMessage(data.message || 'Verification email sent! Please check your inbox.');
      } else {
        setResendMessage(data.error || 'Failed to resend verification email');
      }
    } catch (err: any) {
      setResendMessage(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-6">
          {status === 'loading' && (
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
          )}
          {(status === 'error' || status === 'expired') && (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          )}
          {status === 'already-verified' && (
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-blue-600" />
            </div>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-4">
          {status === 'loading' && 'Verifying Email...'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
          {status === 'expired' && 'Link Expired'}
          {status === 'already-verified' && 'Already Verified'}
        </h1>

        <p className="text-slate-600 mb-6">{message}</p>

        {status === 'success' && email && (
          <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-200">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Mail className="w-5 h-5" />
              <span className="font-semibold">{email}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {(status === 'success' || status === 'already-verified') && (
            <Button
              onClick={() => navigate('/login')}
              className="w-full"
            >
              Go to Login
            </Button>
          )}
          
          {(status === 'error' || status === 'expired') && (
            <>
              {email && (
                <Button
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="w-full mb-3"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isResending ? 'animate-spin' : ''}`} />
                  {isResending ? 'Sending...' : 'Resend Verification Email'}
                </Button>
              )}
              <Button
                onClick={() => navigate('/register')}
                variant="secondary"
                className="w-full"
              >
                Back to Register
              </Button>
              <Link to="/login" className="block text-center text-sm text-indigo-600 hover:underline mt-3">
                Already have an account? Sign in
              </Link>
            </>
          )}

          {resendMessage && (
            <div className={`mt-4 p-3 rounded-xl text-sm text-center ${
              resendMessage.includes('sent') 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {resendMessage}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default VerifyEmail;

