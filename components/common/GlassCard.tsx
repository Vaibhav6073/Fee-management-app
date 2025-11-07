import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white/60 backdrop-blur-2xl border border-white/30 rounded-2xl shadow-lg shadow-black/5 p-6 md:p-8 ${className}`}>
      {children}
    </div>
  );
};

export default GlassCard;