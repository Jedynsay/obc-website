import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Views/Dashboard';
import { Tournaments } from './components/Views/Tournaments';
import { Analytics } from './components/Views/Analytics';
import { MatchTracker } from './components/Views/MatchTracker';
import { TournamentManager } from './components/Views/TournamentManager';
import { UserManagement } from './components/Views/UserManagement';
import { DatabaseView } from './components/Views/Database';
import { Inventory } from './components/Views/Inventory';
import { DeckBuilder } from './components/Views/DeckBuilder';
import { Settings } from './components/Views/Settings';

function AppContent() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />;
      case 'tournaments': return <Tournaments />;
      case 'inventory': return <Inventory />;
      case 'deck-builder': return <DeckBuilder />;
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
      <Sidebar 
        isOpen={isSidebarOpen} 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onToggle={toggleSidebar}
      />
      
      <div className={`${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-0'} transition-all duration-300`}>
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
      <AppContent />
    </AuthProvider>
  );
}

export default App;