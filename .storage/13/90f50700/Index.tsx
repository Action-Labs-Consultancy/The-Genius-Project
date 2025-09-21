import React, { useState, useCallback } from 'react';
import { Edit3, Eye, Image, Calendar, MapPin, DollarSign, TrendingUp, Users, Plus, Upload, X, Check } from 'lucide-react';
import { IsolatedInput } from '@/components/IsolatedInput';
import { AssetUploadForm } from '@/components/AssetUploadForm';
import { hatch } from '@/hooks/useStoredState';

interface Milestone {
  id: string;
  number: string;
  dateStart: string;
  dateEnd: string;
  title: string;
  description: string;
  budgetUSD: string;
  spentUSD: string;
  budgetBHD: string;
  spentBHD: string;
  funnel: {
    awareness: string;
    download: string;
    registration: string;
    apply: string;
    accept: string;
    reapply: string;
  };
  funnelAssets: Record<string, Array<{
    id: string;
    imageUrl: string;
    category: string;
    fileName: string;
    uploadDate: string;
  }>>;
  products: string[];
  growthPercentage?: string;
  challenge: string;
  solution: string;
}

interface Feature {
  title: string;
  description: string;
}

export default function LandingPageBuilder() {
  const [activeTab, setActiveTab] = useState('edit');
  
  // Use persistent state for all editable content
  const [heroTitle, setHeroTitle] = hatch.useStoredState('heroTitle', 'Welcome to Our Amazing Product');
  const [heroSubtitle, setHeroSubtitle] = hatch.useStoredState('heroSubtitle', 'Transform your business with our innovative solution');
  const [ctaText, setCtaText] = hatch.useStoredState('ctaText', 'Get Started Today');
  const [ctaLink, setCtaLink] = hatch.useStoredState('ctaLink', '#contact');
  
  const [features, setFeatures] = hatch.useStoredState<Feature[]>('features', [
    { title: 'Feature One', description: 'Amazing functionality that will help your business grow' },
    { title: 'Feature Two', description: 'Streamlined workflow to save you time and effort' },
    { title: 'Feature Three', description: 'Advanced analytics to track your success' }
  ]);
  
  const [aboutText, setAboutText] = hatch.useStoredState('aboutText', 'We are a forward-thinking company dedicated to providing exceptional solutions for modern businesses.');
  const [contactEmail, setContactEmail] = hatch.useStoredState('contactEmail', 'hello@company.com');
  const [contactPhone, setContactPhone] = hatch.useStoredState('contactPhone', '+1 (555) 123-4567');
  
  const [primaryColor, setPrimaryColor] = hatch.useStoredState('primaryColor', '#3B82F6');
  const [secondaryColor, setSecondaryColor] = hatch.useStoredState('secondaryColor', '#1E40AF');
  
  // Funnel asset management state
  const [funnelOptions, setFunnelOptions] = hatch.useStoredState<string[]>('funnelOptions', [
    'Influencer', 'Roadshow', 'Activation', 'Ad videos', 'Short videos', 'Customer value', 'CSR', 'PR & Media'
  ]);
  
  // Product options
  const productOptions = [
    'Advance Salary', 'Personal Finance', 'Instant Finance', 'Sukuk', 'BNPL', 
    'Digital Marketplace', 'Budgeting', 'Car Finance', 'Cash Buyout', 'SMEs', 'Insurance'
  ];
  
  const [showAssetModal, setShowAssetModal] = useState<{ milestoneIndex: number; stage: string } | null>(null);
  const [newOptionText, setNewOptionText] = useState('');
  const [showNewOptionInput, setShowNewOptionInput] = useState(false);
  
  const [milestones, setMilestones] = hatch.useStoredState<Milestone[]>('milestones', [
    { 
      id: 'milestone-1', number: '01', dateStart: '2024-01-15', dateEnd: '2024-01-31', title: 'Project Kickoff', description: 'Initial planning and setup phase', 
      budgetUSD: '25000', spentUSD: '22500', budgetBHD: '9425', spentBHD: '8483',
      funnel: { awareness: '10000', download: '5000', registration: '2500', apply: '1200', accept: '800', reapply: '100' },
      funnelAssets: {},
      products: [],
      challenge: '',
      solution: ''
    },
    { 
      id: 'milestone-2', number: '02', dateStart: '2024-03-01', dateEnd: '2024-04-15', title: 'Development Phase', description: 'Core development begins', 
      budgetUSD: '50000', spentUSD: '48000', budgetBHD: '18850', spentBHD: '18072',
      funnel: { awareness: '15000', download: '7500', registration: '4000', apply: '2000', accept: '1500', reapply: '200' },
      funnelAssets: {},
      products: [],
      growthPercentage: '',
      challenge: '',
      solution: ''
    },
    { 
      id: 'milestone-3', number: '03', dateStart: '2024-06-15', dateEnd: '2024-07-30', title: 'Testing Phase', description: 'Quality assurance and testing', 
      budgetUSD: '20000', spentUSD: '18500', budgetBHD: '7540', spentBHD: '6975',
      funnel: { awareness: '8000', download: '4000', registration: '2200', apply: '1100', accept: '750', reapply: '80' },
      funnelAssets: {},
      products: [],
      growthPercentage: '',
      challenge: '',
      solution: ''
    },
    { 
      id: 'milestone-4', number: '04', dateStart: '2024-09-01', dateEnd: '2024-11-15', title: 'Launch Preparation', description: 'Final preparations for launch', 
      budgetUSD: '15000', spentUSD: '16200', budgetBHD: '5655', spentBHD: '6105',
      funnel: { awareness: '20000', download: '12000', registration: '6000', apply: '3500', accept: '2800', reapply: '300' },
      funnelAssets: {},
      products: [],
      growthPercentage: '',
      challenge: '',
      solution: ''
    },
    { 
      id: 'milestone-5', number: '05', dateStart: '2024-12-01', dateEnd: '2024-12-31', title: 'Go Live', description: 'Official product launch', 
      budgetUSD: '30000', spentUSD: '28900', budgetBHD: '11310', spentBHD: '10896',
      funnel: { awareness: '50000', download: '25000', registration: '15000', apply: '8000', accept: '6000', reapply: '500' },
      funnelAssets: {},
      products: [],
      growthPercentage: '',
      challenge: '',
      solution: ''
    }
  ]);

  const updateFeature = useCallback((index: number, field: keyof Feature, value: string) => {
    setFeatures(prevFeatures => {
      const updatedFeatures = [...prevFeatures];
      updatedFeatures[index] = {
        ...updatedFeatures[index],
        [field]: value
      };
      return updatedFeatures;
    });
  }, [setFeatures]);

  const updateMilestoneById = useCallback((id: string, field: keyof Milestone, value: any) => {
    setMilestones(prev => prev.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  }, [setMilestones]);

  const addFunnelAsset = (milestoneIndex: number, stage: string, imageFile: File, category: string) => {
    const updatedMilestones = [...milestones];
    if (!updatedMilestones[milestoneIndex].funnelAssets) {
      updatedMilestones[milestoneIndex].funnelAssets = {};
    }
    if (!updatedMilestones[milestoneIndex].funnelAssets[stage]) {
      updatedMilestones[milestoneIndex].funnelAssets[stage] = [];
    }
    
    // Create URL from file for preview
    const imageUrl = URL.createObjectURL(imageFile);
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    updatedMilestones[milestoneIndex].funnelAssets[stage].push({
      id: assetId,
      imageUrl,
      category,
      fileName: imageFile.name,
      uploadDate: new Date().toISOString()
    });
    
    setMilestones(updatedMilestones);
  };

  const removeFunnelAsset = (milestoneIndex: number, stage: string, assetId: string) => {
    const updatedMilestones = [...milestones];
    if (updatedMilestones[milestoneIndex].funnelAssets[stage]) {
      updatedMilestones[milestoneIndex].funnelAssets[stage] = updatedMilestones[milestoneIndex].funnelAssets[stage].filter(
        asset => asset.id !== assetId
      );
    }
    setMilestones(updatedMilestones);
  };

  const addNewFunnelOption = () => {
    if (newOptionText.trim() && !funnelOptions.includes(newOptionText.trim())) {
      setFunnelOptions([...funnelOptions, newOptionText.trim()]);
      setNewOptionText('');
      setShowNewOptionInput(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="flex">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'edit' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Edit
            </div>
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-6 py-3 font-medium ${
              activeTab === 'preview' 
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </div>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'edit' ? (
        <div className="p-6 space-y-8 max-w-4xl">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Edit3 className="w-5 h-5" />
              Edit Your Landing Page
            </h2>
            <p className="text-gray-600">Make changes here and see them reflected in the Preview tab in real-time.</p>
          </div>

          {/* Timeline Milestones Section */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Project Timeline Milestones
            </h3>
            <div className="space-y-4">
              {milestones.map((milestone) => (
                <div key={milestone.id} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Milestone #</label>
                        <IsolatedInput
                          value={milestone.number ?? ''}
                          onChange={(newValue) => updateMilestoneById(milestone.id, 'number', newValue)}
                          placeholder="01"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                          type="date"
                          value={milestone.dateStart ?? ''}
                          onChange={(e) => updateMilestoneById(milestone.id, 'dateStart', e.target.value)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                          type="date"
                          value={milestone.dateEnd ?? ''}
                          onChange={(e) => updateMilestoneById(milestone.id, 'dateEnd', e.target.value)}
                          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <IsolatedInput
                          value={milestone.title ?? ''}
                          onChange={(newValue) => updateMilestoneById(milestone.id, 'title', newValue)}
                          placeholder="Milestone title"
                        />
                      </div>
                    </div>
                    
                    {/* Challenge Section */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <h4 className="text-md font-semibold mb-3 flex items-center gap-2 text-orange-800">
                        ⚠️ Challenge
                      </h4>
                      <IsolatedInput
                        value={milestone.challenge ?? ''}
                        onChange={(newValue) => updateMilestoneById(milestone.id, 'challenge', newValue)}
                        type="textarea"
                        rows={3}
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        placeholder="Describe the key challenges faced during this milestone..."
                      />
                    </div>
                    
                    {/* Solution Section */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-md font-semibold mb-3 flex items-center gap-2 text-blue-800">
                        💡 Solution
                      </h4>
                      <IsolatedInput
                        value={milestone.solution ?? ''}
                        onChange={(newValue) => updateMilestoneById(milestone.id, 'solution', newValue)}
                        type="textarea"
                        rows={3}
                        className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Describe the solution implemented to overcome the challenge..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Upload Modal */}
          {showAssetModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Add Media Asset - {showAssetModal.stage.charAt(0).toUpperCase() + showAssetModal.stage.slice(1)}
                  </h3>
                  <button
                    onClick={() => setShowAssetModal(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <AssetUploadForm 
                  milestoneIndex={showAssetModal.milestoneIndex}
                  stage={showAssetModal.stage}
                  onSave={(imageFile, category) => {
                    addFunnelAsset(showAssetModal.milestoneIndex, showAssetModal.stage, imageFile, category);
                    setShowAssetModal(null);
                  }}
                  onCancel={() => setShowAssetModal(null)}
                  funnelOptions={funnelOptions}
                  onAddNewOption={addNewFunnelOption}
                  newOptionText={newOptionText}
                  setNewOptionText={setNewOptionText}
                  showNewOptionInput={showNewOptionInput}
                  setShowNewOptionInput={setShowNewOptionInput}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          {/* Timeline Section in Preview */}
          <section className="py-16 px-6">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold mb-4" style={{ color: secondaryColor }}>
                  Project Timeline
                </h2>
                <p className="text-gray-600 text-lg">Track progress and milestones</p>
              </div>
              
              <div className="relative">
                {/* Timeline Line */}
                <div className="absolute left-12 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-indigo-600 rounded-full shadow-sm"></div>
                
                <div className="space-y-12">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="relative flex items-start gap-8">
                      {/* Milestone Number Circle */}
                      <div className="flex-shrink-0 relative">
                        <div 
                          className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-xl z-10 shadow-lg ring-4 ring-white"
                          style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                        >
                          {milestone.number}
                        </div>
                        <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 blur-xl"></div>
                      </div>
                      
                      {/* Milestone Content */}
                      <div className="flex-1 bg-white p-8 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-6">
                          <div>
                            <h3 className="text-2xl font-bold mb-2" style={{ color: secondaryColor }}>
                              {milestone.title}
                            </h3>
                            <div className="flex items-center gap-2 text-gray-500">
                              <Calendar className="w-5 h-5" />
                              <span className="text-sm font-medium">
                                {milestone.dateStart && milestone.dateEnd ? (
                                  `${new Date(milestone.dateStart).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })} - ${new Date(milestone.dateEnd).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}`
                                ) : (
                                  milestone.dateStart ? new Date(milestone.dateStart).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  }) : 'No date set'
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="mt-3 md:mt-0">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              Milestone {milestone.number}
                            </span>
                          </div>
                        </div>
                        
                        {/* Challenge and Solution Display */}
                        {(milestone.challenge || milestone.solution) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {milestone.challenge && (
                              <div className="bg-gradient-to-br from-orange-50 to-red-50 p-5 rounded-xl border border-orange-200">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-orange-700">
                                  ⚠️ Challenge
                                </h4>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {milestone.challenge}
                                </p>
                              </div>
                            )}
                            
                            {milestone.solution && (
                              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-blue-700">
                                  💡 Solution
                                </h4>
                                <p className="text-gray-700 text-sm leading-relaxed">
                                  {milestone.solution}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}