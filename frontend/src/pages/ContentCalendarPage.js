import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ContentForm from '../components/ContentForm';
import SidebarNavigation from '../components/SidebarNavigation';
import SocialMediaAccounts from '../components/SocialMediaAccounts';
import './ContentCalendarPage.css';

const ContentCalendarPage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await axios.get('/api/content/posts');
      setPosts(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch posts');
      setLoading(false);
    }
  };

  const handlePostSubmit = async (postData) => {
    try {
      const response = await axios.post('/api/content/posts', postData);
      setPosts([...posts, response.data]);
    } catch (err) {
      console.error('Failed to create post:', err);
    }
  };

  const handlePostUpdate = async (id, updatedData) => {
    try {
      const response = await axios.put(`/api/content/posts/${id}`, updatedData);
      const updatedPost = response.data;
      
      setPosts(posts.map(post => post._id === id ? updatedPost : post));
      
      // Auto-publish if post is approved and has social media settings
      if (updatedData.status === 'approved') {
        // Check if auto-publish is enabled for any connected platforms
        const autoPublishPlatforms = Object.keys(connectedAccounts).filter(
          platform => connectedAccounts[platform]?.connected && connectedAccounts[platform]?.auto_publish
        );
        
        if (autoPublishPlatforms.length > 0) {
          try {
            const publishData = {
              content: `${updatedPost.title}\n\n${updatedPost.content}`,
              platforms: autoPublishPlatforms
            };
            
            const publishResponse = await axios.post('/api/social-media/publish', publishData);
            
            if (publishResponse.data.success) {
              console.log('Auto-published to:', publishResponse.data.results);
              alert(`Post approved and auto-published to: ${autoPublishPlatforms.join(', ')}`);
            }
          } catch (publishError) {
            console.error('Auto-publish failed:', publishError);
            alert('Post approved but auto-publish failed');
          }
        }
        
        // If it's a sponsored post, create ads request
        if (updatedPost.isSponsored && updatedPost.preferredDays?.length === 2) {
          try {
            const adsRequestData = {
              brand: 'Content Creator',
              campaign: updatedPost.title,
              description: updatedPost.content,
              budget: updatedPost.sponsorDetails?.budget ? `$${updatedPost.sponsorDetails.budget}` : '$0',
              contact_email: 'content@marketing-lab.local',
              deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              urgency: (updatedPost.sponsorDetails?.budget || 0) > 100 ? 'high' : 'medium',
              preferred_days: updatedPost.preferredDays,
              target_audience: updatedPost.sponsorDetails?.targetAudience || 'General audience',
              content_id: updatedPost._id,
              status: 'pending',
              source: 'content_calendar'
            };

            await axios.post('/api/ads/incoming-requests', adsRequestData);
            console.log('Sponsored content added to ads requests');
            alert('Post approved and added to ads queue for sponsorship!');
          } catch (adsError) {
            console.error('Failed to create ads request:', adsError);
          }
        }
      }
    } catch (err) {
      console.error('Failed to update post:', err);
    }
  };

  const handlePostDelete = async (id) => {
    try {
      await axios.delete(`/api/content/posts/${id}`);
      setPosts(posts.filter(post => post._id !== id));
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handleAccountsUpdate = (accounts) => {
    setConnectedAccounts(accounts);
  };

  const publishToSocialMedia = async (post) => {
    try {
      const connectedPlatforms = Object.keys(connectedAccounts).filter(
        platform => connectedAccounts[platform]?.connected
      );
      
      if (connectedPlatforms.length === 0) {
        alert('No social media accounts connected. Please connect accounts first.');
        return;
      }
      
      const publishData = {
        content: `${post.title}\n\n${post.content}`,
        platforms: connectedPlatforms
      };
      
      const response = await axios.post('/api/social-media/publish', publishData);
      
      if (response.data.success) {
        alert('Post published to social media successfully!');
        console.log('Published to:', response.data.results);
      }
    } catch (error) {
      console.error('Failed to publish to social media:', error);
      alert('Failed to publish to social media');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="content-calendar-page">
      <SidebarNavigation />
      <div className="main-content">
        <h1>Content Calendar</h1>
        
        {/* Social Media Accounts Section */}
        <SocialMediaAccounts onAccountsUpdate={handleAccountsUpdate} />
        
        {/* Content Form with Social Media Integration */}
        <ContentForm onSubmit={handlePostSubmit} connectedAccounts={connectedAccounts} />
        
        <div className="posts-grid">
          {posts.map(post => (
            <div key={post._id} className={`post-card ${post.status} ${post.isSponsored ? 'sponsored' : ''}`}>
              <div className="post-header">
                <h3>{post.title}</h3>
                {post.isSponsored && <span className="sponsored-badge">💰 Sponsored</span>}
              </div>
              
              <p className="post-content">{post.content}</p>
              
              <div className="post-meta">
                <div className="status-info">
                  <span className={`status-badge ${post.status}`}>
                    {post.status === 'pending' ? '⏳ Pending' : 
                     post.status === 'approved' ? '✅ Approved' : 
                     post.status === 'rejected' ? '❌ Rejected' : post.status}
                  </span>
                </div>
                
                {post.isSponsored && (
                  <div className="sponsor-info">
                    <p><strong>Budget:</strong> ${post.sponsorDetails?.budget || 0}</p>
                    {post.preferredDays && post.preferredDays.length > 0 && (
                      <p><strong>Preferred Days:</strong> {post.preferredDays.join(', ')}</p>
                    )}
                    {post.sponsorDetails?.targetAudience && (
                      <p><strong>Target:</strong> {post.sponsorDetails.targetAudience}</p>
                    )}
                  </div>
                )}
                
                {post.socialMediaSettings?.selectedPlatforms?.length > 0 && (
                  <div className="social-platforms">
                    <strong>Publishing to:</strong>
                    <div className="platform-tags">
                      {post.socialMediaSettings.selectedPlatforms.map(platform => (
                        <span key={platform} className={`platform-tag ${platform}`}>
                          {platform === 'tiktok' ? '🎵' : platform === 'instagram' ? '📸' : '🐦'} {platform}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="post-actions">
                {post.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => handlePostUpdate(post._id, { ...post, status: 'approved' })}
                      className="approve-btn"
                    >
                      ✅ Approve
                    </button>
                    <button 
                      onClick={() => handlePostUpdate(post._id, { ...post, status: 'rejected' })}
                      className="reject-btn"
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                
                {post.status === 'approved' && (
                  <button 
                    onClick={() => publishToSocialMedia(post)} 
                    className="social-publish-btn"
                  >
                    📱 Publish Now
                  </button>
                )}
                
                <button 
                  onClick={() => handlePostDelete(post._id)}
                  className="delete-btn"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ContentCalendarPage;
