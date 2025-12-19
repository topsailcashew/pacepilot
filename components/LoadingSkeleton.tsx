import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-white/5 rounded ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
};

export const TaskSkeleton: React.FC = () => {
  return (
    <div className="bg-prussianblue border border-white/5 rounded-xl p-4 mb-3">
      <div className="flex items-start gap-3">
        <Skeleton className="w-5 h-5 rounded-md mt-0.5" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
    </div>
  );
};

export const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="bg-prussianblue border border-white/5 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-6 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-2 w-full rounded-full" />
    </div>
  );
};

export const CalendarEventSkeleton: React.FC = () => {
  return (
    <div className="bg-prussianblue border border-white/5 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-3">
        <Skeleton className="w-3 h-3 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
};

export const DailyReportSkeleton: React.FC = () => {
  return (
    <div className="bg-prussianblue border border-white/5 rounded-xl p-6 mb-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="mt-4 pt-4 border-t border-white/5">
        <Skeleton className="h-20 w-full rounded-lg" />
      </div>
    </div>
  );
};

export const StatCardSkeleton: React.FC = () => {
  return (
    <div className="bg-prussianblue border border-white/5 rounded-xl p-6">
      <Skeleton className="h-4 w-24 mb-3" />
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
};

// Add shimmer animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;
document.head.appendChild(style);

export default Skeleton;
