import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleReturn = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] flex flex-col items-center justify-center p-6 text-center font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute w-[30vw] h-[30vw] rounded-full bg-rose-500/5 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none" />

      <div className="space-y-6 z-10 max-w-sm">
        <div className="inline-flex p-4 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-2 animate-bounce">
          <AlertCircle className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-6xl font-black text-slate-100 tracking-tight">404</h1>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Research Page Not Found</h2>
          <p className="text-xs text-slate-500 leading-relaxed pt-1">
            The mathematical trajectory index you entered does not exist or has been shifted in the database archives.
          </p>
        </div>

        <div className="pt-4">
          <Button 
            onClick={handleReturn} 
            variant="primary" 
            className="w-full text-xs font-bold py-3" 
            icon={ArrowLeft}
          >
            Return to Safety
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
