import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Zap,
  LayoutDashboard,
  TerminalSquare,
  History,
  Users,
  User,
  LogOut,
  Blocks,
  CalendarDays
} from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: 'Orchestration', icon: LayoutDashboard, path: '/' }, // Assuming Dashboard is your home
    { name: 'Agent Logs', icon: TerminalSquare, path: '/logs' },
    { name: 'Task History', icon: History, path: '/history' },
    { name: 'Global Calendar', icon: CalendarDays, path: '/calendar' },
    { name: 'Integrations', icon: Blocks, path: '/integrations' },
    { name: 'Team', icon: Users, path: '/team' },
    { name: 'My Profile', icon: User, path: '/profile' },
  ];

  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
      <div className="flex items-center gap-2 px-6 py-8">
        <div className="bg-black text-white p-1 rounded-md">
          <Zap size={20} fill="currentColor" />
        </div>
        <span className="text-xl font-bold tracking-tight">OrchestrAl</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                ? 'bg-black text-white shadow-md'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
            >
              <item.icon size={20} className={isActive ? 'text-white' : 'text-gray-400'} />
              <span className="font-medium text-sm">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200 flex-shrink-0">
            <span className="text-sm font-bold text-gray-700">PS</span>
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-gray-900 truncate">Priya Sharma</span>
            <span className="text-xs text-gray-500 truncate">Project Manager</span>
          </div>
        </div>

        <button className="flex items-center gap-3 text-gray-500 hover:text-gray-900 transition-colors w-full px-2">
          <LogOut size={20} className="text-gray-400" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;