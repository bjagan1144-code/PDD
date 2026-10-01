import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Activity, Mail, Lock, Sparkles } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';

const GoogleIcon = () => (
  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setToastType('error');
      setToastMessage("Please enter email and password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      setToastType('success');
      setToastMessage("Access granted. Loading research workspace...");
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setToastType('error');
      setToastMessage(err.message || "Invalid credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      setToastType('success');
      setToastMessage("Access granted. Loading your Google researcher profile...");
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setToastType('error');
      setToastMessage(err.message || "Failed to authenticate with Google. Try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-medical-500/5 -top-20 -left-20 blur-3xl pointer-events-none" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-biotech-500/5 -bottom-20 -right-20 blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0d1222]/80 border border-slate-800 rounded-xl p-8 shadow-2xl relative backdrop-blur-md z-10 space-y-6">
        {/* Branding header */}
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center space-x-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-medical-600 to-biotech-400 flex items-center justify-center shadow-lg shadow-medical-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-widest text-slate-100">BIOPATCH AI</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Research Modeling Portal</span>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="researcher@biopatch.ai"
            icon={Mail}
            required
            disabled={isLoading}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
            disabled={isLoading}
          />

          <div className="flex justify-between items-center text-xs pt-1">
            <Link to="/forgot-password" className="text-medical-400 hover:text-medical-300 transition-colors font-medium">
              Forgot Password?
            </Link>
            <Link to="/register" className="text-slate-400 hover:text-slate-200 transition-colors font-medium">
              Create Account
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full"
            variant="primary"
            isLoading={isLoading}
            disabled={googleLoading}
          >
            Sign In
          </Button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-slate-800"></div>
          <span className="flex-shrink mx-4 text-slate-500 font-bold uppercase text-[9px] tracking-widest">Or authenticate via</span>
          <div className="flex-grow border-t border-slate-800"></div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full text-slate-300 hover:text-white"
          variant="secondary"
          isLoading={googleLoading}
          disabled={isLoading}
        >
          <GoogleIcon />
          Sign In with Google
        </Button>
      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};

export default LoginPage;
