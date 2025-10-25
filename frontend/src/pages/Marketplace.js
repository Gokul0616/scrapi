import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Search, Star, Play, Copy, Award, TrendingUp, 
  Filter, X, DollarSign, Lock
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Marketplace = () => {
  const navigate = useNavigate();
  const [actors, setActors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  const categories = [
    'All Categories',
    'Maps & Location',
    'E-commerce',
    'Social Media',
    'API',
    'General',
    'Finance',
    'Real Estate'
  ];

  useEffect(() => {
    fetchMarketplaceActors();
  }, [selectedCategory, showFeaturedOnly]);

  const fetchMarketplaceActors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `${API}/marketplace`;
      const params = [];
      
      if (selectedCategory && selectedCategory !== 'All Categories') {
        params.push(`category=${encodeURIComponent(selectedCategory)}`);
      }
      if (showFeaturedOnly) {
        params.push('featured=true');
      }
      if (searchQuery) {
        params.push(`search=${encodeURIComponent(searchQuery)}`);
      }
      
      if (params.length > 0) {
        url += '?' + params.join('&');
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setActors(response.data);
    } catch (error) {
      console.error('Failed to fetch marketplace actors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load marketplace',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFork = async (actorId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/actors/${actorId}/fork`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({
        title: 'Success',
        description: 'Scraper cloned to your workspace!'
      });
      
      // Navigate to my scrapers after a brief delay
      setTimeout(() => {
        navigate('/my-scrapers');
      }, 1500);
    } catch (error) {
      console.error('Failed to fork actor:', error);
      toast({
        title: 'Error',
        description: 'Failed to clone scraper',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = () => {
    fetchMarketplaceActors();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🛍️</div>
          <p className="text-gray-600">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                Scraper Marketplace
                <Badge variant="secondary" className="text-sm">
                  {actors.length} Scrapers
                </Badge>
              </h1>
              <p className="text-gray-500 mt-1">Discover and use pre-built scrapers from the community</p>
            </div>
            <Button
              onClick={() => navigate('/create-scraper')}
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black"
            >
              Publish Your Scraper
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search scrapers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4"
              />
            </div>
            <Button onClick={handleSearch} variant="outline">
              Search
            </Button>
          </div>

          {/* Category Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category === 'All Categories' ? '' : category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  (category === 'All Categories' && !selectedCategory) || selectedCategory === category
                    ? 'bg-gray-800 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Filter Toggle */}
          <div className="mt-4 flex items-center gap-4">
            <button
              onClick={() => setShowFeaturedOnly(!showFeaturedOnly)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                showFeaturedOnly
                  ? 'bg-yellow-50 border-yellow-300 text-yellow-800'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
              }`}
            >
              <Award className="w-4 h-4" />
              Featured Only
              {showFeaturedOnly && <X className="w-4 h-4" onClick={(e) => {
                e.stopPropagation();
                setShowFeaturedOnly(false);
              }} />}
            </button>

            {(selectedCategory || showFeaturedOnly || searchQuery) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedCategory('');
                  setShowFeaturedOnly(false);
                  setSearchQuery('');
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {actors.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No scrapers found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters or search query</p>
            <Button
              onClick={() => {
                setSelectedCategory('');
                setShowFeaturedOnly(false);
                setSearchQuery('');
              }}
              variant="outline"
            >
              Clear All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {actors.map((actor) => (
              <div
                key={actor.id}
                className="bg-white border rounded-lg overflow-hidden hover:shadow-xl transition-all transform hover:-translate-y-1"
              >
                {/* Actor Header with Gradient */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 text-white">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-5xl">{actor.icon}</div>
                    <div className="flex flex-col gap-2 items-end">
                      {actor.is_verified && (
                        <Badge className="bg-blue-500 text-white border-0">
                          <Award className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {actor.is_featured && (
                        <Badge className="bg-yellow-500 text-white border-0">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{actor.name}</h3>
                  <div className="flex items-center gap-2 text-sm opacity-90">
                    <span>by {actor.author_name || 'Anonymous'}</span>
                  </div>
                </div>

                {/* Actor Body */}
                <div className="p-6">
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {actor.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b">
                    <div>
                      <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
                        <TrendingUp className="w-3 h-3" />
                        Runs
                      </div>
                      <div className="font-bold text-gray-900">{actor.runs_count || 0}</div>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-gray-600 text-xs mb-1">
                        <Star className="w-3 h-3" />
                        Rating
                      </div>
                      <div className="font-bold text-gray-900">
                        {actor.rating > 0 ? `${actor.rating.toFixed(1)}/5` : 'New'}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="outline">{actor.category}</Badge>
                    {actor.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                    {actor.tags?.length > 2 && (
                      <Badge variant="secondary">+{actor.tags.length - 2}</Badge>
                    )}
                  </div>

                  {/* Pricing Badge */}
                  {actor.monetization_enabled ? (
                    <div className="mb-4">
                      <Badge className="bg-green-100 text-green-800">
                        <DollarSign className="w-3 h-3 mr-1" />
                        Paid
                      </Badge>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Badge className="bg-gray-100 text-gray-800">
                        Free
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => navigate(`/actor/${actor.id}`)}
                      className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black"
                      size="sm"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Run
                    </Button>
                    <Button
                      onClick={() => handleFork(actor.id)}
                      size="sm"
                      variant="outline"
                      title="Clone to your workspace"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Monetization Coming Soon */}
                  {actor.visibility === 'public' && !actor.monetization_enabled && (
                    <div className="mt-4 text-xs text-gray-500 italic flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Monetization coming soon
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
