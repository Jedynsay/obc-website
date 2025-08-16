import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { ConfirmationProvider } from './context/ConfirmationContext';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Views/Dashboard';
import { Tournaments } from './components/Views/Tournaments';
import { Analytics } from './components/Views/Analytics';
import MatchTracker from './components/Views/MatchTracker';
import { TournamentManager } from './components/Views/TournamentManager';
import { UserManagement } from './components/Views/UserManagement';
import { DatabaseView } from './components/Views/Database';
import { Inventory } from './components/Views/Inventory';
import { DeckBuilder } from './components/Views/DeckBuilder';
import { Settings } from './components/Views/Settings';
import { Menu } from 'lucide-react';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onViewChange={setCurrentView} />;
      case 'tournaments': return <Tournaments />;
      case 'inventory': return <Inventory />;
      case 'analytics': return <Analytics />;
      case 'match-tracker': return <MatchTracker />;
      case 'tournament-manager': return <TournamentManager />;
      case 'user-management': return <UserManagement />;
      case 'database': return <DatabaseView />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Global Hamburger Menu - Always Visible */}
      {!isSidebarOpen && (
        <button
          onClick={toggleSidebar}
          className={`fixed top-6 left-0 z-50 p-3 rounded-r-xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105 ${
            currentView === 'dashboard' 
              ? 'bg-slate-800/90 hover:bg-slate-700/90 text-white' 
              : 'bg-white/90 hover:bg-white text-gray-800 border border-gray-200'
          }`}
        >
          <Menu size={24} />
        </button>
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onToggle={toggleSidebar}
      />
      
      <div className="w-full">
        <main className="flex-1">
          {renderCurrentView()}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ConfirmationProvider>
        <AppContent />
      </ConfirmationProvider>
    </AuthProvider>
  );
}

export default App;