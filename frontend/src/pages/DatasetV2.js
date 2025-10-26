import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, Download, ArrowLeft, MessageSquare, X, Send, Mail, Phone, CheckCircle2, FileText, MapPin, ExternalLink, Settings, Eye, Table as TableIcon, MoreHorizontal, Star } from 'lucide-react';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const DatasetV2 = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showLinksModal, setShowLinksModal] = useState(false);
  const [selectedLinksItem, setSelectedLinksItem] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState({
    number: true,
    title: true,
    totalScore: true,
    rating: true,
    reviewsCount: true,
    address: true,
    city: true,
    state: true,
    countryCode: true,
    website: true,
    phone: true,
    email: true,
    category: true,
    socialMedia: true,
    url: true,
    actions: true
  });
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  useEffect(() => {
    fetchDataset();
  }, [runId]);

  useEffect(() => {
    if (selectedLead) {
      fetchChatHistory(selectedLead.id);
    }
  }, [selectedLead]);

  const fetchDataset = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/datasets/${runId}/items`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch dataset:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dataset',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchChatHistory = async (leadId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/leads/${leadId}/chat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChatMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      setChatMessages([]);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedLead) return;

    const userMessage = chatInput;
    setChatInput('');
    setChatLoading(true);

    // Add user message to chat immediately
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString()
    }]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/leads/${selectedLead.id}/chat`,
        {
          message: userMessage,
          lead_data: selectedLead.data
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response.data.response,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI response',
        variant: 'destructive'
      });
    } finally {
      setChatLoading(false);
    }
  };

  const openChat = (item) => {
    setSelectedLead(item);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setSelectedLead(null);
    setChatMessages([]);
  };

  const handleExport = async (format) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/datasets/${runId}/export?format=${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dataset_${runId}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast({
        title: 'Export successful',
        description: `Dataset exported as ${format.toUpperCase()}`
      });
    } catch (error) {
      console.error('Failed to export dataset:', error);
      toast({
        title: 'Export failed',
        description: 'Failed to export dataset',
        variant: 'destructive'
      });
    }
  };

  const generateTemplate = async (channel) => {
    if (!selectedLead) return;
    
    setChatLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/leads/${selectedLead.id}/outreach-template?channel=${channel}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: `**${channel.toUpperCase()} Outreach Template:**\n\n${response.data.template}`,
        created_at: new Date().toISOString()
      }]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to generate template',
        variant: 'destructive'
      });
    } finally {
      setChatLoading(false);
    }
  };

  const openLinksModal = (item) => {
    setSelectedLinksItem(item);
    setShowLinksModal(true);
  };

  const closeLinksModal = () => {
    setShowLinksModal(false);
    setSelectedLinksItem(null);
  };

  const getSocialMediaLinks = (socialMedia) => {
    if (!socialMedia) return [];
    return Object.entries(socialMedia).map(([platform, url]) => ({
      platform,
      url
    }));
  };

  const filteredItems = items.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return Object.values(item.data).some(value =>
      String(value).toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🕷️</div>
          <p className="text-gray-600">Loading leads...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/runs')} className="hover:bg-gray-100">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Runs
              </Button>
              <div className="border-l h-8"></div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Leads Dashboard</h1>
                <p className="text-gray-500 mt-1">Run ID: {runId.slice(0, 8)}... • {filteredItems.length} Leads</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button variant="outline" onClick={() => handleExport('json')} className="hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
              <Button variant="outline" onClick={() => handleExport('csv')} className="hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-8 pb-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search leads by name, location, category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {filteredItems.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg">No leads found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Business Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reviews</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">City</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">State</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Links</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-500 font-medium">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{item.data.title || 'N/A'}</div>
                          {item.data.category && (
                            <Badge variant="outline" className="mt-1 text-xs">{item.data.category}</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {item.data.totalScore ? (
                          <div className="flex items-center space-x-1">
                            <span className="font-bold text-green-600">{item.data.totalScore}</span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        {item.data.rating ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-500">⭐</span>
                            <span className="font-medium">{item.data.rating}</span>
                            <span className="text-gray-400 text-xs">({item.data.reviewsCount || 0})</span>
                          </div>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={item.data.address}>
                        {item.data.address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.data.city || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.data.state || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          {item.data.phone && (
                            <div className="flex items-center space-x-1 text-xs">
                              <Phone className="w-3 h-3 text-gray-700" />
                              <span className="text-gray-700">{item.data.phone}</span>
                              {item.data.phoneVerified && <CheckCircle2 className="w-3 h-3 text-green-500" title="Verified" />}
                            </div>
                          )}
                          {item.data.email && (
                            <div className="flex items-center space-x-1 text-xs">
                              <Mail className="w-3 h-3 text-purple-600" />
                              <span className="text-gray-700">{item.data.email}</span>
                              {item.data.emailVerified && <CheckCircle2 className="w-3 h-3 text-green-500" title="Verified" />}
                            </div>
                          )}
                          {!item.data.phone && !item.data.email && <span className="text-gray-400 text-xs">No contact</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Google Maps Link */}
                          {item.data.url && (
                            <a 
                              href={item.data.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
                              title="View on Google Maps"
                            >
                              <MapPin className="w-4 h-4 text-red-600" />
                            </a>
                          )}
                          
                          {/* Social Media Links */}
                          {item.data.socialMedia?.facebook && (
                            <a 
                              href={item.data.socialMedia.facebook} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                              title="Facebook"
                            >
                              <span className="text-sm font-bold text-blue-600">f</span>
                            </a>
                          )}
                          
                          {item.data.socialMedia?.instagram && (
                            <a 
                              href={item.data.socialMedia.instagram} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-pink-100 hover:bg-pink-200 transition-colors"
                              title="Instagram"
                            >
                              <span className="text-sm font-bold text-pink-600">📷</span>
                            </a>
                          )}
                          
                          {item.data.socialMedia?.twitter && (
                            <a 
                              href={item.data.socialMedia.twitter} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-100 hover:bg-sky-200 transition-colors"
                              title="Twitter/X"
                            >
                              <span className="text-sm font-bold text-sky-600">𝕏</span>
                            </a>
                          )}
                          
                          {item.data.socialMedia?.linkedin && (
                            <a 
                              href={item.data.socialMedia.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                              title="LinkedIn"
                            >
                              <span className="text-sm font-bold text-blue-700">in</span>
                            </a>
                          )}
                          
                          {item.data.socialMedia?.youtube && (
                            <a 
                              href={item.data.socialMedia.youtube} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
                              title="YouTube"
                            >
                              <span className="text-sm font-bold text-red-600">▶</span>
                            </a>
                          )}
                          
                          {item.data.socialMedia?.tiktok && (
                            <a 
                              href={item.data.socialMedia.tiktok} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-black hover:bg-gray-800 transition-colors"
                              title="TikTok"
                            >
                              <span className="text-sm font-bold text-white">🎵</span>
                            </a>
                          )}
                          
                          {item.data.website && (
                            <a 
                              href={item.data.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                              title="Website"
                            >
                              <ExternalLink className="w-4 h-4 text-gray-600" />
                            </a>
                          )}
                          
                          {!item.data.url && !item.data.socialMedia && !item.data.website && (
                            <span className="text-gray-400 text-xs">No links</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          size="sm"
                          onClick={() => openChat(item)}
                          className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          AI Chat
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* AI Chat Sidebar */}
      {chatOpen && (
        <div className="fixed inset-y-0 right-0 w-1/3 bg-white shadow-2xl border-l border-gray-200 flex flex-col z-50">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">AI Engagement Assistant</h3>
              <p className="text-sm opacity-90">{selectedLead?.data.title}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={closeChat} className="text-white hover:bg-white/20">
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="px-6 py-3 bg-gray-50 border-b flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => generateTemplate('email')} className="text-xs">
              <FileText className="w-3 h-3 mr-1" />
              Email Template
            </Button>
            <Button size="sm" variant="outline" onClick={() => generateTemplate('phone')} className="text-xs">
              <Phone className="w-3 h-3 mr-1" />
              Call Script
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {chatMessages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Ask me anything about engaging with this lead!</p>
                <p className="text-xs text-gray-400 mt-2">Try: "How should I approach this business?"</p>
              </div>
            )}
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <div className="text-sm prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-li:text-gray-900 prose-ul:text-gray-900 prose-ol:text-gray-900">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex space-x-2">
              <Input
                placeholder="Ask for engagement advice..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleSendMessage()}
                className="flex-1"
                disabled={chatLoading}
              />
              <Button
                onClick={handleSendMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-700 hover:to-gray-800 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetV2;
