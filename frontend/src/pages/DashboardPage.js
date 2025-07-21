import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasksStore } from '../stores/authStore';
import TaskCard from '../components/TaskCard';
import { Calendar, Clock, User, Briefcase, TrendingUp } from 'lucide-react';
import './DashboardPage.css';

const DashboardPage = ({ user }) => {
  const navigate = useNavigate();
  const { myTasks, loadMyTasks, loading } = useTasksStore();
  const [filter, setFilter] = useState('all'); // all, today, week, overdue

  useEffect(() => {
    loadMyTasks();
  }, [loadMyTasks]);

  const getFilteredTasks = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    switch (filter) {
      case 'today':
        return myTasks.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate.toDateString() === today.toDateString();
        });
      case 'week':
        return myTasks.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate >= today && dueDate <= weekFromNow;
        });
      case 'overdue':
        return myTasks.filter(task => {
          if (!task.due_date) return false;
          const dueDate = new Date(task.due_date);
          return dueDate < today && task.status !== 'done';
        });
      default:
        return myTasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  const getTaskStats = () => {
    const total = myTasks.length;
    const completed = myTasks.filter(task => task.status === 'done').length;
    const inProgress = myTasks.filter(task => task.status === 'in_progress').length;
    const overdue = myTasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      const today = new Date();
      return dueDate < today && task.status !== 'done';
    }).length;

    return { total, completed, inProgress, overdue };
  };

  const stats = getTaskStats();

  const handleTaskClick = (task) => {
    navigate(`/projects/${task.project_id}`, { 
      state: { highlightTaskId: task.id } 
    });
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {user.full_name}! 👋</h1>
          <p>Here's what's on your plate today</p>
        </div>
        <div className="user-avatar">
          <img 
            src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=FFD600&color=181818&size=64`}
            alt={user.full_name}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <Briefcase />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.total}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>

        <div className="stat-card in-progress">
          <div className="stat-icon">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>

        <div className="stat-card completed">
          <div className="stat-icon">
            <Calendar />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="stat-card overdue">
          <div className="stat-icon">
            <Clock />
          </div>
          <div className="stat-content">
            <span className="stat-number">{stats.overdue}</span>
            <span className="stat-label">Overdue</span>
          </div>
        </div>
      </div>

      {/* My Tasks Section */}
      <div className="my-tasks-section">
        <div className="section-header">
          <h2>My Tasks</h2>
          <div className="filter-tabs">
            <button 
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              All ({myTasks.length})
            </button>
            <button 
              className={filter === 'today' ? 'active' : ''}
              onClick={() => setFilter('today')}
            >
              Due Today
            </button>
            <button 
              className={filter === 'week' ? 'active' : ''}
              onClick={() => setFilter('week')}
            >
              This Week
            </button>
            <button 
              className={filter === 'overdue' ? 'active' : ''}
              onClick={() => setFilter('overdue')}
            >
              Overdue ({stats.overdue})
            </button>
          </div>
        </div>

        <div className="tasks-grid">
          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No tasks found</h3>
              <p>
                {filter === 'all' 
                  ? "You don't have any tasks assigned yet."
                  : `No tasks match the "${filter}" filter.`
                }
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskCard 
                key={task.id}
                task={task}
                onClick={() => handleTaskClick(task)}
                showProject={true}
                showClient={true}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
