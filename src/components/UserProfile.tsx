import React from 'react';
import { LogOut, RotateCcw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile: React.FC = () => {
  const { user, logout, switchRole } = useAuth();

  if (!user) return null;

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-600 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-sm">
            {user.name.split(' ').map(n => n[0]).join('')}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{user.name}</p>
          <p className="text-sm text-gray-500 capitalize">{user.role}</p>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
        </div>
      </div>
      
      {user.specialization && (
        <p className="text-xs text-gray-500 mb-3">{user.specialization}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={switchRole}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <RotateCcw size={14} />
          Switch Role
        </button>
        <button
          onClick={logout}
          className="flex items-center justify-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
};

export default UserProfile;