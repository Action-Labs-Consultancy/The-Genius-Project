import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import HeaderBar from './HeaderBar';
import ClientsPage from './ClientsPage';
import ClientDetailPage from './ClientDetailPage';
import Dashboard from './Dashboard';
import Settings from './Settings';
import AuthenticationComponent from './AuthenticationComponent';
import SetPasswordPage from './SetPasswordPage';
import ChatPage from './ChatPage';
import AIContentGenerator from './AIContentGenerator';
import OutlookCalendar from './OutlookCalendar';
import MeetingsCalendar from './MeetingsCalendar';
import WeeklyStandUpPlanner from './WeeklyStandUpPlanner';
import StandUpPage from './StandUpPage';
import ProjectsPage from './ProjectsPage';
import ProjectDetailPage from './ProjectDetailPage';
import SocialMediaInsightsDashboard from './SocialMediaInsightsDashboard';
import ContentCalendarPage from './ContentCalendarPage';
import './styles.css';
import { sendAutomatedDM } from './utils/sendAutomatedDM';
import SpendTracker from './pages/SpendTracker';
import OpenAIPlugin from './plugins/openai/OpenAIPlugin';
import PineconePlugin from './plugins/pinecone/PineconePlugin';
import RevivePlugin from './plugins/revive/RevivePlugin';
import AppAdapter from './adapters/AppAdapter';

const appAdapter = new AppAdapter({
  aiPlugin: new OpenAIPlugin(),
  vectorDBPlugin: new PineconePlugin(),
  adserverPlugin: new RevivePlugin(),
});

export default function App() {
  const [view, setView] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [chatValue, setChatValue] = useState('');
  const [showScheduler, setShowScheduler] = useState(false);
  const [navigationContext, setNavigationContext] = useState(null);
  const [meetingsRefreshTrigger, setMeetingsRefreshTrigger] = useState(0);

  // Handle login success from AuthenticationComponent
  const handleLoginSuccess = (userObj) => {
    setUser(userObj);
    setView('dashboard'); // Go to dashboard/home after login
  };

  // Logout
  const handleLogout = () => {
    setUser(null);
    setView('login');
    setSelectedClient(null);
    setNavigationContext(null);
  };

  // Navigation handlers
  const handleNavigate = (to, context = null) => {
    setView(to);
    if (to === 'dashboard' || to === 'clients' || to === 'projects' || to === 'spend-tracker' || to === 'settings' || to === 'calendar' || to === 'content-calendar') {
      setSelectedClient(null);
      setSelectedProject(null);
    }
    setNavigationContext(context);
  };

  if (user) {
    const handleLogoClick = () => setView('dashboard');
    return (
      <div className="main-app" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <HeaderBar 
          user={user} 
          onLogout={handleLogout} 
          onLogoClick={handleLogoClick} 
          onNavigate={handleNavigate}
        />
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          {view === 'ai-content' ? (
            <AIContentGenerator 
              user={user} 
              client={selectedClient}
              onBack={() => {
                if (selectedClient && navigationContext?.calendarCard) {
                  setView('clients');
                  setNavigationContext({ openCalendar: true, calendarCard: navigationContext.calendarCard });
                } else if (selectedClient) {
                  setView('clients');
                } else {
                  handleNavigate('dashboard');
                }
              }} 
            />
          ) : selectedClient ? (
            <ClientDetailPage 
              client={selectedClient} 
              user={user} 
              onBack={() => setSelectedClient(null)} 
              onNavigate={handleNavigate}
              navigationContext={navigationContext}
            />
          ) : selectedProject ? (
            <ProjectDetailPage 
              project={selectedProject} 
              user={user} 
              onBack={() => setSelectedProject(null)} 
              onNavigate={handleNavigate}
            />
          ) : view === 'clients' ? (
            <ClientsPage user={user} onClientSelect={setSelectedClient} />
          ) : view === 'projects' ? (
            <ProjectsPage user={user} onNavigateToProject={setSelectedProject} />
          ) : view === 'spend-tracker' ? (
            <SpendTracker />
          ) : view === 'dashboard' ? (
            <Dashboard user={user} onNavigate={handleNavigate} onLogout={handleLogout} />
          ) : view === 'calendar' ? (
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
          ) : view === 'content-calendar' ? (
            <ContentCalendarPage user={user} onNavigate={handleNavigate} />
          ) : view === 'settings' && user.is_admin ? (
            <Settings onNavigate={handleNavigate} onUserUpdate={setUser} user={user} />
          ) : view === 'chat' ? (
            <ChatPage user={user} />
          ) : view === 'weeklyStandup' ? (
            <WeeklyStandUpPlanner user={user} />
          ) : view === 'standup' ? (
            <StandUpPage user={user} />
          ) : view === 'insights' ? (
            <SocialMediaInsightsDashboard user={user} />
          ) : null}
        </div>
      </div>
    );
  }

  // login and set-password
  return (
    <Routes>
      <Route path="/set-password" element={<SetPasswordPage />} />
      <Route path="*" element={
        <div className="login-page">
          <AuthenticationComponent onLoginSuccess={handleLoginSuccess} />
        </div>
      } />
    </Routes>
  );
}

// Move any reusable business logic to core/businessLogic.js for architecture consistency.