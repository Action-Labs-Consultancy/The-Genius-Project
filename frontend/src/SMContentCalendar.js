import React, { useState } from 'react';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDaysMatrix(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDay = firstDay.getDay();
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
  const days = [];
  let dayNum = 1;
  for (let i = 0; i < totalCells; i++) {
    if (i >= startDay && dayNum <= daysInMonth) {
      days.push(new Date(year, month, dayNum++));
    } else {
      days.push(null);
    }
  }
  return days;
}

export default function SMContentCalendar({ clientId, user, onNavigate }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileObjectUrls, setFileObjectUrls] = useState(new Map()); // Store object URLs
  const [customModal, setCustomModal] = useState({ show: false, type: '', title: '', message: '', onConfirm: null });
  const [editingContent, setEditingContent] = useState(null); // Track if we're editing existing content
  const [formData, setFormData] = useState({
    contentType: '',
    files: [],
    existingFiles: [], // Track existing files for editing
    artworkCopy: '',
    textCopy: '',
    channel: '',
    status: 'Draft',
    tags: [],
    clientFeedback: ''
  });
  const [channelFilter, setChannelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [userType, setUserType] = useState('employee');
  const [clientFeedback, setClientFeedback] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('pending');
  const [contentFeedbacks, setContentFeedbacks] = useState([]);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiFormData, setAiFormData] = useState({
    clientType: '',
    brandIdentity: '',
    productsServices: '',
    targetCustomer: '',
    painPoints: '',
    seasonalEvents: '',
    brandTone: '',
    competitors: '',
    platforms: [],
    postsPerWeek: '',
    includeTrending: false,
    optimalTiming: false
  });
  const [aiGenerating, setAiGenerating] = useState(false);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const days = getDaysMatrix(year, month);
  const today = new Date();

  const contentTypes = [
    'Social Media Post',
    'Story', 
    'Video',
    'Carousel',
    'Blog Post',
    'Newsletter'
  ];

  const channels = [
    { name: 'Instagram', icon: '📷' },
    { name: 'Facebook', icon: '👥' },
    { name: 'Twitter', icon: '🐦' },
    { name: 'LinkedIn', icon: '💼' },
    { name: 'TikTok', icon: '🎵' },
    { name: 'YouTube', icon: '📺' }
  ];

  const statuses = ['Draft', 'Approved', 'Scheduled', 'Published'];

  const tags = [
    'Campaign', 'Promotion', 'Announcement', 'Tutorial', 'Behind the Scenes',
    'Trending', 'Community', 'Collaboration', 'Milestone', 'Event',
    'User Generated Content', 'Product Showcase', 'Educational', 
    'Entertainment', 'Seasonal'
  ];

  // Fetch entries when month changes
  React.useEffect(() => {
    fetchEntries();
    // Fetch user type for permission checks
    if (user?.id) {
      fetchUserType();
    }
  }, [currentMonth, user]);

  async function fetchUserType() {
    try {
      const res = await fetch(`/api/user/accessible-clients?user_id=${user?.id}`);
      if (res.ok) {
        const data = await res.json();
        setUserType(data.user_type || 'employee');
      }
    } catch (err) {
      console.error('Error fetching user type:', err);
    }
  }

  async function fetchEntries() {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const res = await fetch(`/api/clients/${clientId}/content-calendar?year=${year}&month=${month}&user_id=${user?.id || 1}`);
      if (!res.ok) throw new Error('Failed to fetch entries');
      const data = await res.json();
      setEntries(data);
    } catch (err) {
      console.error('Error fetching entries:', err);
      setEntries([]);
    }
    setLoading(false);
  }

  // Filtered entries based on filters
  function getFilteredEntries() {
    const filtered = entries.filter(entry => {
      const channelMatch = channelFilter === 'All' || entry.channel === channelFilter;
      const statusMatch = statusFilter === 'All' || (entry.status && entry.status.toLowerCase() === statusFilter.toLowerCase());
      return channelMatch && statusMatch;
    });
    return filtered;
  }

  function getEntriesForDate(date) {
    if (!date) return [];
    const dateStr = date.toISOString().split('T')[0];
    const filteredEntries = getFilteredEntries();
    
    // More flexible date matching
    const dateEntries = filteredEntries.filter(entry => {
      if (!entry.date) return false;
      // Handle both YYYY-MM-DD and other date formats
      const entryDateStr = entry.date.split('T')[0]; // Remove time part if present
      return entryDateStr === dateStr;
    });
    
    return dateEntries;
  }

  function openAddModal(date) {
    setSelectedDate(date);
    setFormData({
      contentType: '',
      files: [],
      existingFiles: [],
      artworkCopy: '',
      textCopy: '',
      channel: '',
      status: 'Draft',
      tags: [],
      clientFeedback: ''
    });
    setShowModal(true);
  }
  
  function closeModal() {
    setShowModal(false);
    setSelectedDate(null);
    setEditingContent(null); // Clear editing state
    setFormData({
      contentType: '',
      files: [],
      existingFiles: [],
      artworkCopy: '',
      textCopy: '',
      channel: '',
      status: 'Draft',
      tags: [],
      clientFeedback: ''
    });
  }

  function isToday(date) {
    if (!date) return false;
    return date.toDateString() === today.toDateString();
  }

  function handleInputChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  function handleTagSelect(e) {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    handleInputChange('tags', selectedOptions);
  }

  function handleFileUpload(e) {
    const files = Array.from(e.target.files);
    
    // Create object URLs immediately and store them
    const newFileUrls = new Map(fileObjectUrls);
    files.forEach(file => {
      const objectUrl = URL.createObjectURL(file);
      const fileId = `${file.name}_${file.lastModified}_${file.size}`;
      newFileUrls.set(fileId, objectUrl);
      console.log('Created object URL for:', file.name, objectUrl);
    });
    setFileObjectUrls(newFileUrls);
    
    handleInputChange('files', files);
  }

  async function handleSave() {
    // Validate required fields
    if (!formData.contentType || !formData.channel) {
      showAlert('Please fill in all required fields (Content Type and Channel)', '⚠️ Missing Fields');
      return;
    }
    if (!selectedDate) {
      showAlert('No date selected.', '⚠️ Missing Date');
      return;
    }
    setLoading(true);
    try {
      // Upload files first and get their info
      const uploadedFiles = [];
      for (const file of formData.files) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('file', file);
          const uploadRes = await fetch('/api/upload-file', {
            method: 'POST',
            body: uploadFormData
          });
          if (uploadRes.ok) {
            const fileData = await uploadRes.json();
            uploadedFiles.push({
              filename: fileData.filename,
              original_filename: fileData.original_filename,
              file_size: fileData.file_size,
              mime_type: fileData.mime_type
            });
          } else {
            showAlert('Failed to upload file: ' + file.name, '❌ File Upload Error');
            setLoading(false);
            return;
          }
        } catch (err) {
          showAlert('Failed to upload file: ' + file.name, '❌ File Upload Error');
          setLoading(false);
          return;
        }
      }
      const payload = {
        date: selectedDate.toISOString().split('T')[0],
        title: formData.artworkCopy || formData.contentType,
        contentType: formData.contentType,
        artworkCopy: formData.artworkCopy,
        textCopy: formData.textCopy,
        channel: formData.channel,
        status: formData.status,
        tags: formData.tags,
        clientFeedback: formData.clientFeedback,
        user_id: user?.id || 1,
        files: [...uploadedFiles, ...(formData.existingFiles || [])] // Combine new and existing files
      };
      let res;
      if (editingContent) {
        res = await fetch(`/api/content-calendar/${editingContent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/clients/${clientId}/content-calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
      const responseData = await res.json();
      if (!res.ok) throw new Error(responseData.error || 'Failed to save content');
      showAlert(editingContent ? 'Content updated successfully!' : 'Content saved successfully!', '✅ Success');
      closeModal();
      // Force immediate refresh and wait for it to complete
      await fetchEntries();
      // Small delay to ensure UI updates
      setTimeout(() => {
        setLoading(false);
      }, 100);
    } catch (err) {
      console.error('Error saving content:', err);
      showAlert('Failed to save content. Please try again.', '❌ Error');
      setLoading(false);
    }
  }

  function openViewModal(content) {
    setSelectedContent(content);
    setShowViewModal(true);
  }

  function closeViewModal() {
    setShowViewModal(false);
    setSelectedContent(null);
  }

  function handleEdit(content) {
    setEditingContent(content); // Set the content we're editing
    setSelectedDate(new Date(content.date));
    setFormData({
      contentType: content.contentType || content.content_type,
      files: [], // New files to upload
      existingFiles: content.files || [], // Keep existing files
      artworkCopy: content.artworkCopy || content.artwork_copy || content.description || '',
      textCopy: content.textCopy || content.text_copy || '',
      channel: content.channel || content.platform,
      status: content.status.charAt(0).toUpperCase() + content.status.slice(1),
      tags: content.tags || [],
      clientFeedback: content.clientFeedback || content.client_feedback || ''
    });
    closeViewModal();
    setShowModal(true);
  }

  async function handleDelete(contentId) {
    showConfirm('Are you sure you want to delete this content?', '🗑️ Delete Content', async () => {
      try {
        const res = await fetch(`/api/content-calendar/${contentId}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user?.id || 1 })
        });
        if (!res.ok) throw new Error('Failed to delete content');
        
        closeViewModal();
        fetchEntries(); // Refresh the calendar
        showAlert('Content deleted successfully!', '✅ Deleted');
      } catch (err) {
        console.error('Error deleting content:', err);
        showAlert('Failed to delete content. Please try again.', '❌ Error');
      }
    });
  }

  async function handlePin(contentId) {
    try {
      const res = await fetch(`/api/content-calendar/${contentId}/pin`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Failed to pin content');
      
      fetchEntries(); // Refresh the calendar
      showAlert('Content pinned successfully!', '📌 Pinned');
    } catch (err) {
      console.error('Error pinning content:', err);
      showAlert('Failed to pin content. Please try again.', '❌ Error');
    }
  }

  async function submitClientFeedback(status) {
    if (!selectedContent) return;
    
    try {
      const res = await fetch(`/api/content-calendar/${selectedContent.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: clientId,
          user_id: user?.id,
          comment: clientFeedback,
          approval_status: status
        })
      });
      
      if (!res.ok) throw new Error('Failed to submit feedback');
      
      setApprovalStatus(status);
      fetchEntries(); // Refresh the calendar
      showAlert(`Content ${status} successfully!`, status === 'approved' ? '✅ Approved' : '❌ Disapproved');
    } catch (err) {
      console.error('Error submitting feedback:', err);
      showAlert('Failed to submit feedback. Please try again.', '❌ Error');
    }
  }

  function isVideoFile(filename) {
    if (!filename) return false;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv'];
    return videoExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  function isImageFile(filename) {
    if (!filename) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  // Custom modal functions
  function showAlert(message, title = '✅ Success') {
    setCustomModal({ 
      show: true, 
      type: 'alert', 
      title: title, 
      message: message, 
      onConfirm: () => setCustomModal({ show: false, type: '', title: '', message: '', onConfirm: null })
    });
  }

  function showConfirm(message, title = '⚠️ Confirm Action', onConfirm) {
    setCustomModal({ 
      show: true, 
      type: 'confirm', 
      title: title, 
      message: message, 
      onConfirm: () => {
        setCustomModal({ show: false, type: '', title: '', message: '', onConfirm: null });
        if (onConfirm) onConfirm();
      }
    });
  }

  function closeCustomModal() {
    setCustomModal({ show: false, type: '', title: '', message: '', onConfirm: null });
  }

  function removeExistingFile(fileIndex) {
    const updatedFiles = formData.existingFiles.filter((_, index) => index !== fileIndex);
    setFormData(prev => ({
      ...prev,
      existingFiles: updatedFiles
    }));
  }

  function openAIGeneratorModal() {
    setShowAIModal(true);
  }

  function closeAIModal() {
    setShowAIModal(false);
    setAiFormData({
      clientType: '',
      brandIdentity: '',
      productsServices: '',
      targetCustomer: '',
      painPoints: '',
      seasonalEvents: '',
      brandTone: '',
      competitors: '',
      platforms: [],
      postsPerWeek: '',
      includeTrending: false,
      optimalTiming: false
    });
  }

  function handleAiInputChange(field, value) {
    setAiFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  function handlePlatformToggle(platform) {
    setAiFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter(p => p !== platform)
        : [...prev.platforms, platform]
    }));
  }

  async function generateAIContent() {
    // Validate required fields
    if (!aiFormData.brandIdentity || !aiFormData.targetCustomer || !aiFormData.brandTone) {
      showAlert('Please fill in the required fields: Brand Identity, Target Customer, and Brand Tone', '⚠️ Missing Information');
      return;
    }

    setAiGenerating(true);
    
    try {
      // Prepare answers array for the backend
      const answers = [
        aiFormData.clientType,
        aiFormData.brandIdentity,
        aiFormData.productsServices,
        aiFormData.targetCustomer,
        aiFormData.painPoints,
        aiFormData.seasonalEvents,
        aiFormData.brandTone,
        aiFormData.competitors,
        aiFormData.platforms.join(', '),
        aiFormData.postsPerWeek,
        aiFormData.includeTrending ? 'Yes, include trending content suggestions' : 'No trending content needed',
        aiFormData.optimalTiming ? 'Yes, suggest optimal posting times' : 'Use standard posting recommendations'
      ];

      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ answers })
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data = await response.json();
      
      // Parse the generated content and save to calendar
      await parseAndSaveGeneratedContent(data.content_plan);
      
      showAlert('30 days of content generated and saved to your calendar successfully!', '🎉 AI Content Generated');
      closeAIModal();
      await fetchEntries(); // Refresh the calendar
      
    } catch (error) {
      console.error('Error generating AI content:', error);
      showAlert('Failed to generate content. Please try again.', '❌ Generation Failed');
    } finally {
      setAiGenerating(false);
    }
  }

  async function parseAndSaveGeneratedContent(contentPlan) {
    try {
      // Parse the AI response and extract daily content suggestions
      const lines = contentPlan.split('\n').filter(line => line.trim());
      const startDate = new Date();
      startDate.setDate(1); // Start from first day of current month
      
      for (let i = 0; i < Math.min(lines.length, 30); i++) {
        const line = lines[i].trim();
        if (!line || line.length < 10) continue; // Skip empty or very short lines
        
        // Calculate the date for this content
        const contentDate = new Date(startDate);
        contentDate.setDate(startDate.getDate() + i);
        
        // Parse the line to extract platform and content
        let platform = 'Instagram'; // Default platform
        let contentText = line;
        
        // Try to extract platform from the line
        const platformMatches = line.match(/(Instagram|Facebook|Twitter|LinkedIn|TikTok|YouTube)/i);
        if (platformMatches) {
          platform = platformMatches[1];
        }
        
        // Clean up the content text
        contentText = line.replace(/^\d+\.?\s*/, '').replace(/(Instagram|Facebook|Twitter|LinkedIn|TikTok|YouTube):\s*/i, '');
        
        // Determine content type based on the content
        let contentType = 'Social Media Post';
        if (contentText.toLowerCase().includes('video') || contentText.toLowerCase().includes('reel')) {
          contentType = 'Video';
        } else if (contentText.toLowerCase().includes('story')) {
          contentType = 'Story';
        } else if (contentText.toLowerCase().includes('carousel')) {
          contentType = 'Carousel';
        }
        
        // Save to calendar
        const payload = {
          date: contentDate.toISOString().split('T')[0],
          title: contentText.substring(0, 50) + (contentText.length > 50 ? '...' : ''),
          contentType: contentType,
          artworkCopy: contentText,
          textCopy: contentText,
          channel: platform,
          status: 'Draft',
          tags: ['AI Generated'],
          clientFeedback: '',
          user_id: user?.id || 1,
          files: []
        };
        
        await fetch(`/api/clients/${clientId}/content-calendar`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }
    } catch (error) {
      console.error('Error parsing and saving generated content:', error);
      throw error;
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#111', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <style>{`
        .calendar-container {
          background: #181818;
          border-radius: 18px;
          box-shadow: 0 4px 32px rgba(255, 214, 0, 0.1);
          padding: 2rem;
          border: 2px solid #FFD600;
          width: 100%;
          max-width: 1200px;
        }
        .calendar-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          padding: 0 1rem;
        }
        .nav-btn {
          background: #FFD600;
          color: #111;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 20px;
          padding: 12px 20px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .nav-btn:hover {
          background: #fff200;
          transform: translateY(-2px) scale(1.04);
          box-shadow: 0 4px 16px rgba(255, 214, 0, 0.3);
        }
        .month-title {
          font-size: 32px;
          font-weight: 900;
          color: #FFD600;
          letter-spacing: 1px;
        }
        .day-header {
          background: #FFD600;
          color: #111;
          font-weight: 900;
          font-size: 16px;
          padding: 12px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .day-cell {
          background: #222;
          border: 2px solid #333;
          border-radius: 12px;
          min-height: 120px;
          padding: 12px;
          position: relative;
          transition: all 0.3s;
          cursor: pointer;
          display: flex;
          flex-direction: column;
        }
        .day-cell:hover {
          border-color: #FFD600;
          box-shadow: 0 4px 20px rgba(255, 214, 0, 0.2);
          transform: translateY(-2px);
        }
        .day-cell.today {
          background: #2a1a00;
          border: 2px solid #FFD600;
          box-shadow: 0 0 15px rgba(255, 214, 0, 0.3);
        }
        .day-cell.today:hover {
          background: #3a2500;
          box-shadow: 0 4px 25px rgba(255, 214, 0, 0.4);
        }
        .day-number {
          font-size: 18px;
          font-weight: 700;
          color: #FFD600;
          margin-bottom: 8px;
        }
        .day-number.today {
          color: #fff200;
          text-shadow: 0 0 8px rgba(255, 214, 0, 0.5);
        }
        .content-item {
          background: #333;
          border: 1px solid #FFD600;
          border-radius: 6px;
          padding: 4px 8px;
          margin-bottom: 4px;
          font-size: 11px;
          color: #FFD600;
          font-weight: 600;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s;
        }
        .content-item:hover {
          background: #FFD600;
          color: #111;
        }
        .content-item.draft {
          border-color: #fbc02d;
          color: #fbc02d;
        }
        .content-item.approved {
          border-color: #4caf50;
          color: #4caf50;
        }
        .content-item.scheduled {
          border-color: #2196f3;
          color: #2196f3;
        }
        .content-item.published {
          border-color: #9c27b0;
          color: #9c27b0;
        }
        .add-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #FFD600;
          color: #111;
          border: none;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .day-cell:hover .add-btn {
          opacity: 1;
        }
        .add-btn:hover {
          background: #fff200;
          transform: scale(1.1);
        }
        .empty-cell {
          background: #1a1a1a;
          border: 2px solid #2a2a2a;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 1rem;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-content {
          background: #181818;
          border: 2px solid #FFD600;
          border-radius: 18px;
          padding: 2rem;
          width: 90vw;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
          box-shadow: 0 8px 32px rgba(255, 214, 0, 0.2);
        }
        .modal-close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          color: #FFD600;
          font-size: 24px;
          cursor: pointer;
          font-weight: 700;
          transition: color 0.2s;
        }
        .modal-close:hover {
          color: #fff200;
        }
        .modal-title {
          color: #FFD600;
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 2rem;
          padding-right: 2rem;
        }
        .form-group {
          margin-bottom: 1.5rem;
        }
        .form-label {
          display: block;
          color: #FFD600;
          font-weight: 700;
          margin-bottom: 0.5rem;
        }
        .form-input {
          width: 100%;
          padding: 12px;
          border: 2px solid #333;
          border-radius: 8px;
          background: #222;
          color: #fff;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-input:focus {
          outline: none;
          border-color: #FFD600;
        }
        .form-textarea {
          width: 100%;
          padding: 12px;
          border: 2px solid #333;
          border-radius: 8px;
          background: #222;
          color: #fff;
          font-size: 14px;
          min-height: 80px;
          resize: vertical;
          transition: border-color 0.2s;
        }
        .form-textarea:focus {
          outline: none;
          border-color: #FFD600;
        }
        .form-select {
          width: 100%;
          padding: 12px;
          border: 2px solid #333;
          border-radius: 8px;
          background: #222;
          color: #fff;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-select:focus {
          outline: none;
          border-color: #FFD600;
        }
        .file-upload-area {
          border: 2px dashed #333;
          border-radius: 8px;
          padding: 2rem;
          text-align: center;
          background: #222;
          transition: border-color 0.2s;
          cursor: pointer;
        }
        .file-upload-area:hover {
          border-color: #FFD600;
        }
        .file-upload-text {
          color: #888;
          margin-bottom: 0.5rem;
        }
        .file-upload-note {
          color: #666;
          font-size: 12px;
        }
        .btn-primary {
          background: #FFD600;
          color: #111;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
          margin-bottom: 1rem;
        }
        .btn-primary:hover {
          background: #fff200;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(255, 214, 0, 0.3);
        }
        .btn-secondary {
          background: #333;
          color: #FFD600;
          border: 2px solid #FFD600;
          border-radius: 10px;
          font-weight: 700;
          font-size: 16px;
          padding: 12px 24px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        .btn-secondary:hover {
          background: #FFD600;
          color: #111;
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(255, 214, 0, 0.3);
        }
        .read-only {
          background: #1a1a1a;
          color: #888;
          cursor: not-allowed;
        }
        .tag-select {
          width: 100%;
          padding: 12px;
          border: 2px solid #333;
          border-radius: 8px;
          background: #222;
          color: #fff;
          font-size: 14px;
          min-height: 120px;
        }
        .tag-select:focus {
          outline: none;
          border-color: #FFD600;
        }
      `}</style>
      
      <div className="calendar-container">
        {/* Content Creator Agent Button */}
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <button 
            className="btn-primary" 
            style={{ 
              background: '#FFD600', 
              color: '#111', 
              border: 'none', 
              borderRadius: '12px', 
              fontSize: '18px', 
              fontWeight: '900', 
              padding: '16px 32px', 
              cursor: 'pointer', 
              transition: 'all 0.2s',
              boxShadow: '0 4px 16px rgba(255, 214, 0, 0.3)'
            }}
            onClick={() => {
              openAIGeneratorModal();
            }}
            onMouseOver={e => {
              e.target.style.background = '#fff200';
              e.target.style.transform = 'translateY(-2px) scale(1.02)';
              e.target.style.boxShadow = '0 6px 20px rgba(255, 214, 0, 0.4)';
            }}
            onMouseOut={e => {
              e.target.style.background = '#FFD600';
              e.target.style.transform = 'translateY(0) scale(1)';
              e.target.style.boxShadow = '0 4px 16px rgba(255, 214, 0, 0.3)';
            }}
          >
            🧠 Content Creator Agent — Auto-Generate 30 Days Content
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div>
            <label style={{ color: '#FFD600', fontWeight: 'bold', marginRight: '8px' }}>Channel:</label>
            <select value={channelFilter} onChange={e => setChannelFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', background: '#222', color: '#FFD600', border: '1px solid #FFD600' }}>
              <option value="All">All</option>
              {channels.map(ch => (
                <option key={ch.name} value={ch.name}>{ch.icon} {ch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ color: '#FFD600', fontWeight: 'bold', marginRight: '8px' }}>Status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '6px 12px', borderRadius: '6px', background: '#222', color: '#FFD600', border: '1px solid #FFD600' }}>
              <option value="All">All</option>
              {statuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Calendar Navigation */}
        <div className="calendar-nav">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="nav-btn">&lt;</button>
          <span className="month-title">{currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="nav-btn">&gt;</button>
        </div>
        
        {/* Day Headers */}
        <div className="calendar-grid">
          {dayNames.map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="calendar-grid">
          {days.map((date, idx) => {
            const dateEntries = getEntriesForDate(date);
            return (
              <div
                key={idx}
                className={`day-cell ${!date ? 'empty-cell' : ''} ${isToday(date) ? 'today' : ''}`}
              >
                {date && (
                  <>
                    <div className={`day-number ${isToday(date) ? 'today' : ''}`}>{date.getDate()}</div>
                    {userType === 'employee' && (
                      <button
                        className="add-btn"
                        onClick={e => { e.stopPropagation(); openAddModal(date); }}
                        title="Add content"
                      >
                        +
                      </button>
                    )}
                    {/* Content entries */}
                    <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                      {dateEntries.map((entry, entryIdx) => (
                        <div 
                          key={entry.id || entryIdx} 
                          className={`content-item ${entry.status || 'draft'}`}
                          title={`${entry.content_type || 'Content'} - ${entry.channel || 'Channel'}`}
                          onClick={e => { e.stopPropagation(); openViewModal(entry); }}
                        >
                          {entry.content_type || 'Content'}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Add Content Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>×</button>
            <h2 className="modal-title">
              {editingContent ? '✏️ Edit Content' : '✏️ Add Content'} for {selectedDate && selectedDate.toLocaleDateString()}
            </h2>
            
            {/* Submitted By */}
            <div className="form-group">
              <label className="form-label">Submitted By</label>
              <input 
                type="text" 
                className="form-input read-only" 
                value="Current User" 
                readOnly 
              />
            </div>

            {/* Type of Content */}
            <div className="form-group">
              <label className="form-label">Type of Content *</label>
              <select 
                className="form-select"
                value={formData.contentType}
                onChange={(e) => handleInputChange('contentType', e.target.value)}
              >
                <option value="">Select content type...</option>
                {contentTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Files Upload */}
            <div className="form-group">
              <label className="form-label">Files Upload</label>
              
              {/* Existing Files Display (only when editing) */}
              {editingContent && formData.existingFiles && formData.existingFiles.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ color: '#FFD600', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    Current Attachments:
                  </div>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {formData.existingFiles.map((file, index) => {
                      const fileName = file.original_filename || file.filename || `File ${index + 1}`;
                      const fileType = file.mime_type || file.type || '';
                      const fileUrl = file.url || `/api/files/${file.filename}`;
                      
                      return (
                        <div key={index} style={{ 
                          background: '#2a2a2a', 
                          borderRadius: '8px', 
                          padding: '12px',
                          border: '1px solid #444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                            {/* File preview/icon */}
                            {isImageFile(fileName) ? (
                              <img 
                                src={fileUrl} 
                                alt={fileName}
                                style={{ 
                                  width: '40px', 
                                  height: '40px', 
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                            ) : isVideoFile(fileName) ? (
                              <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                background: '#333',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                              }}>
                                🎬
                              </div>
                            ) : (
                              <div style={{ 
                                width: '40px', 
                                height: '40px', 
                                background: '#333',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '20px'
                              }}>
                                📄
                              </div>
                            )}
                            
                            {/* File info */}
                            <div>
                              <div style={{ color: '#FFD600', fontWeight: 'bold', fontSize: '14px' }}>
                                {fileName}
                              </div>
                              {fileType && (
                                <div style={{ color: '#888', fontSize: '12px' }}>
                                  {fileType}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => removeExistingFile(index)}
                              style={{
                                background: '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                              }}
                              title="Remove file"
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* New file upload area */}
              <div className="file-upload-area" onClick={() => document.getElementById('file-input').click()}>
                <div className="file-upload-text">
                  {editingContent ? 'Add more files or click to browse' : 'Drop files here or click to browse'}
                </div>
                <div className="file-upload-note">Original files are preserved exactly as uploaded</div>
                <input 
                  id="file-input"
                  type="file" 
                  multiple 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
                {formData.files.length > 0 && (
                  <div style={{ marginTop: '10px', color: '#FFD600' }}>
                    {formData.files.length} new file(s) selected
                  </div>
                )}
              </div>
            </div>

            {/* Artwork Copy */}
            <div className="form-group">
              <label className="form-label">Artwork Copy</label>
              <textarea 
                className="form-textarea"
                placeholder="Describe the artwork or visual elements..."
                value={formData.artworkCopy}
                onChange={(e) => handleInputChange('artworkCopy', e.target.value)}
              />
            </div>

            {/* Text Copy / Caption */}
            <div className="form-group">
              <label className="form-label">Text Copy / Caption</label>
              <textarea 
                className="form-textarea"
                placeholder="Write your caption or text content..."
                value={formData.textCopy}
                onChange={(e) => handleInputChange('textCopy', e.target.value)}
              />
            </div>

            {/* Channels */}
            <div className="form-group">
              <label className="form-label">Channel</label>
              <select 
                className="form-select"
                value={formData.channel}
                onChange={(e) => handleInputChange('channel', e.target.value)}
              >
                <option value="">Select a channel...</option>
                {channels.map(channel => (
                  <option key={channel.name} value={channel.name}>
                    {channel.icon} {channel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div className="form-group">
              <label className="form-label">Status</label>
              <select 
                className="form-select"
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="form-group">
              <label className="form-label">Tags</label>
              <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple tags
              </div>
              <select 
                multiple
                className="tag-select"
                value={formData.tags}
                onChange={handleTagSelect}
                style={{ minHeight: '80px' }}
              >
                {tags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            {/* Client Feedback */}
            <div className="form-group">
              <label className="form-label">Client Feedback</label>
              <textarea 
                className="form-textarea read-only"
                placeholder="Client feedback will appear here once submitted through their client portal"
                value={formData.clientFeedback}
                readOnly
              />
              <div style={{ color: '#FFD600', fontSize: '13px', marginTop: '6px', display: 'flex', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', marginRight: '6px' }}>ℹ️</span>
                Client feedback will appear here once submitted through their client portal
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ marginTop: '2rem' }}>
              <button className="btn-secondary" onClick={handleSave}>
                💾 {editingContent ? 'Update Content' : 'Save Content'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* View Content Modal */}
      {showViewModal && selectedContent && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px', width: '95vw', maxHeight: '90vh', overflow: 'auto', position: 'relative' }}>
            <button className="modal-close" onClick={closeViewModal}>×</button>
            <h2 className="modal-title">{selectedContent.content_type} - {selectedContent.channel}</h2>
            
            {/* Status Badge at the top */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'inline-block',
                padding: '8px 16px',
                borderRadius: '20px',
                background: selectedContent.status === 'published' ? '#9c27b0' : 
                           selectedContent.status === 'scheduled' ? '#2196f3' :
                           selectedContent.status === 'approved' ? '#4caf50' : '#fbc02d',
                color: 'white',
                fontWeight: 'bold',
                textTransform: 'capitalize',
                fontSize: '14px'
              }}>
                {selectedContent.status}
              </div>
            </div>

            {/* Files/Attachments Section */}
            <div className="form-group">
              <label className="form-label">Attachments</label>
              {selectedContent.files && selectedContent.files.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
                  {selectedContent.files.map((file, index) => {
                    const fileName = file.original_filename || file.filename || `File ${index + 1}`;
                    const fileType = file.mime_type || file.type || '';
                    const fileUrl = file.url || `/api/files/${file.filename}`;
                    
                    return (
                      <div key={index} style={{ 
                        background: '#222', 
                        borderRadius: '8px', 
                        padding: '16px',
                        border: '1px solid #333'
                      }}>
                        <div style={{ color: '#FFD600', fontWeight: 'bold', marginBottom: '8px' }}>
                          📎 {fileName}
                          {fileType && (
                            <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>
                              ({fileType})
                            </span>
                          )}
                        </div>
                        
                        {fileUrl && isVideoFile(fileName) ? (
                          <div style={{ marginTop: '8px' }}>
                            <div style={{ marginBottom: '8px', fontSize: '12px', color: '#FFD600' }}>
                              🎬 Video File: {fileName}
                            </div>
                            <video 
                              controls 
                              preload="metadata"
                              width="100%"
                              style={{ 
                                maxHeight: '400px', 
                                borderRadius: '4px',
                                background: '#000',
                                border: '1px solid #FFD600'
                              }}
                              onError={(e) => {
                                console.error('❌ Video error:', e.target.error);
                                console.log('Video src:', fileUrl);
                              }}
                              onLoadStart={() => console.log('🔄 Video loading:', fileName)}
                              onCanPlay={() => console.log('✅ Video ready to play:', fileName)}
                              onPlay={() => console.log('▶️ Video started playing:', fileName)}
                            >
                              <source src={fileUrl} type={fileType} />
                              {/* Fallback source */}
                              <source src={fileUrl} />
                              <p style={{ color: '#ff6b6b', padding: '20px', textAlign: 'center' }}>
                                Your browser does not support the video tag.
                                <br />
                                <a href={fileUrl} download={fileName} style={{ color: '#FFD600' }}>
                                  Download video file
                                </a>
                              </p>
                            </video>
                            
                            {/* Download button only */}
                            <div style={{ textAlign: 'center', marginTop: '8px' }}>
                              <a 
                                href={fileUrl} 
                                download={fileName}
                                style={{
                                  background: '#FFD600',
                                  color: '#111',
                                  textDecoration: 'none',
                                  borderRadius: '6px',
                                  padding: '8px 16px',
                                  fontSize: '12px',
                                  fontWeight: 'bold',
                                  display: 'inline-block',
                                  transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#fff200'}
                                onMouseOut={(e) => e.target.style.background = '#FFD600'}
                              >
                                📥 Download Video
                              </a>
                            </div>
                          </div>
                        ) : fileUrl && isImageFile(fileName) ? (
                          <img 
                            src={fileUrl} 
                            alt={fileName}
                            style={{ 
                              width: '100%', 
                              maxHeight: '400px', 
                              objectFit: 'contain',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                            onClick={() => window.open(fileUrl, '_blank')}
                            title="Click to view full size"
                          />
                        ) : (
                          <div 
                            style={{ 
                              padding: '20px', 
                              textAlign: 'center', 
                              background: '#333',
                              borderRadius: '4px',
                              color: '#ccc',
                              cursor: fileUrl ? 'pointer' : 'default'
                            }}
                            onClick={() => fileUrl && window.open(fileUrl, '_blank')}
                          >
                            📄 {fileName}
                            <div style={{ fontSize: '12px', marginTop: '4px' }}>
                              {fileUrl ? 'Click to download/view' : 'File attached'}
                            </div>
                            {fileType && (
                              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                Type: {fileType}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ 
                  color: '#888', 
                  fontStyle: 'italic', 
                  marginTop: '12px',
                  padding: '16px',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  No attachments
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label className="form-label">Date Scheduled</label>
              <input 
                type="text" 
                className="form-input read-only" 
                value={new Date(selectedContent.date).toLocaleDateString()} 
                readOnly 
              />
            </div>

            <div className="form-group">
              <label className="form-label">Submitted By</label>
              <input 
                type="text" 
                className="form-input read-only" 
                value="Current User" 
                readOnly 
              />
            </div>

            {selectedContent.artwork_copy && (
              <div className="form-group">
                <label className="form-label">Artwork Copy</label>
                <textarea 
                  className="form-textarea read-only"
                  value={selectedContent.artwork_copy}
                  readOnly
                  style={{ minHeight: '100px' }}
                />
              </div>
            )}

            {selectedContent.text_copy && (
              <div className="form-group">
                <label className="form-label">Text Copy / Caption</label>
                <textarea 
                  className="form-textarea read-only"
                  value={selectedContent.text_copy}
                  readOnly
                  style={{ minHeight: '100px' }}
                />
              </div>
            )}

            {selectedContent.tags && selectedContent.tags.length > 0 && (
              <div className="form-group">
                <label className="form-label">Tags</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                  {selectedContent.tags.map((tag, index) => (
                    <span key={index} style={{
                      background: '#333',
                      color: '#FFD600',
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      border: '1px solid #FFD600'
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedContent.client_feedback && (
              <div className="form-group">
                <label className="form-label">Client Feedback</label>
                <textarea 
                  className="form-textarea read-only"
                  value={selectedContent.client_feedback}
                  readOnly
                  style={{ minHeight: '100px' }}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              marginTop: '2rem', 
              display: 'flex', 
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              {userType === 'employee' ? (
                <>
                  <button 
                    onClick={() => handleEdit(selectedContent)}
                    style={{
                      background: '#FFD600',
                      color: '#111',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Edit content"
                  >
                    ✏️ Modify
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedContent.id)}
                    style={{
                      background: '#ff4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                    title="Delete content"
                  >
                    🗑️ Delete
                  </button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1 }}>
                    <label className="form-label">Your Feedback</label>
                    <textarea
                      className="form-textarea"
                      value={clientFeedback}
                      onChange={e => setClientFeedback(e.target.value)}
                      style={{ minHeight: '80px', width: '100%' }}
                      placeholder="Add your feedback here..."
                    />
                  </div>
                  <button
                    style={{
                      background: approvalStatus === 'approved' ? '#4caf50' : '#FFD600',
                      color: '#111',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginLeft: '12px'
                    }}
                    onClick={() => submitClientFeedback('approved')}
                  >
                    ✅ Approve
                  </button>
                  <button
                    style={{
                      background: approvalStatus === 'disapproved' ? '#ff4444' : '#FFD600',
                      color: '#111',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginLeft: '8px'
                    }}
                    onClick={() => submitClientFeedback('disapproved')}
                  >
                    ❌ Disapprove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Themed Modal */}
      {customModal.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000
        }}>
          <div style={{
            background: '#181818',
            border: '2px solid #FFD600',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 8px 32px rgba(255, 214, 0, 0.3)',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: '#FFD600',
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              {customModal.title}
            </h3>
            
            <p style={{
              color: '#fff',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '2rem'
            }}>
              {customModal.message}
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              {customModal.type === 'confirm' && (
                <button
                  onClick={closeCustomModal}
                  style={{
                    background: '#FFD600',
                    color: '#111',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>✅ Confirm</span>
                </button>
              )}
              <button
                onClick={closeCustomModal}
                style={{
                  background: customModal.type === 'alert' ? '#4caf50' : '#333',
                  color: customModal.type === 'alert' ? '#111' : '#FFD600',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {customModal.type === 'alert' ? '🎉 Great!' : '❌ Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Move any reusable business logic to core/businessLogic.js for architecture consistency. */}
    </div>
  );
}