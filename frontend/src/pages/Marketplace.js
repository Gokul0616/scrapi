import React from 'react';
import { ShoppingBag } from 'lucide-react';

function Marketplace() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-r from-gray-700 to-gray-900 mb-6">
          <ShoppingBag className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">Marketplace</h1>
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          Discover and share scrapers with the community.
          <br />
          Coming soon!
        </p>
      </div>
    </div>
  );
}

export default Marketplace;
