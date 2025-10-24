
import React, { useState } from 'react';
import { AppTab } from './types';
import Tabs from './components/Tabs';
import ImageGenerator from './components/ImageGenerator';
import ImageEditor from './components/ImageEditor';
import ImageAnalyzer from './components/ImageAnalyzer';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.GENERATE);

  const renderActiveTab = () => {
    switch (activeTab) {
      case AppTab.GENERATE:
        return <ImageGenerator />;
      case AppTab.EDIT:
        return <ImageEditor />;
      case AppTab.ANALYZE:
        return <ImageAnalyzer />;
      default:
        return <ImageGenerator />;
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
            Gemini Image Studio
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Your AI-powered toolkit for image creation and manipulation.
          </p>
        </header>
        
        <main>
          <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="mt-8">
            {renderActiveTab()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
