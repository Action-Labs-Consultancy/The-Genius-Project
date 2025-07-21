import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientsStore } from '../stores/authStore';
import { Plus, Search, Building2, Globe, Mail, Phone } from 'lucide-react';
import ClientModal from '../components/ClientModal';
import './ClientsPage.css';

const ClientsPage = ({ user }) => {
  const navigate = useNavigate();
  const { clients, loadClients, loading } = useClientsStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleClientClick = (client) => {
    navigate(`/clients/${client.id}`);
  };

  if (loading) {
    return (
      <div className="clients-loading">
        <div className="loading-spinner"></div>
        <p>Loading clients...</p>
      </div>
    );
  }

  return (
    <div className="clients-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>Clients</h1>
          <p>Manage your client relationships and projects</p>
        </div>
        <button 
          className="add-client-btn"
          onClick={() => setShowModal(true)}
        >
          <Plus size={20} />
          Add Client
        </button>
      </div>

      {/* Search and Filters */}
      <div className="clients-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="clients-stats">
          <span className="stat">
            <strong>{clients.length}</strong> total clients
          </span>
          <span className="stat">
            <strong>{clients.filter(c => c.status === 'active').length}</strong> active
          </span>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="clients-grid">
        {filteredClients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏢</div>
            <h3>No clients found</h3>
            <p>
              {searchTerm 
                ? `No clients match "${searchTerm}"`
                : "Add your first client to get started"
              }
            </p>
            {!searchTerm && (
              <button 
                className="add-first-client-btn"
                onClick={() => setShowModal(true)}
              >
                <Plus size={20} />
                Add Your First Client
              </button>
            )}
          </div>
        ) : (
          filteredClients.map(client => (
            <div 
              key={client.id}
              className="client-card"
              onClick={() => handleClientClick(client)}
            >
              <div className="client-header">
                <div className="client-logo">
                  {client.logo_url ? (
                    <img src={client.logo_url} alt={client.name} />
                  ) : (
                    <div className="logo-placeholder">
                      <Building2 size={32} />
                    </div>
                  )}
                </div>
                <div className={`client-status ${client.status}`}>
                  {client.status}
                </div>
              </div>

              <div className="client-info">
                <h3 className="client-name">{client.name}</h3>
                {client.company && (
                  <p className="client-company">{client.company}</p>
                )}
              </div>

              <div className="client-contact">
                {client.email && (
                  <div className="contact-item">
                    <Mail size={16} />
                    <span>{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="contact-item">
                    <Phone size={16} />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.website && (
                  <div className="contact-item">
                    <Globe size={16} />
                    <span>{client.website}</span>
                  </div>
                )}
              </div>

              <div className="client-stats">
                <div className="stat">
                  <span className="stat-number">{client.projects_count || 0}</span>
                  <span className="stat-label">Projects</span>
                </div>
              </div>

              <div className="client-actions">
                <button 
                  className="view-client-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClientClick(client);
                  }}
                >
                  View Details →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Client Modal */}
      {showModal && (
        <ClientModal
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadClients(); // Refresh the list
          }}
        />
      )}
    </div>
  );
};

export default ClientsPage;
