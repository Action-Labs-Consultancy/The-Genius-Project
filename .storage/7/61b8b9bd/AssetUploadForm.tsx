import React, { useState } from 'react';
import { Upload, Check, X, Save } from 'lucide-react';

interface AssetUploadFormProps {
  milestoneIndex: number;
  stage: string;
  onSave: (file: File, category: string) => void;
  onCancel: () => void;
  funnelOptions: string[];
  onAddNewOption: () => void;
  newOptionText: string;
  setNewOptionText: (text: string) => void;
  showNewOptionInput: boolean;
  setShowNewOptionInput: (show: boolean) => void;
}

export const AssetUploadForm: React.FC<AssetUploadFormProps> = ({
  milestoneIndex,
  stage,
  onSave,
  onCancel,
  funnelOptions,
  onAddNewOption,
  newOptionText,
  setNewOptionText,
  showNewOptionInput,
  setShowNewOptionInput
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    if (selectedFile && selectedCategory) {
      onSave(selectedFile, selectedCategory);
      setSelectedFile(null);
      setSelectedCategory('');
      setPreviewUrl(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Upload Photo</label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="text-center">
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Click to upload an image</p>
            </div>
          </label>
        </div>

        {previewUrl && (
          <div className="mt-3">
            <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded" />
          </div>
        )}
      </div>

      {/* Category Dropdown */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-2 border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          <option value="">Select a category</option>
          {funnelOptions.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        {/* Add New Option */}
        <div className="mt-2">
          {!showNewOptionInput ? (
            <button
              onClick={() => setShowNewOptionInput(true)}
              className="text-sm text-purple-600 hover:text-purple-800"
            >
              + Add new category
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder="Enter new category"
                className="flex-1 p-2 text-sm border rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                onKeyPress={(e) => e.key === 'Enter' && onAddNewOption()}
              />
              <button
                onClick={onAddNewOption}
                className="p-2 text-green-600 hover:text-green-800"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setShowNewOptionInput(false);
                  setNewOptionText('');
                }}
                className="p-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!selectedFile || !selectedCategory}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Asset
        </button>
      </div>
    </div>
  );
};