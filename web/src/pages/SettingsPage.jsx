import React, { useState, useEffect } from 'react';
import { Settings, User, Sliders, Server, Save, Circle, Activity, AlertCircle } from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Toast from '../components/Toast';
import Badge from '../components/Badge';
import { useAuth } from '../hooks/useAuth';
import { getStorageItem, setStorageItem, KEYS } from '../utils/storage';
import { checkBackendHealth } from '../services/api';

const SettingsPage = () => {
  const { user, register } = useAuth(); // use register as save profile mechanism for local state

  // Profile forms
  const [profileName, setProfileName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileRole, setProfileRole] = useState('Researcher');

  // Application settings
  const [theme, setTheme] = useState('dark');
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [isLoading, setIsLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
      setProfileRole(user.role);
    }

    const appSettings = getStorageItem(KEYS.SETTINGS);
    if (appSettings) {
      setTheme(appSettings.theme || 'dark');
      setNotifications(appSettings.notifications !== false);
      setLanguage(appSettings.language || 'en');
    }

    const verifyConnection = async () => {
      const connected = await checkBackendHealth();
      setBackendConnected(connected);
    };
    verifyConnection();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profileName || !profileEmail) {
      setToastType('error');
      setToastMessage("Name and Email cannot be empty.");
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 600)); // simulation
    
    const updatedUser = {
      ...user,
      name: profileName,
      email: profileEmail,
      role: profileRole
    };
    
    // Save updated profile
    setStorageItem(KEYS.USER, updatedUser);
    // Reload page or force auth update by calling mock login/register hooks (we can just modify local storage and prompt user reload)
    setToastType('success');
    setToastMessage("Research profile updated. Please refresh to synchronize headers.");
    setIsLoading(false);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const config = {
      theme,
      notifications,
      language
    };

    setStorageItem(KEYS.SETTINGS, config);
    setToastType('success');
    setToastMessage("Application configuration saved.");
    setIsLoading(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center">
          <Settings className="h-5.5 w-5.5 text-medical-400 mr-2" />
          System Settings & Profile
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage researcher session variables, UI themes, and evaluate pipeline connectivity.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="glass-card p-6 border-slate-800 space-y-4 lg:col-span-2">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/80">
            <User className="h-4.5 w-4.5 text-medical-400" />
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
              Researcher Credentials
            </h3>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Academic Name"
                name="name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Dr. Alexander Fleming"
                required
              />
              <Input
                label="Research Email"
                name="email"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="researcher@biopatch.ai"
                required
              />
            </div>

            <Select
              label="Staff Classification"
              name="role"
              value={profileRole}
              onChange={(e) => setProfileRole(e.target.value)}
              options={[
                { value: 'Researcher', label: 'Researcher / Academic Guide' },
                { value: 'Principal Investigator', label: 'Principal Investigator' },
                { value: 'Student', label: 'Student / Investigator' }
              ]}
              placeholder=""
            />

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isLoading} icon={Save}>
                Save Profile
              </Button>
            </div>
          </form>
        </div>

        {/* System connectivity status */}
        <div className="glass-card p-6 border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/80 mb-5">
              <Server className="h-4.5 w-4.5 text-biotech-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                Pipeline Diagnostics
              </h3>
            </div>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between items-center p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Frontend Client</span>
                <span className="flex items-center text-emerald-400 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  Active (5173)
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Inference Core</span>
                <span className={`flex items-center ${backendConnected ? 'text-emerald-400' : 'text-cyan-400'} font-bold`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${backendConnected ? 'bg-emerald-400' : 'bg-cyan-400'} mr-1.5`} />
                  {backendConnected ? 'Random Forest v1.0' : 'Local Math Mock'}
                </span>
              </div>

              <div className="flex justify-between items-center p-2.5 rounded bg-slate-900/60 border border-slate-800/80">
                <span className="text-slate-400">Local Archive</span>
                <span className={`flex items-center ${backendConnected ? 'text-emerald-400' : 'text-cyan-400'} font-bold`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${backendConnected ? 'bg-emerald-400' : 'bg-cyan-400'} mr-1.5`} />
                  {backendConnected ? 'SQLite Database' : 'LocalStorage Cache'}
                </span>
              </div>

              <div className={`flex justify-between items-center p-2.5 rounded ${
                backendConnected 
                  ? 'bg-emerald-500/5 border-emerald-500/20' 
                  : 'bg-rose-500/5 border-rose-500/20'
              } border`}>
                <span className={backendConnected ? 'text-emerald-300' : 'text-rose-300'}>API Connection</span>
                <span className={`flex items-center ${
                  backendConnected ? 'text-emerald-400' : 'text-rose-400'
                } font-extrabold uppercase tracking-wide text-[10px]`}>
                  {backendConnected ? (
                    <>
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                      Connected (8000)
                    </>
                  ) : (
                    <>
                      <Circle className="h-2 w-2 mr-1.5 fill-rose-500/20 text-rose-500" />
                      Not Connected
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg border border-slate-800 bg-[#0d1222]/80 mt-4 text-[10px] text-slate-500 leading-normal flex items-start space-x-2 font-medium">
            <AlertCircle className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-300 uppercase tracking-wider block mb-0.5">Standalone Setup</span>
              {backendConnected 
                ? "API connection is online. Model predictions are executed dynamically via uvicorn hosting on port 8000."
                : "API connection will remain offline until the backend server (POST /api/simulate) is booted and configured in VITE_API_URL."
              }
            </div>
          </div>
        </div>

      </div>

      {/* Application UI preferences */}
      <div className="glass-card p-6 border-slate-800 space-y-5 max-w-xl">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/80">
          <Sliders className="h-4.5 w-4.5 text-science-400" />
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
            Application Preferences
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Visual Theme"
            name="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            options={[
              { value: 'dark', label: 'Dark Scientific' },
              { value: 'light', label: 'Light Laboratory (Demo)' }
            ]}
            placeholder=""
          />

          <Select
            label="Telemetry Alerts"
            name="notifications"
            value={notifications ? 'true' : 'false'}
            onChange={(e) => setNotifications(e.target.value === 'true')}
            options={[
              { value: 'true', label: 'Enabled' },
              { value: 'false', label: 'Disabled' }
            ]}
            placeholder=""
          />

          <Select
            label="Language System"
            name="language"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            options={[
              { value: 'en', label: 'English (US)' },
              { value: 'de', label: 'Deutsch' }
            ]}
            placeholder=""
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={handleSaveSettings} isLoading={isLoading}>
            Save Preferences
          </Button>
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

export default SettingsPage;
