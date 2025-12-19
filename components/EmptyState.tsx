import React from 'react';
import { CheckSquare, FolderKanban, Calendar, Repeat, BarChart3, Zap, Plus } from 'lucide-react';

interface EmptyStateProps {
  type: 'tasks' | 'projects' | 'calendar' | 'recurring' | 'reports' | 'search';
  onAction?: () => void;
  actionLabel?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction, actionLabel }) => {
  const configs = {
    tasks: {
      icon: CheckSquare,
      title: 'No tasks yet',
      description: 'Start by adding your first task and take control of your day',
      gradient: 'from-pilot-orange/20 to-pilot-orange/5',
      iconColor: 'text-pilot-orange',
    },
    projects: {
      icon: FolderKanban,
      title: 'No projects',
      description: 'Create a project to organize your tasks and boost productivity',
      gradient: 'from-blue-500/20 to-blue-500/5',
      iconColor: 'text-blue-400',
    },
    calendar: {
      icon: Calendar,
      title: 'No events scheduled',
      description: 'Add events to your calendar to stay on top of your schedule',
      gradient: 'from-purple-500/20 to-purple-500/5',
      iconColor: 'text-purple-400',
    },
    recurring: {
      icon: Repeat,
      title: 'No recurring tasks',
      description: 'Set up recurring tasks for habits you want to build',
      gradient: 'from-green-500/20 to-green-500/5',
      iconColor: 'text-green-400',
    },
    reports: {
      icon: BarChart3,
      title: 'No reports yet',
      description: 'Complete some tasks to generate your first daily report',
      gradient: 'from-yellow-500/20 to-yellow-500/5',
      iconColor: 'text-yellow-400',
    },
    search: {
      icon: Zap,
      title: 'No results found',
      description: 'Try adjusting your search or filters to find what you\'re looking for',
      gradient: 'from-white/10 to-white/5',
      iconColor: 'text-white/40',
    },
  };

  const config = configs[type];
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Animated background circle */}
      <div className={`relative mb-8`}>
        <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full blur-2xl opacity-50 animate-pulse`}
             style={{ width: '200px', height: '200px', margin: '-50px' }} />
        <div className={`relative bg-gradient-to-br ${config.gradient} rounded-full p-8 border border-white/10`}>
          <Icon size={64} className={`${config.iconColor} animate-float`} />
        </div>
      </div>

      {/* Content */}
      <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">
        {config.title}
      </h3>
      <p className="text-white/50 mb-8 max-w-md text-sm leading-relaxed">
        {config.description}
      </p>

      {/* Action button */}
      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="flex items-center gap-2 px-6 py-3 bg-pilot-orange hover:bg-pilot-orange/90 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
          {actionLabel}
        </button>
      )}

      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-pilot-orange/30 rounded-full animate-ping"
             style={{ animationDelay: '0s', animationDuration: '3s' }} />
        <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-ping"
             style={{ animationDelay: '1s', animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 left-1/2 w-1 h-1 bg-pilot-orange/20 rounded-full animate-ping"
             style={{ animationDelay: '2s', animationDuration: '5s' }} />
      </div>
    </div>
  );
};

// Add float animation to global styles
const style = document.createElement('style');
style.textContent = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default EmptyState;
