
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { ASPECT_RATIOS } from '../constants';
import type { AspectRatio } from '../types';
import Spinner from './Spinner';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A photorealistic image of a futuristic city skyline at dusk, with flying vehicles and neon lights.');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    try {
      const imageUrl = await generateImage(prompt, aspectRatio);
      setGeneratedImage(imageUrl);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Image Generation</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a detailed prompt for the image..."
          className="w-full h-24 p-3 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="aspect-ratio" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
            <select
              id="aspect-ratio"
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full sm:w-40 bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-gray-200 focus:ring-2 focus:ring-indigo-500"
            >
              {ASPECT_RATIOS.map((ratio) => (
                <option key={ratio} value={ratio}>{ratio}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full sm:w-auto sm:ml-auto mt-4 sm:mt-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-md transition-colors duration-300"
          >
            {isLoading ? 'Generating...' : 'Generate Image'}
          </button>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg shadow-lg min-h-[400px] flex items-center justify-center relative">
        {isLoading && <Spinner message="Generating image..." />}
        {error && (
            <div className="text-red-300 bg-red-800/50 border border-red-600 rounded-lg p-6 text-center max-w-lg">
                <h3 className="font-bold text-lg mb-2">Error Generating Image</h3>
                <p className="text-sm">{error}</p>
            </div>
        )}
        {generatedImage && !isLoading && !error && (
          <img src={generatedImage} alt="Generated" className="max-w-full max-h-[80vh] rounded-md object-contain" />
        )}
        {!isLoading && !error && !generatedImage && (
          <p className="text-gray-500">Your generated image will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
