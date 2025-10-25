import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { 
  ArrowLeft, ArrowRight, Check, Sparkles, Code, 
  Settings, Eye, Rocket, Plus, X, Trash2
} from 'lucide-react';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CreateScraper = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isFromScratch, setIsFromScratch] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [scraperData, setScraperData] = useState({
    name: '',
    description: '',
    icon: '🕷️',
    category: 'General',
    tags: [],
    readme: '',
    visibility: 'private',
    type: 'prebuilt',
    code: '',
    input_schema: {
      title: '',
      type: 'object',
      schemaVersion: 1,
      properties: {},
      required: []
    },
    template_type: null
  });

  const steps = [
    { number: 1, title: 'Choose Template', icon: Sparkles },
    { number: 2, title: 'Basic Info', icon: Settings },
    { number: 3, title: 'Input Schema', icon: Code },
    { number: 4, title: 'Review & Publish', icon: Eye }
  ];

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
      toast({
        title: 'Error',
        description: 'Failed to load templates',
        variant: 'destructive'
      });
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setIsFromScratch(false);
    setScraperData({
      ...scraperData,
      name: template.name,
      description: template.description,
      icon: template.icon,
      category: template.category,
      template_type: template.template_type,
      input_schema: template.input_schema,
      readme: template.readme || ''
    });
  };

  const handleStartFromScratch = () => {
    setIsFromScratch(true);
    setSelectedTemplate(null);
    setScraperData({
      ...scraperData,
      name: '',
      description: '',
      template_type: null
    });
  };

  const handleSaveAndPublish = async (status) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const actorData = {
        name: scraperData.name,
        description: scraperData.description,
        icon: scraperData.icon,
        category: scraperData.category,
        input_schema: scraperData.input_schema,
        status: status,
        visibility: scraperData.visibility,
        tags: scraperData.tags,
        readme: scraperData.readme,
        template_type: scraperData.template_type
      };

      const response = await axios.post(
        `${API}/actors`,
        actorData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast({
        title: 'Success!',
        description: status === 'published' 
          ? 'Scraper created and published to marketplace' 
          : 'Scraper saved as draft'
      });

      navigate('/my-scrapers');
    } catch (error) {
      console.error('Failed to create scraper:', error);
      toast({
        title: 'Error',
        description: 'Failed to create scraper',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addTag = (tag) => {
    if (tag && !scraperData.tags.includes(tag)) {
      setScraperData({
        ...scraperData,
        tags: [...scraperData.tags, tag]
      });
    }
  };

  const removeTag = (tagToRemove) => {
    setScraperData({
      ...scraperData,
      tags: scraperData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const addSchemaField = () => {
    const fieldName = `field_${Object.keys(scraperData.input_schema.properties).length + 1}`;
    const newProperties = {
      ...scraperData.input_schema.properties,
      [fieldName]: {
        title: 'New Field',
        type: 'string',
        description: '',
        editor: 'textfield'
      }
    };
    
    setScraperData({
      ...scraperData,
      input_schema: {
        ...scraperData.input_schema,
        properties: newProperties
      }
    });
  };

  const removeSchemaField = (fieldName) => {
    const newProperties = { ...scraperData.input_schema.properties };
    delete newProperties[fieldName];
    
    setScraperData({
      ...scraperData,
      input_schema: {
        ...scraperData.input_schema,
        properties: newProperties,
        required: scraperData.input_schema.required.filter(f => f !== fieldName)
      }
    });
  };

  const updateSchemaField = (fieldName, updates) => {
    const newProperties = {
      ...scraperData.input_schema.properties,
      [fieldName]: {
        ...scraperData.input_schema.properties[fieldName],
        ...updates
      }
    };
    
    setScraperData({
      ...scraperData,
      input_schema: {
        ...scraperData.input_schema,
        properties: newProperties
      }
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Choose a Starting Point</h2>
              <p className="text-gray-600 mt-2">Select a template or start from scratch</p>
            </div>

            {/* Start from Scratch Option */}
            <div 
              onClick={handleStartFromScratch}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                isFromScratch ? 'border-gray-800 bg-gray-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start">
                <div className="text-4xl mr-4">✨</div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">Start from Scratch</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Build a custom scraper with your own configuration
                  </p>
                </div>
                {isFromScratch && (
                  <Check className="w-6 h-6 text-gray-800" />
                )}
              </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((template) => (
                <div
                  key={template.template_type}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-6 border-2 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate?.template_type === template.template_type
                      ? 'border-gray-800 bg-gray-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="text-4xl mr-4">{template.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{template.description}</p>
                      <Badge variant="outline" className="mt-2">{template.category}</Badge>
                    </div>
                    {selectedTemplate?.template_type === template.template_type && (
                      <Check className="w-6 h-6 text-gray-800" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Basic Information</h2>
              <p className="text-gray-600 mt-2">Configure your scraper details</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scraper Name *
              </label>
              <Input
                value={scraperData.name}
                onChange={(e) => setScraperData({ ...scraperData, name: e.target.value })}
                placeholder="My Awesome Scraper"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={scraperData.description}
                onChange={(e) => setScraperData({ ...scraperData, description: e.target.value })}
                placeholder="Describe what your scraper does..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <Input
                  value={scraperData.icon}
                  onChange={(e) => setScraperData({ ...scraperData, icon: e.target.value })}
                  placeholder="🕷️"
                  className="w-full text-2xl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={scraperData.category}
                  onChange={(e) => setScraperData({ ...scraperData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
                >
                  <option value="General">General</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Maps & Location">Maps & Location</option>
                  <option value="API">API</option>
                  <option value="Finance">Finance</option>
                  <option value="Real Estate">Real Estate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex gap-2 mb-2 flex-wrap">
                {scraperData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      addTag(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={(e) => {
                    const input = e.target.parentElement.querySelector('input');
                    addTag(input.value);
                    input.value = '';
                  }}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visibility
              </label>
              <select
                value={scraperData.visibility}
                onChange={(e) => setScraperData({ ...scraperData, visibility: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-800"
              >
                <option value="private">Private (Only you)</option>
                <option value="public">Public (Visible in marketplace)</option>
                <option value="team">Team (Shared with team)</option>
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Configure Input Schema</h2>
              <p className="text-gray-600 mt-2">Define the input fields for your scraper</p>
            </div>

            <div className="space-y-4">
              {Object.entries(scraperData.input_schema.properties).map(([fieldName, field]) => (
                <div key={fieldName} className="p-4 border rounded-lg bg-white">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Field Title
                        </label>
                        <Input
                          value={field.title}
                          onChange={(e) => updateSchemaField(fieldName, { title: e.target.value })}
                          placeholder="Field title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) => updateSchemaField(fieldName, { type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="string">Text</option>
                          <option value="number">Number</option>
                          <option value="boolean">Checkbox</option>
                          <option value="array">List</option>
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <Input
                          value={field.description || ''}
                          onChange={(e) => updateSchemaField(fieldName, { description: e.target.value })}
                          placeholder="Field description"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSchemaField(fieldName)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                onClick={addSchemaField}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Field
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Review & Publish</h2>
              <p className="text-gray-600 mt-2">Review your scraper configuration</p>
            </div>

            <div className="bg-white border rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="text-5xl">{scraperData.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">{scraperData.name}</h3>
                  <p className="text-gray-600 mt-1">{scraperData.description}</p>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    <Badge variant="outline">{scraperData.category}</Badge>
                    <Badge variant="secondary">{scraperData.visibility}</Badge>
                    {scraperData.tags.map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {Object.keys(scraperData.input_schema.properties).length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">Input Fields:</h4>
                  <div className="space-y-2">
                    {Object.entries(scraperData.input_schema.properties).map(([fieldName, field]) => (
                      <div key={fieldName} className="flex items-center gap-3 text-sm">
                        <Code className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{field.title}</span>
                        <Badge variant="secondary" className="text-xs">{field.type}</Badge>
                        {field.description && (
                          <span className="text-gray-500 text-xs">- {field.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {scraperData.visibility === 'public' && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Monetization Coming Soon</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Earn money by sharing your scraper with the community
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleSaveAndPublish('draft')}
                variant="outline"
                disabled={loading}
                className="flex-1"
              >
                Save as Draft
              </Button>
              <Button
                onClick={() => handleSaveAndPublish('published')}
                disabled={loading || !scraperData.name || !scraperData.description}
                className="flex-1 bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Publish Scraper
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Scraper</h1>
              <p className="text-gray-600 mt-1">Build your custom scraper in 4 easy steps</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/my-scrapers')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Scrapers
            </Button>
          </div>

          {/* Progress Steps */}
          <div className="mt-8 flex items-center">
            {steps.map((s, index) => {
              const Icon = s.icon;
              const isActive = step === s.number;
              const isCompleted = step > s.number;
              
              return (
                <React.Fragment key={s.number}>
                  <div className="flex items-center">
                    <div
                      className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-gray-800 text-white'
                          : isCompleted
                          ? 'bg-gray-100 text-gray-900'
                          : 'bg-white text-gray-400'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="text-xs font-medium">Step {s.number}</div>
                        <div className="text-sm font-semibold">{s.title}</div>
                      </div>
                      {isCompleted && <Check className="w-5 h-5" />}
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-0.5 w-12 mx-2 ${
                        isCompleted ? 'bg-gray-800' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-8 py-12">
        {renderStepContent()}

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="flex justify-between gap-3 mt-8 max-w-4xl mx-auto">
            {step > 1 && (
              <Button
                onClick={() => setStep(step - 1)}
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedTemplate && !isFromScratch) ||
                (step === 2 && (!scraperData.name || !scraperData.description))
              }
              className="bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black ml-auto"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateScraper;