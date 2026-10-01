import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, ArrowLeft } from 'lucide-react';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setToastType('error');
      setToastMessage("Please enter your registered email address.");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // simulation
    setToastType('success');
    setToastMessage("A secure reset link has been dispatched to your email.");
    setIsLoading(false);
    
    // Clear input
    setEmail('');
    // Send back to login after some delay
    setTimeout(() => navigate('/login'), 2500);
  };

  return (
    <div className="min-h-screen bg-[#070913] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-medical-500/5 -top-20 -left-20 blur-3xl pointer-events-none" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-biotech-500/5 -bottom-20 -right-20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0d1222]/80 border border-slate-800 rounded-xl p-8 shadow-2xl relative backdrop-blur-md z-10 space-y-6">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center space-x-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-medical-600 to-biotech-400 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-widest text-slate-100">BIOPATCH AI</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Reset Credentials</span>
        </div>

        <div className="text-slate-400 text-xs text-center leading-relaxed">
          Provide your email address below, and our system will generate a localized session recovery link for your account.
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <Input
            label="Registered Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="researcher@biopatch.ai"
            icon={Mail}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            variant="primary"
            isLoading={isLoading}
          >
            Send Reset Link
          </Button>
        </form>

        <div className="text-center">
          <Link 
            to="/login" 
            className="inline-flex items-center text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Sign In
          </Link>
        </div>
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

export default ForgotPasswordPage;
