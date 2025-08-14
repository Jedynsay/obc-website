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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        isOpen={isSidebarOpen} 
        currentView={currentView} 
        onViewChange={setCurrentView}
      />
      
      <div className={`flex flex-col min-h-screen flex-1 transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0'
      }`}>
        <Header 
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          isMenuOpen={isSidebarOpen}
        />
        
        <main className="flex-1">
          {renderCurrentView()}
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
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