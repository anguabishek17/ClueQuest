import React from 'react';

export const ECEChipMotif: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {/* Background Circuit Grid */}
      <div className="absolute inset-0 bg-tech-grid opacity-30" />

      {/* Subtle Glowing PCB Traces */}
      <svg
        className="absolute top-0 right-0 w-full max-w-2xl h-96 opacity-20 text-cyan-400 stroke-current"
        viewBox="0 0 600 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M50 0 V120 H180 V240 H360 V180 H500 V300" strokeWidth="1.5" strokeDasharray="6 4" />
        <path d="M120 0 V60 H280 V150 H450 V280" strokeWidth="1" />
        <path d="M0 180 H140 V320 H320 V380 H600" strokeWidth="1.5" />
        
        {/* Solder Nodes */}
        <circle cx="180" cy="120" r="4" fill="#00F2FE" />
        <circle cx="360" cy="240" r="4" fill="#00F2FE" />
        <circle cx="280" cy="150" r="3" fill="#10B981" />
        <circle cx="140" cy="180" r="4" fill="#3B82F6" />
        <circle cx="320" cy="320" r="4" fill="#00F2FE" />
      </svg>

      <svg
        className="absolute bottom-0 left-0 w-full max-w-xl h-80 opacity-15 text-blue-500 stroke-current"
        viewBox="0 0 500 350"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 250 H120 V140 H260 V220 H400 V80 H500" strokeWidth="1.5" />
        <circle cx="120" cy="250" r="4" fill="#2563EB" />
        <circle cx="260" cy="140" r="4" fill="#00F2FE" />
        <circle cx="400" cy="220" r="3" fill="#10B981" />
      </svg>
    </div>
  );
};
