import React, { useState } from 'react';
import { Calendar, User, Tag } from 'lucide-react';
import { mockNews } from '../../data/mockData';

export function News() {
  const [filter, setFilter] = useState<'all' | 'announcement' | 'news' | 'tournament'>('all');
  
  const filteredNews = mockNews.filter(news => 
    filter === 'all' || news.category === filter
  );

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'tournament': return 'bg-orange-100 text-orange-800';
      case 'announcement': return 'bg-red-100 text-red-800';
      case 'news': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">News & Updates</h1>
        <p className="text-gray-600">Stay up to date with the latest community news</p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {['all', 'announcement', 'news', 'tournament'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab as any)}
              className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                filter === tab
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* News List */}
      <div className="space-y-6">
        {filteredNews.map((news) => (
          <article key={news.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{news.title}</h2>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <User size={16} className="mr-1" />
                      {news.author}
                    </div>
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {new Date(news.publishDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {news.featured && (
                    <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                      Featured
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize flex items-center ${getCategoryColor(news.category)}`}>
                    <Tag size={12} className="mr-1" />
                    {news.category}
                  </span>
                </div>
              </div>
              
              <p className="text-gray-700 leading-relaxed">{news.content}</p>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button className="text-blue-600 hover:text-blue-800 font-medium">
                  Read more →
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}