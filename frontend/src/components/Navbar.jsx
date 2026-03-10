import React from 'react';
import { MessageSquare, ChevronRight, Clock, Sparkles } from 'lucide-react';

const Navbar = () => {
  return (
    <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-gray-200 w-full">
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center justify-center p-1.5 border border-gray-200 rounded-md text-gray-400">
          <MessageSquare size={16} />
        </div>
        
        <span className="font-semibold text-slate-800">Workspace</span>
        <ChevronRight size={16} className="text-gray-300" />
        <span className="text-gray-500">Default Project</span>
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-100 focus:outline-none">
          <Clock size={20} />
        </button>
        
        <button className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl hover:bg-gray-800 transition-colors text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black">
          <Sparkles size={16} />
          New Orchestration
        </button>
      </div>
    </header>
  );
};

export default Navbar;