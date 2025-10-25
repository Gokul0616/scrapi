import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Users, TrendingUp, Filter, ChevronDown } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Store() {
  const navigate = useNavigate();
  const [actors, setActors] = useState([]);
  const [filteredActors, setFilteredActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories', count: 0 },
    { id: 'maps', name: '🗺️ Maps & Location', count: 0 },
    { id: 'business', name: '💼 Business & LinkedIn', count: 0 },
    { id: 'ecommerce', name: '🛒 E-commerce', count: 0 },
    { id: 'social', name: '📱 Social Media', count: 0 },
    { id: 'news', name: '📰 News & Content', count: 0 },
    { id: 'realestate', name: '🏢 Real Estate', count: 0 }
  ];

  useEffect(() => {
    fetchActors();
  }, []);

  useEffect(() => {
    filterActors();
  }, [searchQuery, selectedCategory, actors]);

  const fetchActors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/actors`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      setActors(data);
      setFilteredActors(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching actors:', error);
      setLoading(false);
    }
  };

  const filterActors = () => {
    let filtered = [...actors];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(actor =>
        actor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        actor.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(actor =>
        actor.category?.toLowerCase().includes(selectedCategory)
      );
    }

    setFilteredActors(filtered);
  };

  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return actors.length;
    return actors.filter(actor =>
      actor.category?.toLowerCase().includes(categoryId)
    ).length;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🏪 Actor Store</h1>
          <p className="text-gray-600">Discover ready-made scrapers for your data extraction needs</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 mb-8">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search actors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:border-gray-900 transition-colors bg-white"
            >
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="text-gray-700">
                {categories.find(c => c.id === selectedCategory)?.name || 'All Categories'}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-600" />
            </button>

            {showCategoryDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between ${
                      selectedCategory === category.id ? 'bg-gray-50 font-medium' : ''
                    }`}
                  >
                    <span>{category.name}</span>
                    <span className="text-sm text-gray-500">({getCategoryCount(category.id)})</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Featured Actors Section */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📌 Featured Actors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredActors.slice(0, 3).map((actor) => (
                <div
                  key={actor.id}
                  onClick={() => navigate(`/actor/${actor.id}`)}
                  className="border border-gray-200 rounded-lg p-6 hover:border-gray-900 hover:shadow-lg transition-all cursor-pointer bg-white"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-3xl">
                      {actor.icon || '🗺️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-lg">{actor.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{actor.rating || '4.8'}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                        <span className="text-sm text-gray-500">{actor.runs_count || '61K'} runs</span>
                      </div>
                    </div>
                  </div>
                  <button className="w-full py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium">
                    Try Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Actors Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {searchQuery ? `Search Results (${filteredActors.length})` : 
               selectedCategory !== 'all' ? categories.find(c => c.id === selectedCategory)?.name :
               '🔥 All Available Actors'}
            </h2>
            <span className="text-sm text-gray-500">{filteredActors.length} actors</span>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : filteredActors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredActors.map((actor) => (
                <div
                  key={actor.id}
                  onClick={() => navigate(`/actor/${actor.id}`)}
                  className="border border-gray-200 rounded-lg p-6 hover:border-gray-900 hover:shadow-lg transition-all cursor-pointer bg-white group"
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                      {actor.icon || '🗺️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700">
                        {actor.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">{actor.type || 'scraper'}</p>
                      {actor.is_verified && (
                        <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[3.6rem]">
                    {actor.description || 'Extract data efficiently with this powerful scraper.'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-gray-600 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{actor.runs_count || '1.1K'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{actor.rating || '4.8'}</span>
                      <span className="text-gray-400">({actor.reviews_count || '8'})</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/actor/${actor.id}`);
                    }}
                    className="w-full mt-4 py-2 bg-white border border-gray-900 text-gray-900 rounded-lg hover:bg-gray-900 hover:text-white transition-all font-medium"
                  >
                    Try Actor
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-gray-500 mb-2">No actors found</p>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default Store;
