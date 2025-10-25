import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  Search, Edit, Trash2, Play, Copy, Eye, 
  Plus, Clock, CheckCircle, Archive, Rocket
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MyScrapers = () => {
  const navigate = useNavigate();
  const [scrapers, setScrapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const tabs = [
    { id: 'all', label: 'All', icon: Eye },
    { id: 'draft', label: 'Draft', icon: Clock },
    { id: 'published', label: 'Published', icon: CheckCircle },
    { id: 'archived', label: 'Archived', icon: Archive }
  ];

  useEffect(() => {
    fetchScrapers();
  }, [activeTab]);

  const fetchScrapers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const statusParam = activeTab === 'all' ? '' : `?status=${activeTab}`;
      const response = await axios.get(`${API}/actors/my-scrapers${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScrapers(response.data.actors || []);
    } catch (error) {
      console.error('Failed to fetch scrapers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load scrapers',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (scraperId) => {
    if (!window.confirm('Are you sure you want to delete this scraper?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/actors/${scraperId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Success',
        description: 'Scraper deleted successfully'
      });
      fetchScrapers();
    } catch (error) {
      console.error('Failed to delete scraper:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete scraper',
        variant: 'destructive'
      });
    }
  };

  const handleFork = async (scraperId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/actors/${scraperId}/fork`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Success',
        description: 'Scraper forked successfully'
      });
      fetchScrapers();
    } catch (error) {
      console.error('Failed to fork scraper:', error);
      toast({
        title: 'Error',
        description: 'Failed to fork scraper',
        variant: 'destructive'
      });
    }
  };

  // Enhanced search that handles various edge cases
  const filteredScrapers = scrapers.filter(scraper => {
    if (!searchQuery || searchQuery.trim() === '') {
      return true;
    }

    const query = searchQuery.toLowerCase().trim();
    const name = (scraper.name || '').toLowerCase();
    const description = (scraper.description || '').toLowerCase();
    const category = (scraper.category || '').toLowerCase();
    const tags = (scraper.tags || []).map(t => t.toLowerCase()).join(' ');

    // Search in name, description, category, and tags
    return name.includes(query) || 
           description.includes(query) || 
           category.includes(query) ||
           tags.includes(query);
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { color: 'bg-yellow-100 text-yellow-800', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      archived: { color: 'bg-gray-100 text-gray-800', label: 'Archived' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🕷️</div>
          <p className="text-gray-600">Loading your scrapers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Scrapers</h1>
              <p className="text-gray-600 mt-1">Manage your custom scrapers</p>
            </div>
            <Button
              onClick={() => navigate('/create-scraper')}
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Scraper
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gray-800 text-gray-900 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <Badge variant="secondary" className="ml-1">
                  {scrapers.filter(s => tab.id === 'all' || s.status === tab.id).length}
                </Badge>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="px-8 py-4 bg-gray-50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, description, category, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        {filteredScrapers.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery ? 'No scrapers found' : 'No scrapers yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? `No scrapers match "${searchQuery}". Try a different search term.`
                : 'Create your first custom scraper to get started'}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => navigate('/create-scraper')}
                className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Scraper
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredScrapers.map((scraper) => (
              <div
                key={scraper.id}
                className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{scraper.icon}</div>
                    {getStatusBadge(scraper.status)}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">{scraper.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {scraper.description}
                  </p>

                  <div className="flex gap-2 mb-4 flex-wrap">
                    <Badge variant="outline" className="text-xs">{scraper.category}</Badge>
                    <Badge variant="secondary" className="text-xs">{scraper.visibility}</Badge>
                    {scraper.tags && scraper.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Clock className="w-3 h-3" />
                    <span>{scraper.runs_count || 0} runs</span>
                  </div>

                  <div className="flex gap-2">
                    {scraper.status === 'published' ? (
                      <Button
                        onClick={() => navigate(`/actors/${scraper.id}`)}
                        size="sm"
                        className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black"
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Run
                      </Button>
                    ) : (
                      <Button
                        onClick={() => navigate(`/create-scraper?id=${scraper.id}`)}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    )}
                    <Button
                      onClick={() => handleFork(scraper.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(scraper.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyScrapers;