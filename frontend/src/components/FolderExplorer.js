import React, { useState, useEffect } from 'react';
import './FolderExplorer.css';

const FolderExplorer = () => {
  const [selectedFolder, setSelectedFolder] = useState('build');
  const [folderContents, setFolderContents] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const folders = [
    { 
      name: 'build', 
      title: 'Build Artifacts', 
      description: 'Built web applications and compiled assets',
      icon: '🏗️'
    },
    { 
      name: '.storage', 
      title: 'Storage System', 
      description: 'File storage and data management',
      icon: '💾'
    },
    { 
      name: 'cover', 
      title: 'Cover Assets', 
      description: 'Cover images and visual assets',
      icon: '🖼️'
    },
    { 
      name: 'workspace', 
      title: 'Development Workspace', 
      description: 'Development environments and projects',
      icon: '💻'
    }
  ];

  const fetchFolderContents = async (folderName) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:10000/api/folders/${folderName}`);
      if (response.ok) {
        const data = await response.json();
        setFolderContents(prev => ({
          ...prev,
          [folderName]: data
        }));
      }
    } catch (error) {
      console.error('Error fetching folder contents:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFolderContents(selectedFolder);
  }, [selectedFolder]);

  const renderFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    switch (ext) {
      case 'html': return '🌐';
      case 'js': return '📜';
      case 'css': return '🎨';
      case 'json': return '📋';
      case 'md': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'svg': return '🖼️';
      case 'pdf': return '📄';
      default: return '📄';
    }
  };

  const handleFileClick = (fileName, folderName) => {
    // Handle file preview/download
    if (fileName.endsWith('.html')) {
      // Open HTML files in new tab
      window.open(`http://localhost:10000/api/serve/${folderName}/${fileName}`, '_blank');
    } else if (fileName.match(/\.(jpg|jpeg|png|svg)$/i)) {
      // Show image preview
      setSelectedFile({ name: fileName, folder: folderName, type: 'image' });
    } else {
      // Download other files
      const link = document.createElement('a');
      link.href = `http://localhost:10000/api/download/${folderName}/${fileName}`;
      link.download = fileName;
      link.click();
    }
  };

  const currentFolderData = folders.find(f => f.name === selectedFolder);
  const contents = folderContents[selectedFolder] || [];

  return (
    <div className="folder-explorer">
      <div className="folder-explorer-header">
        <h2>📁 Project Folders Explorer</h2>
        <p>Browse and access project files and build artifacts</p>
      </div>

      <div className="folder-tabs">
        {folders.map(folder => (
          <button
            key={folder.name}
            className={`folder-tab ${selectedFolder === folder.name ? 'active' : ''}`}
            onClick={() => setSelectedFolder(folder.name)}
          >
            <span className="folder-icon">{folder.icon}</span>
            <span className="folder-title">{folder.title}</span>
          </button>
        ))}
      </div>

      <div className="folder-content">
        <div className="folder-header">
          <h3>
            {currentFolderData?.icon} {currentFolderData?.title}
          </h3>
          <p>{currentFolderData?.description}</p>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Loading folder contents...</p>
          </div>
        ) : (
          <div className="file-grid">
            {contents.length === 0 ? (
              <div className="empty-folder">
                <p>📂 This folder is empty or couldn't be loaded</p>
              </div>
            ) : (
              contents.map((item, index) => (
                <div 
                  key={index} 
                  className={`file-item ${item.type}`}
                  onClick={() => item.type === 'file' && handleFileClick(item.name, selectedFolder)}
                >
                  <div className="file-icon">
                    {item.type === 'directory' ? '📁' : renderFileIcon(item.name)}
                  </div>
                  <div className="file-info">
                    <div className="file-name">{item.name}</div>
                    <div className="file-meta">
                      {item.type === 'directory' ? 'Folder' : 'File'}
                      {item.size && ` • ${item.size}`}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h4>🚀 Quick Actions</h4>
        <div className="action-buttons">
          {selectedFolder === 'build' && (
            <button 
              className="action-btn"
              onClick={() => window.open('http://localhost:10000/api/serve/build/v1/index.html', '_blank')}
            >
              🌐 View Build v1
            </button>
          )}
          {selectedFolder === 'workspace' && (
            <button 
              className="action-btn"
              onClick={() => window.open('http://localhost:10000/api/serve/workspace/shadcn-ui/index.html', '_blank')}
            >
              💻 Open Shadcn UI Project
            </button>
          )}
          {selectedFolder === 'cover' && (
            <button 
              className="action-btn"
              onClick={() => window.open('http://localhost:10000/api/serve/cover', '_blank')}
            >
              🖼️ View Cover Gallery
            </button>
          )}
          <button 
            className="action-btn secondary"
            onClick={() => fetchFolderContents(selectedFolder)}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderExplorer;
