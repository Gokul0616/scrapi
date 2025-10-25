import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Users, TrendingUp } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

function Store() {
  const navigate = useNavigate();
  const [actors, setActors] = useState([]);
  const [filteredActors, setFilteredActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All' },
    { id: 'social', name: 'Social media' },
    { id: 'ai', name: 'AI' },
    { id: 'agents', name: 'Agents' },
    { id: 'lead', name: 'Lead generation' },
    { id: 'ecommerce', name: 'E-commerce' },
    { id: 'seo', name: 'SEO tools' },
    { id: 'jobs', name: 'Jobs' },
    { id: 'mcp', name: 'MCP servers' },
    { id: 'news', name: 'News' },
    { id: 'realestate', name: 'Real estate' },
    { id: 'developer', name: 'Developer tools' },
    { id: 'travel', name: 'Travel' },
    { id: 'videos', name: 'Videos' },
    { id: 'automation', name: 'Automation' },
    { id: 'integrations', name: 'Integrations' },
    { id: 'opensource', name: 'Open source' },
    { id: 'other', name: 'Other' }
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Apify Store</h1>
          <p className="text-lg text-gray-600">Discover and use ready-made actors for your data extraction needs</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for Actors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-base"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>


        {/* All Actors Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Actors</h2>
            <div className="flex items-center gap-4">
              <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1">
                View all →
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : filteredActors.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredActors.map((actor) => (
                <div
                  key={actor.id}
                  onClick={() => navigate(`/actor/${actor.id}`)}
                  className="border border-gray-200 rounded-xl p-5 hover:border-gray-400 hover:shadow-md transition-all cursor-pointer bg-white group"
                >
                  {/* Actor Icon and Info */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      {actor.icon || '🗺️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-gray-700 text-base leading-tight">
                        {actor.name}
                      </h3>
                      <p className="text-xs text-gray-500">{actor.author || 'compass/crawler-google-places'}</p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3 min-h-[3.6rem] leading-relaxed">
                    {actor.description || 'Extract data from thousands of Google Maps locations and businesses.'}
                  </p>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span className="font-medium">{actor.runs_count || '189K'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{actor.rating || '4.8'}</span>
                      <span className="text-gray-400">({actor.reviews_count || '337'})</span>
                    </div>
                  </div>
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
