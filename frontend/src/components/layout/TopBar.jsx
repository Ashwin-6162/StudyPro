import useStore from '../../store/useStore';
import { FileCode2, Info, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const activeDocument = useStore((state) => state.activeDocument);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-border bg-black/10 backdrop-blur-md flex items-center px-8 justify-between sticky top-0 z-10">
      <div className="flex items-center space-x-4">
        {activeDocument ? (
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-muted-foreground">Active Context:</span>
            <span className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/20 font-medium flex items-center space-x-2">
              <FileCode2 className="w-4 h-4" />
              <span>{activeDocument.original_filename}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>No document selected. Go to Dashboard to upload or select a document.</span>
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {user ? (
          <div className="flex items-center space-x-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <span className="text-sm font-medium text-zinc-300">{user.name || 'User'}</span>
            {user.picture ? (
              <img src={user.picture} alt="Profile" className="w-7 h-7 rounded-full border border-white/20" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-primary to-purple-500 shadow-lg shadow-primary/20 flex items-center justify-center text-xs font-bold text-white">
                {(user.name || 'U')[0].toUpperCase()}
              </div>
            )}
            <button 
              onClick={handleLogout}
              className="ml-2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-purple-500 shadow-lg shadow-primary/20"></div>
        )}
      </div>
    </header>
  );
}
