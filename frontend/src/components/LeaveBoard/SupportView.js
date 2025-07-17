import React from 'react';
import { Bell, MessageCircle, Phone, Mail, FileText, Clock } from 'lucide-react';

const SupportView = ({ user }) => {
  const supportTickets = [
    {
      id: 1,
      title: 'Leave balance calculation issue',
      status: 'open',
      priority: 'high',
      created: '2024-01-15',
      updated: '2024-01-16'
    },
    {
      id: 2,
      title: 'Cannot submit leave request',
      status: 'resolved',
      priority: 'medium',
      created: '2024-01-10',
      updated: '2024-01-12'
    }
  ];

  const faqItems = [
    {
      question: 'How do I check my leave balance?',
      answer: 'You can view your leave balance on the dashboard or in the My Leaves section. It shows your total available days for each leave type.'
    },
    {
      question: 'What is the notice period for leave requests?',
      answer: 'Generally, you should submit leave requests at least 2 weeks in advance. Emergency leave can be submitted with shorter notice.'
    },
    {
      question: 'Can I cancel a submitted leave request?',
      answer: 'Yes, you can cancel pending leave requests. Once approved, you\'ll need to contact HR to make changes.'
    },
    {
      question: 'What happens to unused leave days?',
      answer: 'Unused leave days policy varies by company. Check with HR for specific details about carryover or payout policies.'
    }
  ];

  return (
    <div className="support-view">
      <div className="support-header">
        <div className="header-content">
          <h2>Support & Help</h2>
          <p>Get help with your leave management questions</p>
        </div>
      </div>

      {/* Contact Options */}
      <div className="contact-options">
        <div className="contact-card">
          <div className="contact-icon">
            <MessageCircle className="icon" />
          </div>
          <div className="contact-content">
            <h3>Live Chat</h3>
            <p>Get instant help from our support team</p>
            <button className="contact-btn">Start Chat</button>
          </div>
        </div>
        
        <div className="contact-card">
          <div className="contact-icon">
            <Mail className="icon" />
          </div>
          <div className="contact-content">
            <h3>Email Support</h3>
            <p>Send us an email and we'll respond within 24 hours</p>
            <button className="contact-btn">Send Email</button>
          </div>
        </div>
        
        <div className="contact-card">
          <div className="contact-icon">
            <Phone className="icon" />
          </div>
          <div className="contact-content">
            <h3>Phone Support</h3>
            <p>Call us for urgent matters</p>
            <button className="contact-btn">Call Now</button>
          </div>
        </div>
      </div>

      {/* Support Tickets */}
      <div className="support-section">
        <div className="section-header">
          <h3>Your Support Tickets</h3>
          <button className="primary-btn">
            <FileText className="btn-icon" />
            New Ticket
          </button>
        </div>
        
        <div className="tickets-list">
          {supportTickets.length === 0 ? (
            <div className="empty-state">
              <Bell className="empty-icon" />
              <h4>No support tickets</h4>
              <p>You haven't submitted any support tickets yet</p>
            </div>
          ) : (
            supportTickets.map(ticket => (
              <div key={ticket.id} className="ticket-item">
                <div className="ticket-header">
                  <div className="ticket-info">
                    <h4>{ticket.title}</h4>
                    <span className="ticket-id">#{ticket.id}</span>
                  </div>
                  <div className="ticket-status">
                    <span className={`status-badge ${ticket.status}`}>
                      {ticket.status}
                    </span>
                    <span className={`priority-badge ${ticket.priority}`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
                <div className="ticket-meta">
                  <div className="meta-item">
                    <Clock className="meta-icon" />
                    <span>Created: {ticket.created}</span>
                  </div>
                  <div className="meta-item">
                    <Clock className="meta-icon" />
                    <span>Updated: {ticket.updated}</span>
                  </div>
                </div>
                <div className="ticket-actions">
                  <button className="secondary-btn">View Details</button>
                  {ticket.status === 'open' && (
                    <button className="primary-btn">Reply</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="support-section">
        <div className="section-header">
          <h3>Frequently Asked Questions</h3>
        </div>
        
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div key={index} className="faq-item">
              <div className="faq-question">
                <h4>{item.question}</h4>
              </div>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div className="support-section">
        <div className="section-header">
          <h3>Resources</h3>
        </div>
        
        <div className="resources-grid">
          <div className="resource-card">
            <FileText className="resource-icon" />
            <h4>Leave Policy Guide</h4>
            <p>Complete guide to company leave policies</p>
            <button className="resource-btn">Download</button>
          </div>
          
          <div className="resource-card">
            <Bell className="resource-icon" />
            <h4>Quick Start Guide</h4>
            <p>Learn how to use the leave board effectively</p>
            <button className="resource-btn">View Guide</button>
          </div>
          
          <div className="resource-card">
            <MessageCircle className="resource-icon" />
            <h4>Video Tutorials</h4>
            <p>Watch step-by-step tutorials</p>
            <button className="resource-btn">Watch Now</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportView;
