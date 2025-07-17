import React, { useState } from 'react';
import { User, Settings, Mail, Phone, MapPin, Edit, Save, X } from 'lucide-react';

const AccountView = ({ user, leaveBalances }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    department: user?.department || '',
    location: user?.location || ''
  });

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving user data:', editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      department: user?.department || '',
      location: user?.location || ''
    });
    setIsEditing(false);
  };

  return (
    <div className="account-view">
      <div className="account-header">
        <div className="header-content">
          <h2>My Account</h2>
          <p>Manage your profile and account settings</p>
        </div>
        <div className="header-actions">
          {!isEditing ? (
            <button className="primary-btn" onClick={() => setIsEditing(true)}>
              <Edit className="btn-icon" />
              Edit Profile
            </button>
          ) : (
            <div className="edit-actions">
              <button className="secondary-btn" onClick={handleCancel}>
                <X className="btn-icon" />
                Cancel
              </button>
              <button className="primary-btn" onClick={handleSave}>
                <Save className="btn-icon" />
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Section */}
      <div className="account-section">
        <div className="section-header">
          <h3>Profile Information</h3>
        </div>
        
        <div className="profile-card">
          <div className="profile-avatar">
            <div className="avatar-circle large">
              <User className="avatar-icon" />
            </div>
            <button className="change-avatar-btn">Change Photo</button>
          </div>
          
          <div className="profile-info">
            <div className="info-grid">
              <div className="info-item">
                <label>Full Name</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({...editData, name: e.target.value})}
                    className="edit-input"
                  />
                ) : (
                  <div className="info-value">{user?.name || 'Not set'}</div>
                )}
              </div>
              
              <div className="info-item">
                <label>Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({...editData, email: e.target.value})}
                    className="edit-input"
                  />
                ) : (
                  <div className="info-value">
                    <Mail className="info-icon" />
                    {user?.email || 'Not set'}
                  </div>
                )}
              </div>
              
              <div className="info-item">
                <label>Phone</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) => setEditData({...editData, phone: e.target.value})}
                    className="edit-input"
                  />
                ) : (
                  <div className="info-value">
                    <Phone className="info-icon" />
                    {user?.phone || 'Not set'}
                  </div>
                )}
              </div>
              
              <div className="info-item">
                <label>Department</label>
                {isEditing ? (
                  <select
                    value={editData.department}
                    onChange={(e) => setEditData({...editData, department: e.target.value})}
                    className="edit-select"
                  >
                    <option value="">Select Department</option>
                    <option value="hr">Human Resources</option>
                    <option value="engineering">Engineering</option>
                    <option value="marketing">Marketing</option>
                    <option value="sales">Sales</option>
                    <option value="finance">Finance</option>
                  </select>
                ) : (
                  <div className="info-value">{user?.department || 'Not set'}</div>
                )}
              </div>
              
              <div className="info-item">
                <label>Location</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.location}
                    onChange={(e) => setEditData({...editData, location: e.target.value})}
                    className="edit-input"
                  />
                ) : (
                  <div className="info-value">
                    <MapPin className="info-icon" />
                    {user?.location || 'Not set'}
                  </div>
                )}
              </div>
              
              <div className="info-item">
                <label>Employee ID</label>
                <div className="info-value">{user?.id || 'Not available'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balance Summary */}
      <div className="account-section">
        <div className="section-header">
          <h3>Leave Balance Summary</h3>
        </div>
        
        <div className="balance-grid">
          {Object.entries(leaveBalances).map(([type, balance]) => (
            <div key={type} className="balance-summary-card">
              <div className="balance-type">{type.charAt(0).toUpperCase() + type.slice(1)}</div>
              <div className="balance-amount">{balance} days</div>
              <div className="balance-progress">
                <div 
                  className="progress-bar"
                  style={{ width: `${Math.min((balance / 20) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Account Settings */}
      <div className="account-section">
        <div className="section-header">
          <h3>Account Settings</h3>
        </div>
        
        <div className="settings-grid">
          <div className="setting-item">
            <div className="setting-info">
              <h4>Email Notifications</h4>
              <p>Receive notifications for leave requests and updates</p>
            </div>
            <div className="setting-control">
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Push Notifications</h4>
              <p>Get push notifications on your device</p>
            </div>
            <div className="setting-control">
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Calendar Integration</h4>
              <p>Sync leave dates with your calendar</p>
            </div>
            <div className="setting-control">
              <label className="switch">
                <input type="checkbox" />
                <span className="slider"></span>
              </label>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security to your account</p>
            </div>
            <div className="setting-control">
              <button className="secondary-btn">Setup</button>
            </div>
          </div>
        </div>
      </div>

      {/* Security Actions */}
      <div className="account-section">
        <div className="section-header">
          <h3>Security</h3>
        </div>
        
        <div className="security-actions">
          <button className="secondary-btn">Change Password</button>
          <button className="secondary-btn">Download My Data</button>
          <button className="danger-btn">Delete Account</button>
        </div>
      </div>
    </div>
  );
};

export default AccountView;
