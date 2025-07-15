import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, useParams } from 'react-router-dom';
import HeaderBar from './HeaderBar';
import ClientsPage from './ClientsPage';
import ClientDetailPage from './ClientDetailPage';
import Dashboard from './Dashboard';
import DataDashboard from './DataDashboard';
import Settings from './Settings';
import AuthenticationComponent from './AuthenticationComponent';
import SetPasswordPage from './SetPasswordPage';
import ChatPage from './ChatPage';
import AIContentGenerator from './AIContentGenerator';
import OutlookCalendar from './OutlookCalendar';
import MeetingsCalendar from './MeetingsCalendar';
import WeeklyStandUpPlanner from './WeeklyStandUpPlanner';
import StandUpPage from './StandUpPage';
import SocialMediaInsightsDashboard from './SocialMediaInsightsDashboard';
import LlamaChat from './LlamaChat';
import './styles.css';
import { sendAutomatedDM } from './utils/sendAutomatedDM';
import SpendTracker from './pages/SpendTracker';
import TikTokAuthCallback from './pages/tiktok-auth-callback';

// Wrapper component for client detail page to handle routing
function ClientDetailWrapper({ user }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch client data based on clientId
    const fetchClient = async () => {
      try {
        const { api } = await import('./config/api');
        const clients = await api.getClients();
        const foundClient = clients.find(c => c.id === clientId);
        
        if (foundClient) {
          setClient(foundClient);
        } else {
          console.error('Client not found');
          navigate('/clients');
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111', color: '#FFD600' }}>
        <div>Loading client...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111', color: '#FFD600' }}>
        <div>Client not found</div>
      </div>
    );
  }

  return (
    <ClientDetailPage 
      client={client} 
      user={user} 
      onBack={() => navigate('/clients')} 
      onNavigate={(path) => navigate(path.startsWith('/') ? path : `/${path}`)}
    />
  );
}

// Wrapper component for client insights page
function ClientInsightsWrapper({ user }) {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const { api } = await import('./config/api');
        const clients = await api.getClients();
        const foundClient = clients.find(c => c.id === clientId);
        
        if (foundClient) {
          setClient(foundClient);
        } else {
          console.error('Client not found');
          navigate('/clients');
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      fetchClient();
    }
  }, [clientId, navigate]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111', color: '#FFD600' }}>
        <div>Loading client insights...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#111', color: '#FFD600' }}>
        <div>Client not found</div>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', background: '#181818', borderBottom: '2px solid #FFD600' }}>
        <button 
          onClick={() => navigate(`/clients/${clientId}`)}
          style={{ 
            background: 'transparent', 
            border: `2px solid #FFD600`, 
            color: '#FFD600', 
            padding: '8px 16px', 
            borderRadius: '8px',
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          ← Back to {client.name}
        </button>
        <h1 style={{ color: '#FFD600', margin: 0 }}>Social Media Insights - {client.name}</h1>
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <SocialMediaInsightsDashboard user={user} client={client} />
      </div>
    </div>
  );
}

// Calendar component wrapper
function CalendarWrapper({ user }) {
  const [showScheduler, setShowScheduler] = useState(false);
  const [meetingsRefreshTrigger, setMeetingsRefreshTrigger] = useState(0);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <MeetingsCalendar currentUser={user} refreshTrigger={meetingsRefreshTrigger} />
      <button
        className="open-scheduler-btn"
        style={{
          position: 'fixed',
          bottom: 36,
          right: 36,
          background: '#FFD600',
          color: '#181818',
          border: 'none',
          borderRadius: 50,
          width: 64,
          height: 64,
          fontSize: 32,
          fontWeight: 900,
          boxShadow: '0 4px 24px #FFD60055',
          cursor: 'pointer',
          zIndex: 1001
        }}
        onClick={() => setShowScheduler(true)}
        title="Schedule a Meeting"
      >+
      </button>
      {showScheduler && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          zIndex: 1002,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ position: 'relative', zIndex: 1003 }}>
            <OutlookCalendar 
              currentUser={user} 
              onSendChatMessage={async ({ to, from, message }) => {
                await sendAutomatedDM({ fromUser: from, toUser: to, message });
              }}
              onMeetingCreated={() => {
                setMeetingsRefreshTrigger(prev => prev + 1);
              }}
            />
            <button
              onClick={() => setShowScheduler(false)}
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: '#FFD600',
                color: '#181818',
                border: 'none',
                borderRadius: 20,
                fontWeight: 900,
                fontSize: 22,
                padding: '2px 16px',
                cursor: 'pointer',
                zIndex: 1004
              }}
            >×</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Handle login success from AuthenticationComponent
  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    localStorage.setItem('user', JSON.stringify(userObj));
    navigate('/dashboard');
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    navigate('/');
  };

  // Navigation handler - always use absolute paths
  const handleNavigate = (path) => {
    const absolutePath = path.startsWith('/') ? path : `/${path}`;
    navigate(absolutePath);
  };

  // If no user and not on special pages, show login
  if (!user && !['/set-password', '/tiktok-auth-callback'].includes(location.pathname)) {
    return (
      <div className="login-page">
        <AuthenticationComponent onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  // Main app with proper routing
  return (
    <div className="main-app" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <HeaderBar 
        user={user} 
        onLogout={handleLogout} 
        onLogoClick={() => navigate('/dashboard')} 
        onNavigate={handleNavigate}
      />
      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        <Routes>
          <Route path="/set-password" element={<SetPasswordPage />} />
          <Route path="/tiktok-auth-callback" element={<TikTokAuthCallback />} />
          <Route path="/" element={<Dashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />} />
          <Route path="/dashboard" element={<Dashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />} />
          <Route path="/data-dashboard" element={<DataDashboard user={user} />} />
          <Route path="/clients" element={<ClientsPage user={user} />} />
          <Route path="/clients/:clientId" element={<ClientDetailWrapper user={user} />} />
          <Route path="/clients/:clientId/insights" element={<ClientInsightsWrapper user={user} />} />
          <Route path="/spend-tracker" element={<SpendTracker />} />
          <Route path="/calendar" element={<CalendarWrapper user={user} />} />
          <Route path="/chat" element={<ChatPage user={user} />} />
          <Route path="/weekly-standup" element={<WeeklyStandUpPlanner user={user} />} />
          <Route path="/standup" element={<StandUpPage user={user} />} />
          <Route path="/insights" element={<SocialMediaInsightsDashboard user={user} />} />
          <Route path="/llama-chat" element={<LlamaChat userId={user?.id} />} />
          <Route path="/ai-content" element={<AIContentGenerator user={user} onBack={() => navigate('/dashboard')} />} />
          {user?.is_admin && (
            <Route path="/settings" element={<Settings onNavigate={handleNavigate} onUserUpdate={setUser} user={user} />} />
          )}
        </Routes>
      </div>
    </div>
  );
}

// Move any reusable business logic to core/businessLogic.js for architecture consistency.