import React, { useState, useEffect } from 'react';
import './ClientRequestsManager.css';

const YELLOW = '#FFD600';

export default function ClientRequestsManager({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [filter, setFilter] = useState('ai_approved_pending_hr');

  // Check if user is HR
  const isHR = user?.department?.toLowerCase() === 'hr' || user?.is_admin || user?.role === 'hr';

  useEffect(() => {
    if (isHR) {
      fetchClientRequests();
    }
  }, [isHR, filter]);

  const fetchClientRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:10000/api/client-requests?status=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error('Failed to fetch client requests');
      }
    } catch (error) {
      console.error('Error fetching client requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setProcessing(prev => ({ ...prev, [requestId]: 'approving' }));
    try {
      const response = await fetch(`http://localhost:10000/api/client-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processedBy: user?.name || 'HR',
          comment: 'Approved by HR'
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Client request approved! Client ID: ${result.clientId}`);
        fetchClientRequests(); // Refresh the list
        
        // Show PDF/Print options
        setSelectedRequest(requests.find(r => r.id === requestId));
        showApprovalOptions(result.clientId, requestId);
      } else {
        alert('❌ Failed to approve client request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      alert('❌ Error approving client request');
    } finally {
      setProcessing(prev => ({ ...prev, [requestId]: null }));
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setProcessing(prev => ({ ...prev, [selectedRequest.id]: 'rejecting' }));
    try {
      const response = await fetch(`http://localhost:10000/api/client-requests/${selectedRequest.id}/disapprove`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hrComment: rejectionReason,
          processedBy: user?.name || 'HR'
        })
      });

      if (response.ok) {
        alert(`❌ Client request rejected. Reason: ${rejectionReason}`);
        fetchClientRequests(); // Refresh the list
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequest(null);
      } else {
        alert('❌ Failed to reject client request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      alert('❌ Error rejecting client request');
    } finally {
      setProcessing(prev => ({ ...prev, [selectedRequest.id]: null }));
    }
  };

  const showApprovalOptions = (clientId, requestId) => {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    modal.innerHTML = `
      <div style="
        background: #1a1a1a;
        border: 3px solid ${YELLOW};
        border-radius: 20px;
        padding: 30px;
        max-width: 500px;
        text-align: center;
      ">
        <h3 style="color: ${YELLOW}; margin-bottom: 20px;">✅ Client Approved!</h3>
        <p style="color: white; margin-bottom: 30px;">
          The client has been successfully approved and added to the system.
          <br><br>
          <strong>Client ID:</strong> ${clientId}
        </p>
        <div style="display: flex; gap: 15px; justify-content: center;">
          <button id="save-pdf-btn" style="
            background: linear-gradient(135deg, ${YELLOW}, #FFA500);
            color: #000;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          ">📄 Save as PDF</button>
          <button id="print-btn" style="
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          ">🖨️ Print</button>
          <button id="close-btn" style="
            background: #333;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: bold;
            cursor: pointer;
          ">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    modal.querySelector('#save-pdf-btn').onclick = () => generatePDF(clientId, requestId);
    modal.querySelector('#print-btn').onclick = () => printClientInfo(clientId, requestId);
    modal.querySelector('#close-btn').onclick = () => document.body.removeChild(modal);
    modal.onclick = (e) => {
      if (e.target === modal) document.body.removeChild(modal);
    };
  };

  const generatePDF = async (clientId, requestId) => {
    try {
      const response = await fetch(`http://localhost:10000/api/client-requests/${requestId}/pdf`, {
        method: 'GET'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `client-approval-${clientId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
        alert('📄 PDF saved successfully!');
      } else {
        alert('❌ Failed to generate PDF');
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Error generating PDF');
    }
  };

  const printClientInfo = (clientId, requestId) => {
    const printWindow = window.open('', '_blank');
    const request = requests.find(r => r.id === requestId);
    
    if (request) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Client Approval Document</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 40px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; }
              .content { margin-top: 30px; }
              .field { margin: 10px 0; }
              .label { font-weight: bold; display: inline-block; width: 150px; }
              .approval { margin-top: 30px; padding: 20px; border: 2px solid #4CAF50; background: #f9f9f9; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>CLIENT APPROVAL DOCUMENT</h1>
              <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            <div class="content">
              <h3>Client Information</h3>
              <div class="field"><span class="label">Name:</span> ${request.name}</div>
              <div class="field"><span class="label">Company:</span> ${request.company}</div>
              <div class="field"><span class="label">Email:</span> ${request.email}</div>
              <div class="field"><span class="label">Phone:</span> ${request.phone}</div>
              <div class="field"><span class="label">Status:</span> ${request.status}</div>
              <div class="field"><span class="label">Requested By:</span> ${request.requestedBy}</div>
              <div class="field"><span class="label">Request Date:</span> ${request.requestDate}</div>
              
              <div class="approval">
                <h3>✅ APPROVAL CONFIRMATION</h3>
                <div class="field"><span class="label">Client ID:</span> ${clientId}</div>
                <div class="field"><span class="label">Approved By:</span> ${user?.name || 'HR'}</div>
                <div class="field"><span class="label">Approval Date:</span> ${new Date().toLocaleDateString()}</div>
                <p><strong>Status:</strong> APPROVED FOR BUSINESS OPERATIONS</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'ai_approved_pending_hr': '#FFD600',
      'approved': '#4CAF50',
      'rejected': '#f44336',
      'pending': '#FF9800'
    };
    return colors[status] || '#999';
  };

  const getStatusText = (status) => {
    const texts = {
      'ai_approved_pending_hr': 'Pending HR Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'pending': 'Pending'
    };
    return texts[status] || status;
  };

  if (!isHR) {
    return (
      <div style={{ textAlign: 'center', margin: '50px', color: YELLOW }}>
        <h2>Access Restricted</h2>
        <p>Only HR personnel can access client request management.</p>
      </div>
    );
  }

  return (
    <div className="client-requests-manager">
      <div className="header">
        <h2 style={{ color: YELLOW, fontWeight: 900, fontSize: 36 }}>
          Client Request Management
        </h2>
        
        <div className="filters">
          <select 
            value={filter} 
            onChange={(e) => setFilter(e.target.value)}
            style={{
              background: '#1a1a1a',
              border: `2px solid ${YELLOW}`,
              color: YELLOW,
              padding: '10px',
              borderRadius: '8px',
              fontSize: '14px'
            }}
          >
            <option value="ai_approved_pending_hr">Pending HR Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="">All Requests</option>
          </select>
          
          <button 
            onClick={fetchClientRequests}
            style={{
              background: `linear-gradient(135deg, ${YELLOW}, #FFA500)`,
              color: '#000',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginLeft: '10px'
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: YELLOW, margin: '50px' }}>
          Loading client requests...
        </div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', color: YELLOW, margin: '50px' }}>
          <h3>No client requests found</h3>
          <p>No requests match the current filter criteria.</p>
        </div>
      ) : (
        <div className="requests-list">
          {requests.map((request) => (
            <div key={request.id} className="request-card">
              <div className="request-header">
                <h3 style={{ color: YELLOW }}>{request.name}</h3>
                <div 
                  className="status-badge"
                  style={{ 
                    background: getStatusColor(request.requestStatus),
                    color: request.requestStatus === 'ai_approved_pending_hr' ? '#000' : '#fff'
                  }}
                >
                  {getStatusText(request.requestStatus)}
                </div>
              </div>
              
              <div className="request-details">
                <div className="detail-row">
                  <span className="label">Company:</span>
                  <span className="value">{request.company || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{request.email}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{request.phone || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Requested By:</span>
                  <span className="value">{request.requestedBy}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Request Date:</span>
                  <span className="value">{new Date(request.requestDate).toLocaleDateString()}</span>
                </div>
                
                {request.hrComment && (
                  <div className="detail-row">
                    <span className="label">HR Comment:</span>
                    <span className="value">{request.hrComment}</span>
                  </div>
                )}
              </div>

              {request.requestStatus === 'ai_approved_pending_hr' && (
                <div className="action-buttons">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processing[request.id]}
                    className="approve-btn"
                  >
                    {processing[request.id] === 'approving' ? '⏳ Approving...' : '✅ Approve'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowRejectModal(true);
                    }}
                    disabled={processing[request.id]}
                    className="reject-btn"
                  >
                    {processing[request.id] === 'rejecting' ? '⏳ Rejecting...' : '❌ Reject'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div className="reject-modal">
            <h3 style={{ color: YELLOW }}>Reject Client Request</h3>
            <p style={{ color: 'white', marginBottom: '20px' }}>
              Please provide a reason for rejecting this client request:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="rejection-textarea"
            />
            <div className="modal-buttons">
              <button onClick={handleReject} className="confirm-reject-btn">
                Reject Request
              </button>
              <button 
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
