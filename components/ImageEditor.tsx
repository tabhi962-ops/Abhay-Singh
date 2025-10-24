import React, { useState, useRef, useCallback } from 'react';
import { editImage, fileToBase64 } from '../services/geminiService';
import Spinner from './Spinner';

const ImageEditor: React.FC = () => {
  const [uploadedImage, setUploadedImage] = useState<{ file: File, preview: string } | null>(null);
  const [prompt, setPrompt] = useState<string>('Add a dramatic, cinematic lighting effect.');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File | undefined | null) => {
    if (file && file.type.startsWith('image/')) {
      const preview = URL.createObjectURL(file);
      setUploadedImage({ file, preview });
      setEditedImage(null);
      setError(null);
    } else if (file) {
      setError("Invalid file type. Please upload an image file (e.g., PNG, JPG, WEBP).");
      setUploadedImage(null);
      setEditedImage(null);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFile(e.target.files?.[0]);
    // Reset file input value to allow re-uploading the same file
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.preview);
    }
    setUploadedImage(null);
    setEditedImage(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0]);
  };

  const handleEdit = async () => {
    if (!uploadedImage) {
      setError('Please upload an image first.');
      return;
    }
    if (!prompt) {
      setError('Please enter an editing prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setEditedImage(null);
    try {
      const base64Image = await fileToBase64(uploadedImage.file);
      const mimeType = uploadedImage.file.type;
      const resultUrl = await editImage(base64Image, mimeType, prompt);
      setEditedImage(resultUrl);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold text-white mb-4">Image Editor</h2>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your edits, e.g., 'Make this black and white' or 'Add a birthday hat to the person'..."
          className="w-full h-24 p-3 bg-gray-900 border border-gray-700 rounded-md text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
        />
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleEdit}
            disabled={isLoading || !uploadedImage}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white font-bold py-2 px-6 rounded-md transition-colors duration-300"
          >
            {isLoading ? 'Editing...' : 'Apply Edits'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg min-h-[400px] flex flex-col items-center justify-center relative">
          <h3 className="text-lg font-medium text-gray-300 mb-2 absolute top-4 left-4">Original</h3>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
          {uploadedImage ? (
            <div className="relative group w-full h-full flex items-center justify-center">
              <img src={uploadedImage.preview} alt="Uploaded" className="max-w-full max-h-[70vh] rounded-md object-contain" />
              <button
                onClick={handleRemoveImage}
                aria-label="Remove image"
                className="absolute top-2 right-2 bg-black bg-opacity-60 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`w-full h-full min-h-[350px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                isDragging ? 'border-indigo-500 bg-gray-700/50' : 'border-gray-600 hover:border-gray-500'
              }`}
            >
              <svg className="w-12 h-12 text-gray-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
              <p className="text-gray-400 text-center"><span className="font-semibold text-indigo-400">Click to upload</span> or drag and drop</p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF, WEBP</p>
            </div>
          )}
        </div>
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg min-h-[400px] flex flex-col items-center justify-center relative">
          <h3 className="text-lg font-medium text-gray-300 mb-2 absolute top-4 left-4">Edited</h3>
          {isLoading && <Spinner message="Applying edits..." />}
          {error && !isLoading && (
            <div className="text-red-300 bg-red-800/50 border border-red-600 rounded-lg p-6 text-center max-w-lg">
              <h3 className="font-bold text-lg mb-2">Error Editing Image</h3>
              <p className="text-sm">{error}</p>
            </div>
          )}
          {editedImage && !isLoading && !error && (
            <img src={editedImage} alt="Edited" className="max-w-full max-h-[70vh] rounded-md object-contain" />
          )}
          {!isLoading && !error && !editedImage && (
            <p className="text-gray-500">Your edited image will appear here.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEditor;
