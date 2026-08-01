import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize2, Minimize2, X } from 'lucide-react';

// Card wrapper for charts with an optional fullscreen mode.
// `children` may be a render-prop receiving `isFullscreen` to adapt height.
export const ChartCard = ({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
  children,
}) => {
  const [fullscreen, setFullscreen] = useState(false);

  const body = typeof children === 'function' ? children(fullscreen) : children;

  return (
    <>
      <div
        className={`glass-panel rounded-xl p-5 border border-slate-800 flex flex-col transition-shadow ${
          fullscreen ? 'opacity-0 pointer-events-none absolute' : ''
        } ${className}`}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <div className="p-2 rounded-lg bg-slate-800/80 text-slate-400 flex-shrink-0">
                <Icon size={16} />
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-100 font-display truncate">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500 font-medium truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {actions}
            <button
              onClick={() => setFullscreen(true)}
              className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Expand chart"
            >
              <Maximize2 size={15} />
            </button>
          </div>
        </div>
        <div className="flex-1">{body}</div>
      </div>

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <button
                onClick={() => setFullscreen(false)}
                className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              >
                <Minimize2 size={15} />
                Exit Fullscreen
              </button>
            </div>
            <div className="w-full max-w-6xl max-h-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100 font-display">{title}</h3>
                  {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
                </div>
                <button
                  onClick={() => setFullscreen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="h-[70vh]">{typeof children === 'function' ? children(true) : children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChartCard;
