"use client";

import { useState, useCallback } from "react";

interface Props {
  onSelect: (value: number) => void;
  initial?: number;
  label?: string;
  className?: string;
}

const LEVELS = [
  { value: 1, label: "None", color: "bg-accent/20 text-accent" },
  { value: 2, label: "Faint", color: "bg-accent/25 text-accent" },
  { value: 3, label: "Mild", color: "bg-accent/30 text-accent" },
  { value: 4, label: "Noticeable", color: "bg-accent/50 text-black" },
  { value: 5, label: "Moderate", color: "bg-accent text-black" },
  { value: 6, label: "Strong", color: "bg-warning/30 text-warning" },
  { value: 7, label: "Intense", color: "bg-warning/50 text-black" },
  { value: 8, label: "Urgent", color: "bg-warning text-black" },
  { value: 9, label: "Overpowering", color: "bg-danger/50 text-white" },
  { value: 10, label: "Crisis", color: "bg-danger text-white" },
];

export default function UrgeDial({ onSelect, initial, label, className = "" }: Props) {
  const [selected, setSelected] = useState(initial || 0);
  const [hovered, setHovered] = useState(0);

  const handleSelect = useCallback((v: number) => {
    setSelected(v);
    onSelect(v);
  }, [onSelect]);

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <p className="text-sm font-medium text-text-secondary text-center">{label}</p>
      )}
      <div className="flex gap-1 justify-center">
        {LEVELS.map((level) => {
          const active = selected >= level.value;
          const hover = hovered >= level.value;
          return (
            <button
              key={level.value}
              onClick={() => handleSelect(level.value)}
              onMouseEnter={() => setHovered(level.value)}
              onMouseLeave={() => setHovered(0)}
              className={`relative flex-1 max-w-[36px] h-16 rounded-lg transition-all duration-150 flex flex-col items-center justify-end pb-1 ${
                hover ? level.color : active ? level.color : "bg-bg-elevated text-text-tertiary/40"
              }`}
              aria-label={`${level.value} - ${level.label}`}
            >
              <span className="text-[10px] font-bold leading-none">{level.value}</span>
            </button>
          );
        })}
      </div>
      {selected > 0 && (
        <p className="text-center text-sm font-medium text-text-primary animate-fade-in">
          {LEVELS[selected - 1]?.label || ""}
        </p>
      )}
      <div className="flex justify-between text-[9px] text-text-tertiary/50 px-0.5 -mt-1">
        <span>Calm</span>
        <span>Crisis</span>
      </div>
    </div>
  );
}
