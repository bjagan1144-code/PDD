import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Activity, Mail, Lock, User, Briefcase } from 'lucide-react';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import Toast from '../components/Toast';

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('Researcher');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword || !role) {
      setToastType('error');
      setToastMessage("All fields are required.");
      return;
    }

    if (password !== confirmPassword) {
      setToastType('error');
      setToastMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setToastType('error');
      setToastMessage("Password should be at least 6 characters.");
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password, role);
      setToastType('success');
      setToastMessage("Registration successful! Building user workspace...");
      setTimeout(() => navigate('/dashboard'), 800);
    } catch (err) {
      setToastType('error');
      setToastMessage(err.message || "Registration failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070913] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-medical-500/5 -top-20 -left-20 blur-3xl pointer-events-none" />
      <div className="absolute w-[40vw] h-[40vw] rounded-full bg-biotech-500/5 -bottom-20 -right-20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#0d1222]/80 border border-slate-800 rounded-xl p-8 shadow-2xl relative backdrop-blur-md z-10 space-y-5">
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="flex items-center space-x-2 mb-2">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-medical-600 to-biotech-400 flex items-center justify-center">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-widest text-slate-100">BIOPATCH AI</span>
          </Link>
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-sans">Create Research Account</span>
        </div>

        <form onSubmit={handleRegister} className="space-y-4 pt-1">
          <Input
            label="Full Name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dr. Alexander Fleming"
            icon={User}
            required
            disabled={isLoading}
          />

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

          <Select
            label="Academic Role"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'Researcher', label: 'Researcher' },
              { value: 'Student', label: 'Student / Investigator' }
            ]}
            required
            disabled={isLoading}
            placeholder=""
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••• (Min. 6 chars)"
            icon={Lock}
            required
            disabled={isLoading}
          />

          <Input
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            icon={Lock}
            required
            disabled={isLoading}
          />

          <Button
            type="submit"
            className="w-full"
            variant="primary"
            isLoading={isLoading}
          >
            Register Account
          </Button>
        </form>

        <div className="text-center text-xs text-slate-400 pt-1">
          Already have an account?{' '}
          <Link to="/login" className="text-medical-400 hover:text-medical-300 font-semibold transition-colors">
            Sign In
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

export default RegisterPage;
