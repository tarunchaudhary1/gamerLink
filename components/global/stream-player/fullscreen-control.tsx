"use client";
import { Maximize, Minimize } from "lucide-react";
interface FullScreenControlProps {
  isFullScreen: boolean;
  onToggle: () => void;
}

export const FullScreenControl = ({
  isFullScreen,
  onToggle,
}: FullScreenControlProps) => {
  const Icon = isFullScreen ? Minimize : Maximize;

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={onToggle}
        className="text-white p-1.5 hover:bg-white/10 rounded-lg"
      >
        <Icon className="h-5 w-5" />
      </button>
    </div>
  );
};
