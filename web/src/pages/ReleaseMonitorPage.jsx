import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  Info, 
  Thermometer, 
  Droplet, 
  Compass, 
  Clock,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Toast from '../components/Toast';

const ReleaseMonitorPage = () => {
  // Streaming state
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentRelease, setCurrentRelease] = useState(0);
  const [currentRate, setCurrentRate] = useState(0);
  
  // Changing environmental parameters
  const [temp, setTemp] = useState(36.8);
  const [ph, setPh] = useState(6.75);
  const [moisture, setMoisture] = useState(52);
  const [remainingDrug, setRemainingDrug] = useState(50.0);

  // Array of points for live charting
  const [chartData, setChartData] = useState([{ time: 0, release: 0 }]);

  const [toastMessage, setToastMessage] = useState('');
  const timerRef = useRef(null);

  // Equations for simulated real-time release
  // (Higuchi kinetics modeled dynamically)
  const drugCapacity = 50.0; // mg
  const releaseConstant = 0.18; // speed
  
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prevTime => {
          const nextTime = prevTime + 1;
          
          if (nextTime > 24) {
            setIsRunning(false);
            clearInterval(timerRef.current);
            setToastMessage("Release monitoring session reached full 24h duration.");
            return prevTime;
          }

          // Calculate release kinetics for next point
          // Q(t) = 100 * (1 - e^(-k * t^0.5))
          const releasePercent = 100 * (1 - Math.exp(-releaseConstant * Math.sqrt(nextTime)));
          const roundedRelease = parseFloat(releasePercent.toFixed(1));
          
          // Rate in last hour
          const lastRelease = 100 * (1 - Math.exp(-releaseConstant * Math.sqrt(prevTime)));
          const hourlyRate = parseFloat((releasePercent - lastRelease).toFixed(2));
          
          // Fluctuating environment values
          setTemp(prev => parseFloat((36.5 + Math.random() * 0.6).toFixed(2)));
          setPh(prev => parseFloat((6.7 + Math.random() * 0.15).toFixed(2)));
          setMoisture(prev => Math.min(100, Math.max(0, Math.round(50 + Math.random() * 6))));
          
          const rem = Math.max(0, parseFloat((drugCapacity - (drugCapacity * (roundedRelease / 100))).toFixed(2)));
          setRemainingDrug(rem);
          setCurrentRelease(roundedRelease);
          setCurrentRate(hourlyRate);

          setChartData(prevData => [
            ...prevData,
            { time: nextTime, release: roundedRelease }
          ]);

          return nextTime;
        });
      }, 1000); // 1s = 1 hour simulation
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  const handleStart = () => {
    setIsRunning(true);
    setToastMessage("Sensor stream initiated. Running real-time telemetry...");
  };

  const handlePause = () => {
    setIsRunning(false);
    setToastMessage("Telemetry stream paused.");
  };

  const handleReset = () => {
    setIsRunning(false);
    setCurrentTime(0);
    setCurrentRelease(0);
    setCurrentRate(0);
    setTemp(36.8);
    setPh(6.75);
    setMoisture(52);
    setRemainingDrug(50.0);
    setChartData([{ time: 0, release: 0 }]);
    setToastMessage("Telemetry logs reset.");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center">
            <Activity className="h-5.5 w-5.5 text-medical-400 mr-2" />
            Real-Time Release Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate live biological sensor feedback and drug dissolution tracking from patch matrices.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="warning" hasDot>
            SIMULATED SENSOR DATA
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* GRAPH COLUMN */}
        <div className="lg:col-span-8 space-y-6">
          <div className="glass-card p-6 border-slate-800">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">
                  Live Concentration Stream
                </h3>
                <p className="text-[10px] text-slate-500 font-semibold uppercase mt-0.5">
                  1 second = 1 hour interval telemetry
                </p>
              </div>

              {isRunning && (
                <span className="flex items-center text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping mr-1.5" />
                  Streaming Live
                </span>
              )}
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                  <XAxis dataKey="time" domain={[0, 24]} stroke="#475569" style={{ fontSize: 10 }} label={{ value: 'Time (Hours)', position: 'insideBottom', offset: -5 }} />
                  <YAxis domain={[0, 100]} stroke="#475569" style={{ fontSize: 10 }} label={{ value: 'Cumulative Release (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }} />
                  <Line type="monotone" dataKey="release" stroke="#0ea5e9" strokeWidth={3} dot={{ r: 2 }} name="Live Concentration" activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Metrics grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1222]/80">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[9px] uppercase font-bold tracking-wider">Current Time</span>
                <Clock className="h-3.5 w-3.5" />
              </div>
              <p className="text-lg font-black text-slate-200 mt-1">{currentTime} hours</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1222]/80">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[9px] uppercase font-bold tracking-wider">Cumulative Release</span>
                <Activity className="h-3.5 w-3.5 text-medical-400" />
              </div>
              <p className="text-lg font-black text-slate-200 mt-1">{currentRelease}%</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1222]/80">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[9px] uppercase font-bold tracking-wider">Release Rate</span>
                <Compass className="h-3.5 w-3.5 text-biotech-400" />
              </div>
              <p className="text-lg font-black text-slate-200 mt-1">{currentRate}% / h</p>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-[#0d1222]/80">
              <div className="flex justify-between items-center text-slate-500">
                <span className="text-[9px] uppercase font-bold tracking-wider">Remaining Drug</span>
                <span className="text-[10px] font-bold text-slate-400">mg</span>
              </div>
              <p className="text-lg font-black text-slate-200 mt-1">{remainingDrug} mg</p>
            </div>

          </div>
        </div>

        {/* CONTROLS COLUMN */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 border-slate-800 space-y-5">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest pb-3 border-b border-slate-800/80">
              Telemetry Stream Controller
            </h3>

            <div className="flex flex-col space-y-3.5">
              {!isRunning && currentTime === 0 && (
                <Button variant="primary" onClick={handleStart} className="w-full text-xs font-bold py-3" icon={Play}>
                  Start Monitoring
                </Button>
              )}
              {isRunning && (
                <Button variant="secondary" onClick={handlePause} className="w-full text-xs font-bold py-3" icon={Pause}>
                  Pause Live Stream
                </Button>
              )}
              {!isRunning && currentTime > 0 && (
                <Button variant="primary" onClick={handleStart} className="w-full text-xs font-bold py-3" icon={Play}>
                  Resume Telemetry
                </Button>
              )}

              <Button variant="outline" onClick={handleReset} className="w-full text-xs" icon={RotateCcw}>
                Reset Sensor Log
              </Button>
            </div>

            <div className="pt-2 space-y-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Live Sensor Reads</span>
              
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium flex items-center">
                  <Thermometer className="h-4 w-4 mr-1.5 text-amber-500" />
                  Temperature
                </span>
                <span className="text-sm font-bold text-slate-200">{temp}°C</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium flex items-center">
                  <Activity className="h-4 w-4 mr-1.5 text-emerald-500" />
                  Skin pH
                </span>
                <span className="text-sm font-bold text-slate-200">{ph}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-xs text-slate-400 font-medium flex items-center">
                  <Droplet className="h-4 w-4 mr-1.5 text-cyan-500" />
                  Moisture Index
                </span>
                <span className="text-sm font-bold text-slate-200">{moisture}%</span>
              </div>
            </div>
          </div>

          {/* Telemetry alert disclaimer */}
          <div className="glass-card p-5 border-slate-800/80 flex items-start space-x-3 bg-slate-900/20">
            <Info className="h-5 w-5 text-slate-400 flex-shrink-0" />
            <div className="text-[11px] text-slate-400 leading-normal">
              <span className="font-bold text-slate-300 uppercase tracking-wider block mb-0.5">Telemetry Sandbox</span>
              This dashboard simulates data packets received from a hypothetical biosensor patch. The graph updates automatically via JavaScript intervals.
            </div>
          </div>

        </div>

      </div>

      {toastMessage && (
        <Toast
          message={toastMessage}
          type="info"
          onClose={() => setToastMessage('')}
        />
      )}
    </div>
  );
};

export default ReleaseMonitorPage;
