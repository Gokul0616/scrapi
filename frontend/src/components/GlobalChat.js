import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MessageCircle, X, Send, Minimize2, Trash2, RefreshCw, Navigation } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const GlobalChat = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [actionFeedback, setActionFeedback] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history when chat opens
  useEffect(() => {
    if (isOpen && !historyLoaded) {
      loadChatHistory();
    }
  }, [isOpen]);

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API}/chat/global/history?limit=50`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const history = response.data.history || [];
      const formattedMessages = history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.created_at || new Date().toISOString()
      }));

      setMessages(formattedMessages);
      setHistoryLoaded(true);
    } catch (error) {
      console.error('Error loading chat history:', error);
      setHistoryLoaded(true);
    }
  };

  const clearChatHistory = async () => {
    if (!window.confirm('Are you sure you want to clear your chat history?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API}/chat/global/history`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setMessages([]);
      alert('Chat history cleared successfully!');
    } catch (error) {
      console.error('Error clearing chat history:', error);
      alert('Failed to clear chat history. Please try again.');
    }
  };

  // Execute commands from AI (navigation, export, form filling, etc.)
  const executeCommand = async (response) => {
    try {
      // Parse the response to look for action commands
      const responseData = typeof response === 'string' ? { response } : response;
      
      // Check if there's an action command in the response metadata
      if (responseData.action) {
        const { action, page, run_id, format, message: actionMessage, actor_id, form_data } = responseData;
        
        // Show visual feedback
        if (actionMessage) {
          setActionFeedback(actionMessage);
          setTimeout(() => setActionFeedback(null), 3000);
        }
        
        // Execute navigation
        if (action === 'navigate' && page) {
          setTimeout(() => {
            const pageMap = {
              'dashboard': '/',
              'actors': '/actors',
              'runs': '/runs',
              'datasets': '/datasets',
              'leads': '/datasets',
              'proxies': '/proxies'
            };
            
            if (pageMap[page]) {
              navigate(pageMap[page]);
            }
          }, 800); // Small delay for user to see the feedback
        }
        
        // Execute actor detail page opening
        if (action === 'open_actor' && actor_id) {
          setTimeout(() => {
            navigate(`/actors/${actor_id}`);
          }, 800);
        }
        
        // Execute run details viewing
        if (action === 'view_run' && page) {
          setTimeout(() => {
            navigate(`/${page}`);
            // Could scroll to specific run if needed
          }, 800);
        }
        
        // Execute full form fill and run automation
        if (action === 'fill_and_run' && run_id) {
          // Just navigate to runs page to see the new run
          setTimeout(() => {
            setActionFeedback(`✓ Scraper started! Run ID: ${run_id.substring(0, 8)}...`);
            setTimeout(() => {
              navigate('/runs');
              setActionFeedback(null);
            }, 1500);
          }, 1000);
        }
        
        // Execute export
        if (action === 'export' && run_id) {
          setTimeout(async () => {
            try {
              const token = localStorage.getItem('token');
              const exportFormat = format || 'json';
              const response = await axios.get(
                `${API}/datasets/export/${run_id}?format=${exportFormat}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                  responseType: 'blob'
                }
              );
              
              // Download the file
              const url = window.URL.createObjectURL(new Blob([response.data]));
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `export_${run_id}.${exportFormat}`);
              document.body.appendChild(link);
              link.click();
              link.parentNode.removeChild(link);
              
              setActionFeedback(`✓ Export downloaded successfully!`);
              setTimeout(() => setActionFeedback(null), 3000);
            } catch (error) {
              console.error('Export error:', error);
              setActionFeedback(`✗ Export failed. Please try again.`);
              setTimeout(() => setActionFeedback(null), 3000);
            }
          }, 500);
        }
      }
    } catch (error) {
      console.error('Command execution error:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/chat/global`,
        {
          message: userMessage
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const assistantMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Execute any commands from the response
      await executeCommand(response.data);
    } catch (error) {
      console.error('Global chat error:', error);
      
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChat = () => {
    if (isOpen) {
      setIsOpen(false);
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 group"
          title="Chat Assistant"
        >
          <MessageCircle className="w-6 h-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-6 right-6 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50 transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[600px]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold text-sm">Chat Assistant</h3>
                <p className="text-xs opacity-90">AI-powered help</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChatHistory}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                title="Clear History"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content - Only show when not minimized */}
          {!isMinimized && (
            <>
              {/* Action Feedback Banner */}
              {actionFeedback && (
                <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-sm flex items-center space-x-2 animate-pulse">
                  <Navigation className="w-4 h-4" />
                  <span>{actionFeedback}</span>
                </div>
              )}
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                  <div className="text-center text-gray-500 mt-8">
                    <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Hi! I'm your Scrapi assistant.</p>
                    <p className="text-xs text-gray-400 mt-2">I can now help you navigate and control the app!</p>
                    <div className="mt-4 space-y-2 text-xs text-left bg-white p-3 rounded-lg">
                      <p className="font-semibold text-gray-700">Try asking:</p>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>"Go to Actors page"</li>
                        <li>"Show me my runs"</li>
                        <li>"Export my latest data as CSV"</li>
                        <li>"How many scrapers do I have?"</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.role === 'user'
                          ? 'bg-gradient-to-r from-gray-700 to-gray-900 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      ) : (
                        <div className="text-sm prose prose-sm max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                              em: ({children}) => <em className="italic">{children}</em>,
                              h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-gray-900">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-bold mb-2 text-gray-900">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-bold mb-1 text-gray-900">{children}</h3>,
                              ul: ({children}) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="text-gray-800">{children}</li>,
                              code: ({inline, children}) => 
                                inline ? 
                                  <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono text-emerald-700">{children}</code> :
                                  <code className="block bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto">{children}</code>,
                              blockquote: ({children}) => <blockquote className="border-l-4 border-emerald-500 pl-3 italic text-gray-700">{children}</blockquote>
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}
                      <p className={`text-xs mt-1 ${
                        msg.role === 'user' ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t bg-white rounded-b-lg">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Type your message..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="bg-gradient-to-r from-gray-700 to-gray-900 hover:from-gray-600 hover:to-gray-800 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default GlobalChat;
