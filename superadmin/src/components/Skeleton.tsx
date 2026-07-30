import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full" }) => {
  return (
    <div
      className={`bg-slate-800/60 rounded-lg animate-pulse border border-slate-700/30 ${className}`}
    />
  );
};
