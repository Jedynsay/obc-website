<div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
  {/* Overview */}
  <div>
    {isOpen && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Overview</p>}
    <ul className="space-y-1">
      {['dashboard', 'tournaments', 'analytics'].map((id) => {
        const item = menuItems.find(m => m.id === id)!;
        return (
          <li key={id}>
            <button
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-2 py-2 relative transition group
                ${currentView === item.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}
              `}
            >
              <div className="mr-3">{item.icon}</div>
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${currentView === item.id ? 'w-full' : ''}
                `}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </div>

  {/* Database */}
  <div>
    {isOpen && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Database</p>}
    <ul className="space-y-1">
      {['parts-database', 'inventory'].map((id) => {
        const item = menuItems.find(m => m.id === id)!;
        return (
          <li key={id}>
            <button
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-2 py-2 relative transition group
                ${currentView === item.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}
              `}
            >
              <div className="mr-3">{item.icon}</div>
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${currentView === item.id ? 'w-full' : ''}
                `}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </div>

  {/* Management */}
  <div>
    {isOpen && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Management</p>}
    <ul className="space-y-1">
      {['team-manager', 'community-manager', 'tournament-manager', 'user-management'].map((id) => {
        const item = menuItems.find(m => m.id === id)!;
        return (
          <li key={id}>
            <button
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-2 py-2 relative transition group
                ${currentView === item.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}
              `}
            >
              <div className="mr-3">{item.icon}</div>
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${currentView === item.id ? 'w-full' : ''}
                `}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </div>

  {/* Developer */}
  <div>
    {isOpen && <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Developer</p>}
    <ul className="space-y-1">
      {['database'].map((id) => {
        const item = menuItems.find(m => m.id === id)!;
        return (
          <li key={id}>
            <button
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-2 py-2 relative transition group
                ${currentView === item.id ? 'text-cyan-400' : 'text-slate-300 hover:text-cyan-400'}
              `}
            >
              <div className="mr-3">{item.icon}</div>
              {isOpen && <span className="ml-3 font-medium">{item.label}</span>}
              <div
                className={`absolute bottom-0 left-0 h-0.5 w-0 bg-gradient-to-r from-cyan-500 to-purple-500
                  group-hover:w-full transition-all duration-500
                  ${currentView === item.id ? 'w-full' : ''}
                `}
              />
            </button>
          </li>
        );
      })}
    </ul>
  </div>
</div>
