import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function CreateScraper() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">Create Scraper</h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto mb-8">
          Custom scraper creation feature.
          <br />
          Coming soon!
        </p>
        <button
          onClick={() => navigate('/actors')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-lg hover:from-gray-600 hover:to-gray-800 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Actors
        </button>
      </div>
    </div>
  );
}

export default CreateScraper;
