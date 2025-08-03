import React, { useState } from 'react';
import { Database, Table, Users, Trophy, Calendar, BarChart3, Download, RefreshCw } from 'lucide-react';
import { mockTournaments, mockMatches, mockNews } from '../../data/mockData';

interface TableInfo {
  name: string;
  records: number;
  icon: React.ReactNode;
  description: string;
}

export function DatabaseView() {
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const tables: TableInfo[] = [
    { name: 'users', records: 156, icon: <Users size={16} />, description: 'User accounts and profiles' },
    { name: 'tournaments', records: mockTournaments.length, icon: <Trophy size={16} />, description: 'Tournament information' },
    { name: 'matches', records: mockMatches.length, icon: <Calendar size={16} />, description: 'Match results and schedules' },
    { name: 'news', records: mockNews.length, icon: <BarChart3 size={16} />, description: 'News and announcements' },
    { name: 'registrations', records: 89, icon: <Table size={16} />, description: 'Tournament registrations' },
    { name: 'rankings', records: 45, icon: <BarChart3 size={16} />, description: 'Player rankings and stats' }
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleExport = (tableName: string) => {
    // Simulate export functionality
    alert(`Exporting ${tableName} table data...`);
  };

  const sampleData = {
    users: [
      { id: '1', username: 'BladeSpinner', email: 'user@beyblade.com', role: 'user', created_at: '2024-01-15' },
      { id: '2', username: 'TechOfficer', email: 'officer@beyblade.com', role: 'technical_officer', created_at: '2023-11-20' },
      { id: '3', username: 'AdminMaster', email: 'admin@beyblade.com', role: 'admin', created_at: '2023-08-10' },
    ],
    tournaments: mockTournaments.slice(0, 3),
    matches: mockMatches.slice(0, 3),
    news: mockNews.slice(0, 3),
    registrations: [
      { id: '1', user_id: '1', tournament_id: '1', registered_at: '2024-01-16', status: 'confirmed' },
      { id: '2', user_id: '2', tournament_id: '1', registered_at: '2024-01-17', status: 'confirmed' },
      { id: '3', user_id: '3', tournament_id: '2', registered_at: '2024-01-18', status: 'pending' },
    ],
    rankings: [
      { id: '1', user_id: '1', rank: 1, points: 1250, wins: 15, losses: 3 },
      { id: '2', user_id: '2', rank: 2, points: 1180, wins: 12, losses: 4 },
      { id: '3', user_id: '3', rank: 3, points: 1120, wins: 11, losses: 5 },
    ]
  };

  const currentData = sampleData[selectedTable as keyof typeof sampleData] || [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Database Management</h1>
          <p className="text-gray-600">Monitor and manage application data</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => handleExport(selectedTable)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Tables List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Database size={20} className="mr-2" />
              Tables
            </h2>
            <div className="space-y-2">
              {tables.map((table) => (
                <button
                  key={table.name}
                  onClick={() => setSelectedTable(table.name)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedTable === table.name
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      {table.icon}
                      <span className="font-medium">{table.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{table.records}</span>
                  </div>
                  <p className="text-xs text-gray-600">{table.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Database Stats */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Database Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Records</span>
                <span className="font-bold">{tables.reduce((sum, table) => sum + table.records, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tables</span>
                <span className="font-bold">{tables.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Storage</span>
                <span className="font-bold">2.4 MB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Table Data */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 capitalize">
                  {selectedTable} Table
                </h2>
                <span className="text-sm text-gray-500">
                  {tables.find(t => t.name === selectedTable)?.records} records
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {currentData.length > 0 && Object.keys(currentData[0]).map((key) => (
                      <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {key.replace('_', ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentData.map((row: any, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {currentData.length === 0 && (
              <div className="text-center py-12">
                <Database size={48} className="mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No data available for this table</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}