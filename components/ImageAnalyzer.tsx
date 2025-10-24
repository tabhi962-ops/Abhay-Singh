
import React, { useState } from 'react';
import { generateImageForAnalysis, analyzeGeneratedImage } from '../services/geminiService';
import Spinner from './Spinner';

const ImageAnalyzer: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('A koala wearing a tiny top hat, sitting on a branch and reading a newspaper.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{ match: boolean, reason: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAndAnalyze = async (isRetry = false) => {
    if (!prompt) {
      setError('Please enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setAnalysisResult(null);

    try {
      // Step 1: Generate image
      setStatusMessage('Generating initial image...');
      let refinedPrompt = prompt;
      if(isRetry && analysisResult) {
        refinedPrompt = `Original prompt: "${prompt}". The previous attempt was not accurate because: "${analysisResult.reason}". Please generate a new image that more closely matches the original prompt, paying attention to fixing the previous issues.`
      }

      const rawBase64Image = await generateImageForAnalysis(refinedPrompt);
      const imageUrl = `data:image/png;base64,${rawBase64Image}`;
      setGeneratedImage(imageUrl);

      // Step 2: Analyze image
      setStatusMessage('Analyzing generated image...');
      const analysis = await analyzeGeneratedImage(rawBase64Image, prompt);
      setAnalysisResult(analysis);

      if (!analysis.match && !isRetry) {
        // Step 3: Auto-retry once if it doesn't match
        setStatusMessage('Image did not match prompt. Retrying with refined instructions...');
        handleGenerateAndAnalyze(true); // Call itself again for the retry
        return; // Exit current execution to avoid setting loading to false too early
      } else {
        setStatusMessage(analysis.match ? 'Analysis complete: Image matches prompt.' : 'Analysis complete: Image may not fully match prompt after retry.');
      }

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred during the process.');
      setStatusMessage('An error occurred.');
    } finally {
      if(!(!analysisResult?.match && !isRetry)) {
         setIsLoading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-2">Analyze & Refine</h2>
        <p className="text-gray-400 mb-4 text-sm">This tool generates an image, analyzes if it matches your prompt, and automatically tries to fix it if it doesn't.</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter a very specific prompt..."
          className="w-full h-24 p-3 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
        <div className="mt-4 flex items-center">
          <button
            onClick={() => handleGenerateAndAnalyze(false)}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-md transition-colors duration-300"
          >
            {isLoading ? 'Working...' : 'Generate & Analyze'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg min-h-[400px] flex items-center justify-center relative">
          {isLoading && <Spinner message={statusMessage} />}
          {error && (
             <div className="text-red-300 bg-red-800/50 border border-red-600 rounded-lg p-6 text-center max-w-lg">
                <h3 className="font-bold text-lg mb-2">An Error Occurred</h3>
                <p className="text-sm">{error}</p>
            </div>
          )}
          {generatedImage && !isLoading && !error && (
            <img src={generatedImage} alt="Generated for analysis" className="max-w-full max-h-[70vh] rounded-md object-contain" />
          )}
          {!isLoading && !error && !generatedImage && (
            <p className="text-gray-500">The generated image will appear here.</p>
          )}
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg min-h-[400px] flex flex-col items-center justify-center">
          <h3 className="text-lg font-medium text-gray-300 mb-2">Analysis Result</h3>
          {!isLoading && !error && analysisResult ? (
            <div className="text-center">
              <p className={`text-2xl font-bold ${analysisResult.match ? 'text-green-400' : 'text-yellow-400'}`}>
                {analysisResult.match ? 'Match Found' : 'Potential Mismatch'}
              </p>
              <p className="text-gray-300 mt-2">{analysisResult.reason}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-center">The analysis of the image against your prompt will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
