import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setRole, setActiveDriverId, setUser } from '../../redux/authSlice';
import { Shield, Truck, Key, Check, Users, ArrowLeft, Phone, BadgeAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [showDrivers, setShowDrivers] = React.useState(false);
  const [driversList, setDriversList] = React.useState([]);

  const handleRoleLogin = async (selectedRole, driverId = null) => {
    setIsLoading(true);
    setErrorMsg('');
    
    // Map role to seeded emails
    const roleEmails = {
      'Super Admin': 'admin@logistics.com',
      'Operations Manager': 'ops@logistics.com',
      'Dispatcher': 'dispatcher@logistics.com',
      'Finance Manager': 'finance@logistics.com',
      'Driver': 'driver@logistics.com'
    };

    const driverEmails = {
      '1': 'john@logistics.com',
      '2': 'jane@logistics.com',
      '3': 'robert@logistics.com'
    };
    
    let email = roleEmails[selectedRole];
    if (selectedRole === 'Driver' && driverId) {
      email = driverEmails[String(driverId)] || 'driver@logistics.com';
    }
    
    try {
      const apiClient = (await import('../../services/api')).default;
      const response = await apiClient.post('/api/v1/auth/login', {
        email,
        password: 'password'
      });
      
      const { token, user } = response.data.data;
      localStorage.setItem('ltms_token', token);
      localStorage.setItem('ltms_role', selectedRole);
      
      dispatch(setRole(selectedRole));
      dispatch(setUser(user));
      
      // Auto-extract the driverId from the backend user token response!
      const finalDriverId = user.driverId || driverId;
      
      if (selectedRole === 'Driver' && finalDriverId) {
        localStorage.setItem('ltms_driver_id', finalDriverId);
        dispatch(setActiveDriverId(finalDriverId));
      } else {
        localStorage.removeItem('ltms_driver_id');
      }

      if (selectedRole === 'Driver') {
        navigate('/driver-trip');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      setErrorMsg(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriverRoleClick = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const apiClient = (await import('../../services/api')).default;
      const response = await apiClient.get('/api/v1/demo/drivers');
      const list = response.data?.data || response.data || [];
      setDriversList(list);
      setShowDrivers(true);
    } catch (error) {
      setErrorMsg('Failed to load drivers data. Logging in with default driver.');
      // Fallback: log in with default driver
      handleRoleLogin('Driver');
    } finally {
      setIsLoading(false);
    }
  };

  const loginRoles = [
    { name: 'Super Admin', desc: 'Full system access & reports access', color: 'border-indigo-500/30 hover:border-indigo-400 bg-indigo-500/5' },
    { name: 'Operations Manager', desc: 'Asset tracking & customer management', color: 'border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/5' },
    { name: 'Dispatcher', desc: 'Order placement & trip scheduling', color: 'border-sky-500/30 hover:border-sky-400 bg-sky-500/5' },
    { name: 'Finance Manager', desc: 'Trip pricing, margins & payments ledger', color: 'border-amber-500/30 hover:border-amber-400 bg-amber-500/5' },
  ];

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background glowing ambient light blobs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full glass-panel-glow rounded-2xl p-8 shadow-2xl relative z-10 space-y-6"
      >
        {/* Header Icon & Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-accent-indigo mb-2">
            <Truck size={36} className="animate-pulse" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-slate-100">
            Logistics TMS Login
          </h1>
          <p className="text-xs text-slate-400">
            Enterprise Transport Operations Management Suite
          </p>
        </div>

        {/* Credentials Bypass Card */}
        <div className="bg-slate-950 border border-slate-850 rounded-xl p-4 flex gap-3 items-start">
          <Key className="text-accent-indigo mt-0.5" size={16} />
          <div className="text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Demonstration Bypass Enabled</span>
            <p>Select any credential profile below to log in immediately without credentials check.</p>
          </div>
        </div>

        {showDrivers ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <button 
                onClick={() => setShowDrivers(false)} 
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <ArrowLeft size={16} />
              </button>
              <h3 className="text-sm font-bold text-slate-200">Select Demo Driver</h3>
            </div>
            
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {driversList.map((drv) => (
                <button
                  key={drv.id}
                  onClick={() => handleRoleLogin('Driver', drv.id)}
                  className="w-full border border-slate-800 hover:border-slate-700 bg-slate-950/60 rounded-xl p-3 text-left transition-all hover:bg-slate-900/60 flex flex-col gap-1 cursor-pointer"
                >
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs font-bold text-slate-200">{drv.name}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      drv.status === 'Available' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                    }`}>{drv.status}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-0.5">
                    <p className="flex items-center gap-1"><Phone size={10} /> {drv.mobile}</p>
                    <p>License: {drv.license}</p>
                    {drv.assignedVehicle && <p>Vehicle: {drv.assignedVehicle}</p>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Roles List Selection */
          <div className="space-y-2.5 pt-2">
            {loginRoles.map((role) => (
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                key={role.name}
                onClick={() => handleRoleLogin(role.name)}
                className={`w-full border rounded-xl p-3 text-left transition-all hover:bg-slate-800/40 flex items-center justify-between cursor-pointer ${role.color}`}
              >
                <div>
                  <span className="text-xs font-bold text-slate-200 block">{role.name}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{role.desc}</span>
                </div>
                <div className="p-1 rounded-full bg-slate-900 border border-slate-850 text-slate-600">
                  <Check size={10} className="stroke-[3px]" />
                </div>
              </motion.button>
            ))}
            
            {/* Separate Driver option that triggers sub-menu */}
            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={handleDriverRoleClick}
              className="w-full border border-rose-500/30 hover:border-rose-400 bg-rose-500/5 rounded-xl p-3 text-left transition-all hover:bg-slate-800/40 flex items-center justify-between cursor-pointer"
            >
              <div>
                <span className="text-xs font-bold text-slate-200 block">Driver Simulator</span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Select and simulate real-time trips of any seeded driver</span>
              </div>
              <div className="p-1 rounded-full bg-slate-900 border border-slate-850 text-slate-600">
                <Users size={10} />
              </div>
            </motion.button>
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/50 rounded-lg p-3 text-center">
            <span className="text-sm font-semibold text-rose-400">{errorMsg}</span>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center text-accent-indigo">
            <span className="text-sm font-semibold animate-pulse">Authenticating...</span>
          </div>
        )}

        {/* Version label */}
        <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none pt-4">
          Vendor Console • v2.5.4
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
