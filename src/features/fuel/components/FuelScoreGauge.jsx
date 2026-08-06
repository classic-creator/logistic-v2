import React, { useEffect, useState } from 'react';

export const FuelScoreGauge = ({ score, size = 'md', label }) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timeout);
  }, [score]);

  const sizeMap = {
    sm: { radius: 30, strokeWidth: 4, fontSize: 'text-sm' },
    md: { radius: 50, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { radius: 80, strokeWidth: 12, fontSize: 'text-4xl' },
  };

  const { radius, strokeWidth, fontSize } = sizeMap[size];
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  let color = 'text-rose-500';
  if (score >= 70) color = 'text-emerald-500';
  else if (score >= 40) color = 'text-amber-500';

  return (
    <div className="flex flex-col items-center justify-center relative">
      <svg
        width={radius * 2 + strokeWidth * 2}
        height={radius * 2 + strokeWidth * 2}
        className="transform -rotate-90"
      >
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-slate-800"
        />
        <circle
          cx={radius + strokeWidth}
          cy={radius + strokeWidth}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`${fontSize} font-bold font-mono text-slate-100`}>
          {animatedScore}
        </span>
      </div>
      {label && <span className="mt-2 text-xs text-slate-400 font-semibold">{label}</span>}
    </div>
  );
};

export default FuelScoreGauge;
