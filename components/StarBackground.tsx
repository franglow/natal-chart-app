
import React, { useMemo } from 'react';
import { Star } from '../types';

const StarBackground: React.FC = () => {
  const stars = useMemo<Star[]>(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3}px`,
      duration: `${3 + Math.random() * 7}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#050510] via-[#0a0a2a] to-[#050510]">
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            '--duration': star.duration,
          } as React.CSSProperties}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(66,33,105,0.2),transparent_70%)]"></div>
    </div>
  );
};

export default StarBackground;
