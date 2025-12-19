import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Layers, BarChart2, Calendar } from 'lucide-react';

const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: LayoutGrid, label: 'Planner', path: '/planner' },
    { icon: Layers, label: 'Projects', path: '/projects' },
    { icon: Calendar, label: 'Calendar', path: '/calendar' },
    { icon: BarChart2, label: 'Reports', path: '/reports' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-prussianblue border-t border-white/10 backdrop-blur-lg">
      <div className="flex items-center justify-around px-2 py-2 safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path ||
                          (item.path === '/projects' && location.pathname.startsWith('/projects'));

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 min-w-[64px] ${
                isActive
                  ? 'bg-pilot-orange text-white'
                  : 'text-white/40 active:bg-white/5'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-white mb-1' : 'text-white/40 mb-1'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isActive ? 'text-white' : 'text-white/50'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area spacer for phones with notches/home indicators */}
      <div className="h-safe-bottom bg-prussianblue"></div>
    </nav>
  );
};

export default MobileBottomNav;
