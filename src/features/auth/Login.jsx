import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setRole } from '../../redux/authSlice';
import { Shield, Truck, Key, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleRoleLogin = (selectedRole) => {
    dispatch(setRole(selectedRole));
    
    // Redirect drivers directly to their active mobile dashboard, admins to main dashboard
    if (selectedRole === 'Driver') {
      navigate('/driver-trip');
    } else {
      navigate('/dashboard');
    }
  };

  const loginRoles = [
    { name: 'Super Admin', desc: 'Full system access & reports access', color: 'border-indigo-500/30 hover:border-indigo-400 bg-indigo-500/5' },
    { name: 'Operations Manager', desc: 'Asset tracking & customer management', color: 'border-emerald-500/30 hover:border-emerald-400 bg-emerald-500/5' },
    { name: 'Dispatcher', desc: 'Order placement & trip scheduling', color: 'border-sky-500/30 hover:border-sky-400 bg-sky-500/5' },
    { name: 'Finance Manager', desc: 'Trip pricing, margins & payments ledger', color: 'border-amber-500/30 hover:border-amber-400 bg-amber-500/5' },
    { name: 'Driver', desc: 'Mobile active trip workflow simulator', color: 'border-rose-500/30 hover:border-rose-400 bg-rose-500/5' }
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

        {/* Roles List Selection */}
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
        </div>

        {/* Version label */}
        <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none pt-4">
          Vendor Console • v2.5.4
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
