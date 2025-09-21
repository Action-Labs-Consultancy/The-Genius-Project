import React, { useState, useEffect } from 'react';

const RequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [hrComment, setHrComment] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showContractModal, setShowContractModal] = useState(false);
  const [contractData, setContractData] = useState(null);
  const [aiContractContent, setAiContractContent] = useState('');
  const [generatingContract, setGeneratingContract] = useState(false);

  const YELLOW = '#FFD600';

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:10000/api/client-requests?status=${statusFilter}`);
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        setError('Failed to load requests');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await fetch(`http://localhost:10000/api/client-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processedBy: 'HR Manager' // Will be dynamic later
        })
      });

      if (response.ok) {
        const result = await response.json();
        alert('✅ Request approved! Client has been created successfully with automatic contract generation.');
        
        // Refresh the requests list
        fetchRequests();
        setSelectedRequest(null);
      } else {
        alert('❌ Failed to approve request');
      }
    } catch (err) {
      alert('❌ Error approving request');
    }
  };

  const handleDisapprove = async (requestId) => {
    if (!hrComment.trim()) {
      alert('Please provide a reason for disapproval');
      return;
    }

    try {
      const response = await fetch(`http://localhost:10000/api/client-requests/${requestId}/disapprove`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hrComment: hrComment,
          processedBy: 'HR Manager' // Will be dynamic later
        })
      });

      if (response.ok) {
        alert('✅ Request disapproved. Comment sent to Head of Marketing.');
        
        // Refresh the requests list
        fetchRequests();
        setSelectedRequest(null);
        setHrComment('');
      } else {
        alert('❌ Failed to disapprove request');
      }
    } catch (err) {
      alert('❌ Error disapproving request');
    }
  };

  const generateContractHTML = async () => {
    if (!contractData) return;
    
    setGeneratingContract(true);
    
    try {
      // Try to get AI-generated content first
      let contractContent = '';
      try {
        const response = await fetch(`http://localhost:10000/api/client-requests/${contractData.id}/contract`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const result = await response.json();
          contractContent = result.contract_content;
          setAiContractContent(contractContent);
        }
      } catch (aiError) {
        console.log('AI generation failed, using standard template');
      }

      // Generate contract HTML
      const contractHTML = contractContent ? 
        generateAIContractHTML(contractContent) : 
        generateStandardContractHTML();

      // Create downloadable file
      const blob = new Blob([contractHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractData.name}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert('📄 Contract HTML file downloaded! Open it in your browser and use Print → Save as PDF to create a PDF.');
      
    } catch (error) {
      console.error('Error generating contract:', error);
      alert('❌ Failed to generate contract. Please try again.');
    } finally {
      setGeneratingContract(false);
    }
  };

  const generateAIContractHTML = (contractContent) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Professional Service Agreement - ${contractData.name}</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            color: #000; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
            background: white;
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
          }
          .contract-title { 
            font-size: 1.8rem; 
            font-weight: bold;
            color: #000; 
            margin: 20px 0;
            text-transform: uppercase;
          }
          .contract-content {
            white-space: pre-wrap;
            line-height: 1.8;
            font-size: 12pt;
            text-align: justify;
          }
          .section-header {
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
          }
          @media print {
            body { max-width: none; margin: 0; padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="contract-title">Professional Services Agreement</h1>
          <p><strong>Contract Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="contract-content">
${contractContent}
        </div>
      </body>
      </html>
    `;
  };

  const generateStandardContractHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Professional Services Agreement - ${contractData.name}</title>
        <style>
          body { 
            font-family: 'Times New Roman', serif; 
            line-height: 1.6; 
            color: #000; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 40px; 
          }
          .contract-title { 
            font-size: 1.8rem; 
            font-weight: bold;
            color: #000; 
            margin: 20px 0;
            text-transform: uppercase;
          }
          .section { 
            margin-bottom: 25px; 
          }
          .section-title { 
            font-weight: bold; 
            margin-bottom: 10px;
            text-decoration: underline;
          }
          .client-info { 
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #000;
          }
          .signature-section { 
            margin-top: 60px; 
            page-break-inside: avoid;
          }
          .signature-box { 
            margin: 30px 0;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          p { margin: 8px 0; text-align: justify; }
          @media print {
            body { max-width: none; margin: 0; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="contract-title">Professional Services Agreement</h1>
          <p><strong>Agreement Date:</strong> ${new Date().toLocaleDateString()}</p>
        </div>

        <div class="section">
          <div class="section-title">PARTIES TO THE AGREEMENT</div>
          <p>This Professional Services Agreement ("Agreement") is entered into on ${new Date().toLocaleDateString()}, between:</p>
          
          <p><strong>FIRST PARTY (Service Provider):</strong><br>
          Action Labs Consultancy<br>
          A professional consulting firm<br>
          123 Business District, Austin, TX 78701<br>
          Email: contracts@actionlabs.com<br>
          Phone: (555) 123-4567<br>
          Hereinafter referred to as "Provider" or "Action Labs"</p>
          
          <p><strong>SECOND PARTY (Client):</strong><br>
          ${contractData.name}<br>
          ${contractData.company ? contractData.company + '<br>' : ''}
          ${contractData.email ? 'Email: ' + contractData.email + '<br>' : ''}
          ${contractData.phone ? 'Phone: ' + contractData.phone + '<br>' : ''}
          Hereinafter referred to as "Client"</p>
        </div>

        <div class="section">
          <div class="section-title">SCOPE OF SERVICES</div>
          ${contractData.scopeOfWork ? `
          <p>Action Labs agrees to provide the following services to the Client:</p>
          <p>${contractData.scopeOfWork.split('\n').map(line => line.trim()).filter(line => line).join('<br>')}</p>
          ` : `
          <p>Action Labs agrees to provide professional consulting services including but not limited to:</p>
          <p>• Strategic business consulting and advisory services<br>
          • Market analysis and competitive intelligence<br>
          • Marketing strategy development and implementation<br>
          • Digital transformation and optimization services<br>
          • Custom solutions tailored to Client's specific business needs</p>
          `}
        </div>

        <div class="section">
          <div class="section-title">COMPENSATION AND PAYMENT TERMS</div>
          ${contractData.pricing ? `
          <p><strong>Service Fees:</strong></p>
          <p>${contractData.pricing.split('\n').map(line => line.trim()).filter(line => line).join('<br>')}</p>
          ` : `
          <p><strong>Service Fees:</strong> To be determined based on scope and complexity of services required.</p>
          `}
          <p><strong>Payment Terms:</strong> Invoices are due and payable within thirty (30) days of receipt. Late payments may incur a service charge of 1.5% per month on the outstanding balance.</p>
          <p><strong>Expenses:</strong> Client agrees to reimburse Provider for all reasonable and necessary expenses incurred in connection with the performance of services under this Agreement.</p>
        </div>

        <div class="section">
          <div class="section-title">TERMS AND CONDITIONS</div>
          ${contractData.terms ? `
          <p><strong>Specific Terms:</strong></p>
          <p>${contractData.terms.split('\n').map(line => line.trim()).filter(line => line).join('<br>')}</p>
          <br>
          ` : ''}
          <p><strong>Term:</strong> This Agreement shall commence on the date first written above and shall continue until completion of the services or termination by either party with thirty (30) days written notice.</p>
          
          <p><strong>Confidentiality:</strong> Both parties acknowledge that they may have access to confidential information. Each party agrees to maintain the confidentiality of such information and not to disclose it to third parties without prior written consent.</p>
          
          <p><strong>Intellectual Property:</strong> All work products, deliverables, and intellectual property created by Action Labs in the performance of services shall become the property of the Client upon full payment of all fees.</p>
          
          <p><strong>Limitation of Liability:</strong> Action Labs' liability under this Agreement shall not exceed the total amount paid by Client for services rendered. Neither party shall be liable for indirect, incidental, or consequential damages.</p>
          
          <p><strong>Governing Law:</strong> This Agreement shall be governed by and construed in accordance with the laws of the jurisdiction where Action Labs is incorporated.</p>
          
          <p><strong>Entire Agreement:</strong> This Agreement constitutes the entire understanding between the parties and supersedes all prior agreements, whether written or oral, relating to the subject matter hereof.</p>
        </div>

        <div class="section">
          <div class="section-title">CLIENT RESPONSIBILITIES</div>
          <p>Client agrees to:</p>
          <p>• Provide timely access to necessary information, personnel, and resources<br>
          • Respond to Action Labs' requests for information within a reasonable timeframe<br>
          • Designate a primary point of contact for project coordination<br>
          • Review and approve deliverables in a timely manner<br>
          • Make payments according to the agreed schedule</p>
        </div>

        <div class="section">
          <div class="section-title">PROVIDER RESPONSIBILITIES</div>
          <p>Action Labs agrees to:</p>
          <p>• Perform all services in a professional and workmanlike manner<br>
          • Maintain appropriate confidentiality of Client information<br>
          • Provide regular updates on project progress<br>
          • Deliver services according to agreed timelines<br>
          • Assign qualified personnel to perform the services</p>
        </div>

        <div class="signature-section">
          <div class="section-title">EXECUTION</div>
          <p>IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.</p>
          
          <div class="signature-box">
            <p><strong>ACTION LABS CONSULTANCY</strong></p>
            <br><br>
            <p>_________________________________</p>
            <p>Signature</p>
            <p>Name: Sarah Johnson</p>
            <p>Title: Director of Operations</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
          
          <div class="signature-box">
            <p><strong>CLIENT: ${contractData.name.toUpperCase()}</strong></p>
            <br><br>
            <p>_________________________________</p>
            <p>Signature</p>
            <p>Name: ${contractData.name}</p>
            <p>Title: _________________________</p>
            <p>Date: _________________________</p>
          </div>
        </div>
      </body>
      </html>
    `;
  };
  const generateContract = async () => {
    if (!contractData) return;
    
    setGeneratingContract(true);
    
    try {
      // Call AI contract generation endpoint
      const response = await fetch(`http://localhost:10000/api/client-requests/${contractData.id}/contract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAiContractContent(result.contract_content);
        
        // Create enhanced contract HTML with AI content
        const contractHTML = generateAIContractHTML(result.contract_content);

        // Create a new window with the AI-generated contract
        const contractWindow = window.open('', '_blank');
        if (contractWindow) {
          contractWindow.document.write(contractHTML);
          contractWindow.document.close();
          
          // Set up print function for the new window
          setTimeout(() => {
            contractWindow.focus();
          }, 500);
        } else {
          // Fallback if popup blocked
          const blob = new Blob([contractHTML], { type: 'text/html' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `contract-${contractData.name}-${new Date().toISOString().split('T')[0]}.html`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          alert('📄 Contract downloaded! Open the file and print to PDF. The contract has also been saved to the client\'s contracts card.');
        }
        
        // Show success message
        alert('✅ Contract generated successfully and saved to client records!');
        
      } else {
        throw new Error('Failed to generate AI contract');
      }
    } catch (error) {
      console.error('Error generating AI contract:', error);
      alert('⚠️ AI contract generation failed. Using standard template...');
      
      // Fallback to basic template
      generateBasicContract();
    } finally {
      setGeneratingContract(false);
    }
  };

  const generateBasicContract = () => {
    if (!contractData) return;

    const contractHTML = generateStandardContractHTML();

    // Try to open in new window, fallback to download
    const contractWindow = window.open('', '_blank');
    if (contractWindow) {
      contractWindow.document.write(contractHTML);
      contractWindow.document.close();
    } else {
      // Fallback if popup blocked
      const blob = new Blob([contractHTML], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractData.name}-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      alert('📄 Contract downloaded! Open the file and print to PDF.');
    }
  };

  const downloadContractPDF = async () => {
    if (!contractData) return;
    
    try {
      // Try to download the backend-generated PDF first
      const response = await fetch(`http://localhost:10000/api/client-requests/${contractData.id}/pdf`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `contract-${contractData.name}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Fallback: Generate contract HTML and create downloadable file
        await generateContractHTML();
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Fallback: Generate contract HTML and create downloadable file
      await generateContractHTML();
    }
  };

  if (loading) return (
    <div style={{ 
      background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: YELLOW,
      fontSize: '1.2rem'
    }}>
      Loading requests...
    </div>
  );

  if (error) return (
    <div style={{ 
      background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      color: '#dc2626',
      fontSize: '1.2rem'
    }}>
      {error}
    </div>
  );

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #181818 0%, #232323 100%)', 
      minHeight: '100vh', 
      padding: '40px 20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ 
          color: YELLOW, 
          fontSize: '3rem', 
          fontWeight: 900, 
          margin: '0 0 10px 0',
          textShadow: '0 2px 4px rgba(255, 214, 0, 0.3)'
        }}>
          📋 CLIENT REQUESTS
        </h1>
        <p style={{ 
          color: '#ccc', 
          fontSize: '1.2rem', 
          margin: 0 
        }}>
          HR Dashboard - Review & Process Client Addition Requests
        </p>
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '30px',
        gap: '10px'
      }}>
        {['pending', 'approved', 'disapproved', 'all'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            style={{
              background: statusFilter === status ? YELLOW : 'transparent',
              color: statusFilter === status ? '#111' : YELLOW,
              border: `2px solid ${YELLOW}`,
              borderRadius: '25px',
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {requests.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#ccc', 
            fontSize: '1.2rem',
            padding: '60px 20px'
          }}>
            No {statusFilter !== 'all' ? statusFilter : ''} requests found
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gap: '20px', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' 
          }}>
            {requests.map(request => (
              <div
                key={request.id}
                style={{
                  background: 'linear-gradient(135deg, #232323 0%, #181818 100%)',
                  border: `2px solid ${['pending', 'ai_approved_pending_hr'].includes(request.requestStatus) ? YELLOW : 
                                      request.requestStatus === 'approved' ? '#10b981' : '#dc2626'}`,
                  borderRadius: '18px',
                  padding: '24px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: ['pending', 'ai_approved_pending_hr'].includes(request.requestStatus) ? 'pointer' : 'default'
                }}
                onClick={() => ['pending', 'ai_approved_pending_hr'].includes(request.requestStatus) && setSelectedRequest(request)}
                onMouseEnter={e => {
                  if (['pending', 'ai_approved_pending_hr'].includes(request.requestStatus)) {
                    e.target.style.transform = 'translateY(-4px)';
                    e.target.style.boxShadow = `0 12px 40px ${YELLOW}22`;
                  }
                }}
                onMouseLeave={e => {
                  if (['pending', 'ai_approved_pending_hr'].includes(request.requestStatus)) {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
                  }
                }}
              >
                {/* Request Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px'
                }}>
                  <h3 style={{ 
                    color: YELLOW, 
                    margin: 0, 
                    fontSize: '1.4rem',
                    fontWeight: 700
                  }}>
                    {request.name}
                  </h3>
                  <span style={{
                    background: ['pending', 'ai_approved_pending_hr'].includes(request.requestStatus) ? YELLOW : 
                               request.requestStatus === 'approved' ? '#10b981' : '#dc2626',
                    color: ['pending', 'ai_approved_pending_hr'].includes(request.requestStatus) ? '#111' : '#fff',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {request.requestStatus}
                  </span>
                </div>

                {/* Request Details */}
                <div style={{ color: '#ccc', marginBottom: '16px' }}>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Client Name:</strong> {request.name || 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Company:</strong> {request.company || 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Email:</strong> {request.email || 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Phone:</strong> {request.phone || 'N/A'}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Status:</strong> {request.status || 'N/A'}
                  </p>
                  {request.scopeOfWork && (
                    <p style={{ margin: '8px 0' }}>
                      <strong>Scope of Work:</strong> {request.scopeOfWork}
                    </p>
                  )}
                  {request.pricing && (
                    <p style={{ margin: '8px 0' }}>
                      <strong>Pricing:</strong> {request.pricing}
                    </p>
                  )}
                  {request.terms && (
                    <p style={{ margin: '8px 0' }}>
                      <strong>Terms:</strong> {request.terms}
                    </p>
                  )}
                  <p style={{ margin: '8px 0' }}>
                    <strong>Requested by:</strong> {request.requestedBy}
                  </p>
                  <p style={{ margin: '8px 0' }}>
                    <strong>Date:</strong> {new Date(request.requestDate).toLocaleDateString()}
                  </p>
                </div>

                {/* HR Comment (if disapproved) */}
                {request.requestStatus === 'disapproved' && request.hrComment && (
                  <div style={{
                    background: 'rgba(220, 38, 38, 0.1)',
                    border: '1px solid #dc2626',
                    borderRadius: '8px',
                    padding: '12px',
                    marginBottom: '16px'
                  }}>
                    <strong style={{ color: '#dc2626' }}>HR Comment:</strong>
                    <p style={{ margin: '4px 0 0 0', color: '#ccc' }}>{request.hrComment}</p>
                  </div>
                )}

                {/* Status Badge for Approved Requests */}
                {request.requestStatus === 'approved' && (
                  <div style={{ 
                    textAlign: 'center',
                    marginTop: '16px'
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      borderRadius: '20px',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      display: 'inline-block',
                      marginBottom: '12px'
                    }}>
                      ✅ Approved - Contract Auto-Generated
                    </span>
                    
                    {/* Contract Action Buttons */}
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      justifyContent: 'center',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContractData(request);
                          downloadContractPDF();
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #FFD600 0%, #FFB300 100%)',
                          color: '#111',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                      >
                        📄 Save as PDF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setContractData(request);
                          generateContract();
                        }}
                        style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'transform 0.2s ease'
                        }}
                        onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                        onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                      >
                        🖨️ Print Contract
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Review Modal */}
  {selectedRequest && (["pending", "ai_approved_pending_hr", "approved"].includes(selectedRequest.requestStatus)) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #232323 0%, #181818 100%)',
            border: `3px solid ${YELLOW}`,
            borderRadius: '20px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ 
              color: YELLOW, 
              margin: '0 0 20px 0',
              textAlign: 'center',
              fontSize: '1.8rem',
              fontWeight: 700
            }}>
              Review Request: {selectedRequest.name}
            </h2>

            {/* Request Details */}
            <div style={{ 
              background: 'rgba(255, 214, 0, 0.1)',
              border: '1px solid rgba(255, 214, 0, 0.3)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              color: '#ccc'
            }}>
              <p><strong>Client Name:</strong> {selectedRequest.name || 'N/A'}</p>
              <p><strong>Company:</strong> {selectedRequest.company || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedRequest.email || 'N/A'}</p>
              <p><strong>Phone:</strong> {selectedRequest.phone || 'N/A'}</p>
              <p><strong>Status:</strong> {selectedRequest.status}</p>
              {selectedRequest.scopeOfWork && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Scope of Work:</strong>
                  <div style={{ 
                    background: '#222', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {selectedRequest.scopeOfWork}
                  </div>
                </div>
              )}
              {selectedRequest.pricing && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Pricing Information:</strong>
                  <div style={{ 
                    background: '#222', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginTop: '8px',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem'
                  }}>
                    {selectedRequest.pricing}
                  </div>
                </div>
              )}
              {selectedRequest.terms && (
                <div style={{ marginTop: '12px' }}>
                  <strong>Terms & Conditions:</strong>
                  <div style={{ 
                    background: '#222', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginTop: '8px',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    lineHeight: '1.4'
                  }}>
                    {selectedRequest.terms}
                  </div>
                </div>
              )}
              <p style={{ marginTop: '12px' }}><strong>Requested by:</strong> {selectedRequest.requestedBy}</p>
              <p><strong>Date:</strong> {new Date(selectedRequest.requestDate).toLocaleDateString()}</p>
            </div>

            {/* HR Comment Section */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                color: YELLOW, 
                fontWeight: 600, 
                display: 'block', 
                marginBottom: '8px' 
              }}>
                HR Comment (required for disapproval):
              </label>
              <textarea
                value={hrComment}
                onChange={(e) => setHrComment(e.target.value)}
                placeholder="Enter your comment here..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  background: '#1a1a1a',
                  border: '2px solid #333',
                  borderRadius: '12px',
                  color: '#fff',
                  padding: '12px',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '12px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {['pending', 'ai_approved_pending_hr'].includes(selectedRequest.requestStatus) && (
                <>
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      minWidth: '120px'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                  >
                    ✅ Approve
                  </button>
                  <button
                    onClick={() => handleDisapprove(selectedRequest.id)}
                    style={{
                      background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      minWidth: '120px'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                  >
                    ❌ Disapprove
                  </button>
                </>
              )}
              {selectedRequest.requestStatus === 'approved' && (
                <>
                  <button
                    onClick={() => {
                      setContractData(selectedRequest);
                      downloadContractPDF();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #FFD600 0%, #FFB300 100%)',
                      color: '#111',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      minWidth: '160px'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                  >
                    📄 Save as PDF
                  </button>
                  <button
                    onClick={() => {
                      setContractData(selectedRequest);
                      generateContract();
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '14px 24px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease',
                      minWidth: '160px'
                    }}
                    onMouseEnter={e => e.target.style.transform = 'translateY(-2px)'}
                    onMouseLeave={e => e.target.style.transform = 'translateY(0)'}
                  >
                    🖨️ Print Contract
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setHrComment('');
                }}
                style={{
                  background: 'transparent',
                  color: YELLOW,
                  border: `2px solid ${YELLOW}`,
                  borderRadius: '12px',
                  padding: '14px 24px',
                  fontWeight: 700,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  minWidth: '120px'
                }}
                onMouseEnter={e => {
                  e.target.style.background = YELLOW;
                  e.target.style.color = '#111';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = YELLOW;
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestsPage;
