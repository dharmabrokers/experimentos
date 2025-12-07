import React, { useEffect, useState } from 'react';

const Snowfall: React.FC = () => {
  const [flakes, setFlakes] = useState<number[]>([]);

  useEffect(() => {
    // Generate static flakes for hydration consistency
    setFlakes(Array.from({ length: 50 }, (_, i) => i));
  }, []);

  return (
    <div className="snow-container" aria-hidden="true">
      {flakes.map((i) => {
        const left = Math.random() * 100;
        const duration = Math.random() * 5 + 5; // 5-10s
        const delay = Math.random() * 5;
        const size = Math.random() * 10 + 5;
        const opacity = Math.random() * 0.5 + 0.3;

        return (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${left}%`,
              fontSize: `${size}px`,
              opacity: opacity,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          >
            ❄
          </div>
        );
      })}
    </div>
  );
};

export default Snowfall;
