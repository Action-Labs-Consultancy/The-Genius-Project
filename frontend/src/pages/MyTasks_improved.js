import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import TaskDetails from '../components/TaskDetails';
import './MyTasks.css';

const MyTasks = ({ user, onNavigate, onLogout, onLogoClick }) => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dueDateFilter, setDueDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // New UI improvement states
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [expandedTasks, setExpandedTasks] = useState(new Set());
  const [notifications, setNotifications] = useState([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    showPriority: true,
    showDueDate: true,
    showAssignee: true,
    showProgress: true,
    showCategory: true,
    viewDensity: 'comfortable'
  });

  useEffect(() => {
    loadTasks();
    loadUserPreferences();
    checkForNotifications();
  }, [user]);

  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, statusFilter, priorityFilter, dueDateFilter, categoryFilter]);

  useEffect(() => {
    const interval = setInterval(checkForNotifications, 300000);
    return () => clearInterval(interval);
  }, [tasks]);

  const loadUserPreferences = () => {
    const saved = localStorage.getItem(`taskPreferences_${user?.id}`);
    if (saved) {
      setUserPreferences(JSON.parse(saved));
    }
  };

  const saveUserPreferences = (newPreferences) => {
    setUserPreferences(newPreferences);
    localStorage.setItem(`taskPreferences_${user?.id}`, JSON.stringify(newPreferences));
  };

  const checkForNotifications = () => {
    const now = new Date();
    const newNotifications = [];
    
    tasks.forEach(task => {
      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      if (daysDiff < 0 && task.status !== 'completed') {
        newNotifications.push({
          id: `overdue_${task.id}`,
          type: 'overdue',
          message: `Task "${task.title}" is ${Math.abs(daysDiff)} day(s) overdue`,
          taskId: task.id,
          severity: 'high'
        });
      } else if (daysDiff >= 0 && daysDiff <= 2 && task.status !== 'completed') {
        newNotifications.push({
          id: `due_soon_${task.id}`,
          type: 'due_soon',
          message: `Task "${task.title}" is due ${daysDiff === 0 ? 'today' : `in ${daysDiff} day(s)`}`,
          taskId: task.id,
          severity: 'medium'
        });
      }
    });
    
    setNotifications(newNotifications);
  };

  const getTaskStatus = (task) => {
    const now = new Date();
    const dueDate = new Date(task.dueDate);
    
    if (task.status === 'completed') return 'completed';
    if (dueDate < now) return 'overdue';
    if (task.status === 'in_progress') return 'in_progress';
    return 'pending';
  };

  const calculateTaskProgress = (task) => {
    if (task.status === 'completed') return 100;
    if (task.subtasks && task.subtasks.length > 0) {
      const completed = task.subtasks.filter(sub => sub.completed).length;
      return Math.round((completed / task.subtasks.length) * 100);
    }
    if (task.status === 'in_progress') return task.progress || 50;
    return 0;
  };

  const toggleTaskExpansion = (taskId) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const dismissNotification = (notificationId) => {
    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const loadTasks = async () => {
    setLoading(true);
    setError('');
    try {
      if (!user?.id) {
        setTasks([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/tasks?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setTasks(Array.isArray(data) ? data : data.tasks || []);
      } else {
        console.error('Failed to load tasks:', response.statusText);
        setError('Failed to load tasks');
        setTasks([]);
      }
      
    } catch (error) {
      console.error('Error loading tasks:', error);
      setError('Failed to load tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    setError('');
    try {
      const taskToCreate = {
        ...taskData,
        assignedTo: user?.id || user?._id,
        assignedBy: user?.id === taskData.assignedTo ? 'Self-assigned' : (user?.name || 'Current User'),
        assignedDate: new Date().toISOString(),
        userId: user?.id || user?._id,
        status: 'pending',
        progress: 0,
        subtasks: taskData.subtasks || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(taskToCreate)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create task');
      }
      
      await loadTasks();
      setShowCreateModal(false);
      
      setNotifications(prev => [...prev, {
        id: `success_${Date.now()}`,
        type: 'success',
        message: 'Task created successfully!',
        severity: 'low'
      }]);
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          progress: newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0,
          updatedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        await loadTasks();
        setNotifications(prev => [...prev, {
          id: `status_update_${Date.now()}`,
          type: 'success',
          message: `Task status updated to ${newStatus.replace('_', ' ')}`,
          severity: 'low'
        }]);
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const toggleSubtask = async (taskId, subtaskIndex) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = [...task.subtasks];
    updatedSubtasks[subtaskIndex].completed = !updatedSubtasks[subtaskIndex].completed;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getToken('token')}`
        },
        body: JSON.stringify({ 
          subtasks: updatedSubtasks,
          updatedAt: new Date().toISOString()
        })
      });
      
      if (response.ok) {
        await loadTasks();
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  const filterTasks = () => {
    let filtered = [...tasks];

    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => {
        const status = getTaskStatus(task);
        return status === statusFilter;
      });
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(task => task.priority === priorityFilter);
    }

    if (dueDateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(task => {
        const dueDate = new Date(task.dueDate);
        switch (dueDateFilter) {
          case 'today':
            return dueDate.toDateString() === now.toDateString();
          case 'this-week':
            const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return dueDate >= now && dueDate <= weekFromNow;
          case 'this-month':
            return dueDate.getMonth() === now.getMonth() && dueDate.getFullYear() === now.getFullYear();
          case 'overdue':
            return dueDate < now && task.status !== 'completed';
          default:
            return true;
        }
      });
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    setFilteredTasks(filtered);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDueDateFilter('all');
    setCategoryFilter('all');
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  if (loading) {
    return (
      <div className="my-tasks-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="my-tasks-container">
        {/* Notifications Bar */}
        {notifications.length > 0 && (
          <div className="notifications-bar">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification notification-${notification.severity}`}
              >
                <div className="notification-content">
                  <span className="notification-icon">
                    {notification.type === 'overdue' ? '⚠️' : 
                     notification.type === 'due_soon' ? '⏰' : '✅'}
                  </span>
                  <span className="notification-message">{notification.message}</span>
                </div>
                <button 
                  className="notification-dismiss"
                  onClick={() => dismissNotification(notification.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="error-banner">
            <span className="error-icon">❌</span>
            <span className="error-message">{error}</span>
            <button 
              className="error-dismiss"
              onClick={() => setError('')}
            >
              ✕
            </button>
          </div>
        )}

        {/* Header */}
        <div className="my-tasks-header">
          <div className="header-content">
            <h1 className="my-tasks-title">My Tasks</h1>
            <p className="page-subtitle">Manage and track your assigned tasks</p>
          </div>
          <div className="header-actions">
            <button 
              className="settings-btn"
              onClick={() => setShowPreferences(!showPreferences)}
              title="Customize view"
            >
              ⚙️
            </button>
            <button 
              className="create-task-btn"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="btn-icon">+</span>
              Create Task
            </button>
          </div>
        </div>

        {/* User Preferences Panel */}
        {showPreferences && (
          <div className="preferences-panel">
            <h3>Customize Your View</h3>
            <div className="preferences-grid">
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={userPreferences.showPriority}
                  onChange={(e) => saveUserPreferences({
                    ...userPreferences,
                    showPriority: e.target.checked
                  })}
                />
                Show Priority
              </label>
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={userPreferences.showDueDate}
                  onChange={(e) => saveUserPreferences({
                    ...userPreferences,
                    showDueDate: e.target.checked
                  })}
                />
                Show Due Date
              </label>
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={userPreferences.showProgress}
                  onChange={(e) => saveUserPreferences({
                    ...userPreferences,
                    showProgress: e.target.checked
                  })}
                />
                Show Progress
              </label>
              <label className="preference-item">
                <input
                  type="checkbox"
                  checked={userPreferences.showCategory}
                  onChange={(e) => saveUserPreferences({
                    ...userPreferences,
                    showCategory: e.target.checked
                  })}
                />
                Show Category
              </label>
            </div>
            <div className="view-density-options">
              <label>View Density:</label>
              {['compact', 'comfortable', 'spacious'].map(density => (
                <label key={density} className="density-option">
                  <input
                    type="radio"
                    name="density"
                    value={density}
                    checked={userPreferences.viewDensity === density}
                    onChange={(e) => saveUserPreferences({
                      ...userPreferences,
                      viewDensity: e.target.value
                    })}
                  />
                  {density.charAt(0).toUpperCase() + density.slice(1)}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="controls-section">
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <span className="view-icon">📋</span>
              List
            </button>
            <button 
              className={`view-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              <span className="view-icon">📅</span>
              Calendar
            </button>
            <button 
              className={`view-btn ${viewMode === 'stats' ? 'active' : ''}`}
              onClick={() => setViewMode('stats')}
            >
              <span className="view-icon">📊</span>
              Statistics
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="filters-section">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search tasks by title, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="quick-filters">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priority</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>

            <button 
              className="advanced-filters-toggle"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <span className="toggle-icon">{showAdvancedFilters ? '▼' : '▶'}</span>
              More Filters
            </button>

            {(statusFilter !== 'all' || priorityFilter !== 'all' || dueDateFilter !== 'all' || categoryFilter !== 'all') && (
              <button onClick={clearAllFilters} className="clear-filters-btn">
                Clear All
              </button>
            )}
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="advanced-filters">
              <div className="advanced-filters-grid">
                <div className="filter-group">
                  <label>Due Date</label>
                  <select
                    value={dueDateFilter}
                    onChange={(e) => setDueDateFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">Any time</option>
                    <option value="today">Due today</option>
                    <option value="this-week">This week</option>
                    <option value="this-month">This month</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All categories</option>
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Testing">Testing</option>
                    <option value="Review">Review</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Research">Research</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <div className="summary-stats">
            <span className="stat-item">
              <strong>{filteredTasks.length}</strong> of <strong>{tasks.length}</strong> tasks
            </span>
            {filteredTasks.length !== tasks.length && (
              <span className="filter-indicator">• Filtered results</span>
            )}
          </div>
          <div className="quick-stats">
            <span className="quick-stat completed">
              {filteredTasks.filter(t => getTaskStatus(t) === 'completed').length} Completed
            </span>
            <span className="quick-stat overdue">
              {filteredTasks.filter(t => getTaskStatus(t) === 'overdue').length} Overdue
            </span>
            <span className="quick-stat in-progress">
              {filteredTasks.filter(t => getTaskStatus(t) === 'in_progress').length} In Progress
            </span>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'list' && (
          <div className={`tasks-list-container density-${userPreferences.viewDensity}`}>
            {filteredTasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>No tasks found</h3>
                <p>
                  {tasks.length === 0 
                    ? "You don't have any tasks assigned yet. Create your first task to get started!" 
                    : "No tasks match your current filters. Try adjusting your search criteria."
                  }
                </p>
                <div className="empty-actions">
                  {tasks.length === 0 ? (
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowCreateModal(true)}
                    >
                      Create Your First Task
                    </button>
                  ) : (
                    <button onClick={clearAllFilters} className="btn btn-secondary">
                      Clear All Filters
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="tasks-grid">
                {filteredTasks.map(task => {
                  const taskStatus = getTaskStatus(task);
                  const progress = calculateTaskProgress(task);
                  const isExpanded = expandedTasks.has(task.id);
                  const isSelefAssigned = task.assignedBy === 'Self-assigned';
                  
                  return (
                    <div key={task.id} className={`task-card task-${taskStatus}`}>
                      <div className="task-header" onClick={() => handleTaskClick(task)}>
                        <div className="task-title-section">
                          <h3 className="task-title">{task.title}</h3>
                          {isSelefAssigned && (
                            <span className="self-assigned-badge">Self-assigned</span>
                          )}
                        </div>
                        
                        {userPreferences.showPriority && (
                          <div className="task-meta-badges">
                            <span className={`priority-badge priority-${task.priority}`}>
                              {task.priority === 'high' ? '🔴' : task.priority === 'medium' ? '🟡' : '🟢'}
                              {task.priority.toUpperCase()}
                            </span>
                            <span className={`status-badge status-${taskStatus}`}>
                              {taskStatus === 'completed' ? '✅' : 
                               taskStatus === 'overdue' ? '⚠️' : 
                               taskStatus === 'in_progress' ? '🔄' : '⏳'}
                              {taskStatus.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="task-content">
                        <p className="task-description">{task.description}</p>
                        
                        {userPreferences.showProgress && (
                          <div className="task-progress-section">
                            <div className="progress-header">
                              <span className="progress-label">Progress</span>
                              <span className="progress-value">{progress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div 
                                className={`progress-fill progress-${taskStatus}`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            {task.subtasks && task.subtasks.length > 0 && (
                              <div className="progress-details">
                                {task.subtasks.filter(sub => sub.completed).length} of {task.subtasks.length} subtasks completed
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="task-meta-grid">
                          {userPreferences.showDueDate && (
                            <div className="meta-item">
                              <span className="meta-label">Due Date</span>
                              <span className={`meta-value due-date ${taskStatus === 'overdue' ? 'overdue' : ''}`}>
                                {new Date(task.dueDate).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            </div>
                          )}
                          
                          {userPreferences.showCategory && (
                            <div className="meta-item">
                              <span className="meta-label">Category</span>
                              <span className="meta-value category-tag">{task.category}</span>
                            </div>
                          )}
                          
                          <div className="meta-item">
                            <span className="meta-label">Assigned</span>
                            <span className="meta-value">{task.assignedBy}</span>
                          </div>
                        </div>

                        {/* Subtasks Section */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="subtasks-section">
                            <button 
                              className="subtasks-toggle"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskExpansion(task.id);
                              }}
                            >
                              <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                              {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
                            </button>
                            
                            {isExpanded && (
                              <div className="subtasks-list">
                                {task.subtasks.map((subtask, index) => (
                                  <div key={index} className="subtask-item">
                                    <label className="subtask-checkbox">
                                      <input
                                        type="checkbox"
                                        checked={subtask.completed}
                                        onChange={(e) => {
                                          e.stopPropagation();
                                          toggleSubtask(task.id, index);
                                        }}
                                      />
                                      <span className={`subtask-text ${subtask.completed ? 'completed' : ''}`}>
                                        {subtask.title}
                                      </span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="task-actions">
                          {taskStatus !== 'completed' && (
                            <>
                              {taskStatus === 'pending' && (
                                <button 
                                  className="action-btn start-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTaskStatus(task.id, 'in_progress');
                                  }}
                                >
                                  ▶️ Start
                                </button>
                              )}
                              
                              <button 
                                className="action-btn complete-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateTaskStatus(task.id, 'completed');
                                }}
                              >
                                ✅ Complete
                              </button>
                            </>
                          )}
                          
                          <button 
                            className="action-btn details-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            👁️ Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <div className="calendar-container">
            <div className="calendar-placeholder">
              <h3>📅 Calendar View</h3>
              <p>Calendar view coming soon! For now, use the list view to manage your tasks.</p>
              <div className="placeholder-calendar">
                {filteredTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="placeholder-task" onClick={() => handleTaskClick(task)}>
                    <strong>{task.title}</strong>
                    <br />
                    <small>Due: {new Date(task.dueDate).toLocaleDateString()}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Statistics View */}
        {viewMode === 'stats' && (
          <div className="stats-container">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>📊 Task Statistics</h3>
                <div className="quick-stats">
                  <div className="quick-stat">
                    <span className="stat-number">{tasks.length}</span>
                    <span className="stat-label">Total Tasks</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-number">{tasks.filter(t => getTaskStatus(t) === 'completed').length}</span>
                    <span className="stat-label">Completed</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-number">{tasks.filter(t => getTaskStatus(t) === 'overdue').length}</span>
                    <span className="stat-label">Overdue</span>
                  </div>
                  <div className="quick-stat">
                    <span className="stat-number">{tasks.filter(t => getTaskStatus(t) === 'in_progress').length}</span>
                    <span className="stat-label">In Progress</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <TaskDetails
          task={selectedTask}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          onUpdate={loadTasks}
        />
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createTask}
        />
      )}
    </>
  );
};

// Enhanced Create Task Modal Component
const CreateTaskModal = ({ onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'medium',
    category: 'Development',
    estimatedHours: 1,
    subtasks: []
  });

  const [subtaskInput, setSubtaskInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    
    onCreate(formData);
  };

  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      subtasks: [...prev.subtasks, { title: subtaskInput, completed: false }]
    }));
    setSubtaskInput('');
  };

  const removeSubtask = (index) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter((_, i) => i !== index)
    }));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content enhanced-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New Task</h2>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-input"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter a clear, specific title for your task..."
              required
              maxLength={100}
            />
            <div className="form-hint">
              Be specific and actionable (e.g., "Complete user authentication feature")
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe the task objectives, requirements, and expected outcomes..."
              rows={4}
              maxLength={500}
            />
            <div className="form-hint">
              Include key requirements and success criteria
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                className="form-input"
                value={formData.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={formData.priority}
                onChange={(e) => handleChange('priority', e.target.value)}
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option value="Development">💻 Development</option>
                <option value="Design">🎨 Design</option>
                <option value="Testing">🧪 Testing</option>
                <option value="Review">👀 Review</option>
                <option value="Meeting">🤝 Meeting</option>
                <option value="Research">📚 Research</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Hours</label>
              <input
                type="number"
                className="form-input"
                value={formData.estimatedHours}
                onChange={(e) => handleChange('estimatedHours', parseInt(e.target.value) || 1)}
                min="1"
                max="40"
              />
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="form-group">
            <label className="form-label">Subtasks (Optional)</label>
            <div className="subtasks-input">
              <input
                type="text"
                className="form-input"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                placeholder="Add a subtask..."
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={addSubtask}
                disabled={!subtaskInput.trim()}
              >
                Add
              </button>
            </div>
            
            {formData.subtasks.length > 0 && (
              <div className="subtasks-preview">
                {formData.subtasks.map((subtask, index) => (
                  <div key={index} className="subtask-preview-item">
                    <span className="subtask-preview-text">{subtask.title}</span>
                    <button
                      type="button"
                      className="subtask-remove-btn"
                      onClick={() => removeSubtask(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!formData.title.trim()}
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MyTasks;
