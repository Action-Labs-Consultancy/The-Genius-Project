import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyTasks.css';

const MyTasks = () => {
  // State management
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    dueDate: 'all'
  });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'medium',
    category: 'General',
    estimated_hours: 1,
    subtasks: []
  });

  // Load initial data
  useEffect(() => {
    loadUser();
    loadTasks();
  }, []);

  // Filter tasks when search or filters change
  useEffect(() => {
    filterTasks();
  }, [tasks, searchTerm, filters]);

  const loadUser = async () => {
    try {
      const response = await axios.get('http://localhost:10000/api/users/current');
      setUser(response.data);
    } catch (error) {
      console.error('Error loading user:', error);
      // Set a default user for testing
      setUser({
        id: 'emergency_user_123',
        name: 'Emergency Test User',
        email: 'testhr@example.com'
      });
    }
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading tasks from API...');
      console.log('🔄 Current user:', user);
      
      // Try both with and without user filtering to see what's in the database
      const allTasksResponse = await axios.get('http://localhost:10000/api/tasks');
      console.log('✅ All tasks in database:', allTasksResponse.data);
      
      // Now try to get user-specific tasks
      const userTasksResponse = await axios.get(`http://localhost:10000/api/tasks?userId=${user?.id || 'emergency_user_123'}`);
      console.log('✅ User-specific tasks:', userTasksResponse.data);
      
      setTasks(userTasksResponse.data || []);
    } catch (error) {
      console.error('❌ Error loading tasks:', error);
      console.error('Error details:', error.response?.data || error.message);
      addNotification('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterTasks = () => {
    let filtered = tasks;
    console.log('🔍 Filtering tasks. Total tasks:', tasks.length);
    console.log('🔍 Search term:', searchTerm);
    console.log('🔍 Filters:', filters);

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log('🔍 After search filter:', filtered.length);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(task => {
        if (filters.status === 'pending') return task.status === 'pending';
        if (filters.status === 'in-progress') return task.status === 'in-progress';
        if (filters.status === 'completed') return task.status === 'completed';
        if (filters.status === 'overdue') return task.status === 'overdue';
        return true;
      });
      console.log('🔍 After status filter:', filtered.length);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(task => task.priority === filters.priority);
      console.log('🔍 After priority filter:', filtered.length);
    }

    // Due date filter
    if (filters.dueDate !== 'all') {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const weekFromNow = new Date(today);
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      const monthFromNow = new Date(today);
      monthFromNow.setMonth(monthFromNow.getMonth() + 1);

      filtered = filtered.filter(task => {
        const taskDueDate = new Date(task.due_date);
        if (filters.dueDate === 'today') return taskDueDate.toDateString() === today.toDateString();
        if (filters.dueDate === 'week') return taskDueDate <= weekFromNow && taskDueDate >= today;
        if (filters.dueDate === 'month') return taskDueDate <= monthFromNow && taskDueDate >= today;
        return true;
      });
      console.log('🔍 After due date filter:', filtered.length);
    }

    console.log('🔍 Final filtered tasks:', filtered.length);
    setFilteredTasks(filtered);
  };

  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const clearFilters = () => {
    setFilters({
      status: 'all',
      priority: 'all',
      dueDate: 'all'
    });
    setSearchTerm('');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#28a745';
      case 'in-progress': return '#FFD600';
      case 'overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#FFD600';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const calculateProgress = (task) => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return task.progress || 0;
    }
    const completed = task.subtasks.filter(subtask => subtask.completed).length;
    const progress = Math.round((completed / task.subtasks.length) * 100);
    console.log('📊 Task progress for', task.title + ':', completed, '/', task.subtasks.length, '=', progress + '%');
    return progress;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const openCreateModal = () => {
    setNewTask({
      title: '',
      description: '',
      due_date: '',
      priority: 'medium',
      category: 'General',
      estimated_hours: 1,
      subtasks: []
    });
    setSelectedTask(null);
    setShowCreateModal(true);
  };

  const handleSaveTask = async (taskData) => {
    try {
      if (selectedTask) {
        // Update existing task
        console.log('🔄 Updating task:', selectedTask.id, taskData);
        await axios.put(`http://localhost:10000/api/tasks/${selectedTask.id}`, taskData);
        addNotification('Task updated successfully', 'success');
      } else {
        // Create new task
        const payload = {
          ...taskData,
          assigned_to: user?.id || 'emergency_user_123',
          assigned_by: user?.name || 'Unknown User'
        };
        console.log('🔄 Creating task with payload:', payload);
        const response = await axios.post('http://localhost:10000/api/tasks', payload);
        console.log('✅ Task created successfully:', response.data);
        addNotification('Task created successfully', 'success');
      }
      
      setShowCreateModal(false);
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      console.error('❌ Error saving task:', error);
      console.error('Error details:', error.response?.data || error.message);
      addNotification('Failed to save task', 'error');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await axios.put(`http://localhost:10000/api/tasks/${taskId}`, { status });
      addNotification(`Task marked as ${status}`, 'success');
      loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      addNotification('Failed to update task status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="tasks-loading">
        <div className="loading-spinner"></div>
        <p>Loading your tasks...</p>
      </div>
    );
  }

  return (
    <div className="my-tasks-container">
      {/* Header */}
      <div className="tasks-header">
        <h1>My Tasks</h1>
        <div className="header-buttons">
          <button className="refresh-btn" onClick={loadTasks} style={{
            background: 'transparent',
            border: '2px solid #FFD600',
            color: '#FFD600',
            padding: '8px 16px',
            borderRadius: '6px',
            marginRight: '10px',
            cursor: 'pointer'
          }}>
            🔄 Refresh Tasks
          </button>
          <button className="create-task-btn" onClick={openCreateModal}>
            + Create New Task
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="notifications-container">
          {notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`notification notification-${notification.type}`}
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
            >
              <span>{notification.message}</span>
              <button className="notification-close">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Search and Filters */}
      <div className="tasks-controls">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search tasks by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filters-section">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority:</label>
            <select 
              value={filters.priority} 
              onChange={(e) => setFilters(prev => ({...prev, priority: e.target.value}))}
            >
              <option value="all">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Due Date:</label>
            <select 
              value={filters.dueDate} 
              onChange={(e) => setFilters(prev => ({...prev, dueDate: e.target.value}))}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <button className="clear-filters-btn" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-list">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <p>No tasks found matching your criteria.</p>
            <button className="create-first-task-btn" onClick={openCreateModal}>
              Create Your First Task
            </button>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3 className="task-title" onClick={() => openTaskDetails(task)}>
                  {task.title}
                </h3>
                <div className="task-badges">
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(task.status) }}
                  >
                    {task.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                  <span 
                    className="priority-badge" 
                    style={{ backgroundColor: getPriorityColor(task.priority) }}
                  >
                    {task.priority.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="task-description">
                {task.description}
              </div>

              <div className="task-progress">
                <div className="progress-info">
                  <span>Progress: {calculateProgress(task)}%</span>
                  {task.subtasks && task.subtasks.length > 0 && (
                    <span className="subtasks-summary">
                      {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length} Subtasks Completed
                    </span>
                  )}
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${calculateProgress(task)}%` }}
                  ></div>
                </div>
              </div>

              <div className="task-details">
                <div className="task-meta">
                  <span>Due: {formatDate(task.due_date)}</span>
                  <span>Assigned by: {task.assigned_by}</span>
                  <span>Category: {task.category}</span>
                </div>
              </div>

              <div className="task-actions">
                <button 
                  className="btn-view" 
                  onClick={() => openTaskDetails(task)}
                >
                  View Task
                </button>
                <button 
                  className="btn-edit" 
                  onClick={() => {
                    setSelectedTask(task);
                    setNewTask({...task});
                    setShowCreateModal(true);
                  }}
                >
                  Edit Task
                </button>
                {calculateProgress(task) === 100 && task.status !== 'completed' && (
                  <button 
                    className="btn-complete"
                    onClick={() => updateTaskStatus(task.id, 'completed')}
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Task Modal */}
      {showCreateModal && (
        <CreateTaskModal 
          task={selectedTask}
          newTask={newTask}
          setNewTask={setNewTask}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTask(null);
          }}
          onSave={handleSaveTask}
          user={user}
        />
      )}

      {/* Task Details Modal */}
      {showTaskDetails && selectedTask && (
        <TaskDetailsModal 
          task={selectedTask}
          onClose={() => {
            setShowTaskDetails(false);
            setSelectedTask(null);
          }}
          onUpdate={loadTasks}
          user={user}
          getStatusColor={getStatusColor}
          getPriorityColor={getPriorityColor}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};

// Create Task Modal Component
const CreateTaskModal = ({ task, newTask, setNewTask, onClose, onSave, user }) => {
  const [subtasks, setSubtasks] = useState(task?.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');

  const addSubtask = () => {
    if (newSubtask.trim()) {
      const subtask = {
        id: Date.now(),
        title: newSubtask.trim(),
        completed: false
      };
      setSubtasks([...subtasks, subtask]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter(st => st.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({...newTask, subtasks});
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content create-task-modal">
        <div className="modal-header">
          <h2>{task ? 'Edit Task' : 'Create New Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label>Task Title *</label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask(prev => ({...prev, title: e.target.value}))}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask(prev => ({...prev, description: e.target.value}))}
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Due Date *</label>
              <input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask(prev => ({...prev, due_date: e.target.value}))}
                required
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <select
                value={newTask.priority}
                onChange={(e) => setNewTask(prev => ({...prev, priority: e.target.value}))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={newTask.category}
                onChange={(e) => setNewTask(prev => ({...prev, category: e.target.value}))}
              >
                <option value="General">General</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Research">Research</option>
              </select>
            </div>

            <div className="form-group">
              <label>Estimated Hours</label>
              <input
                type="number"
                min="1"
                value={newTask.estimated_hours}
                onChange={(e) => setNewTask(prev => ({...prev, estimated_hours: parseInt(e.target.value)}))}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Subtasks</label>
            <div className="subtasks-section">
              <div className="add-subtask">
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                />
                <button type="button" onClick={addSubtask}>Add</button>
              </div>
              
              {subtasks.length > 0 && (
                <div className="subtasks-list">
                  {subtasks.map(subtask => (
                    <div key={subtask.id} className="subtask-item">
                      <span>{subtask.title}</span>
                      <button type="button" onClick={() => removeSubtask(subtask.id)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-save">
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Task Details Modal Component
const TaskDetailsModal = ({ task, onClose, onUpdate, user, getStatusColor, getPriorityColor, formatDate }) => {
  const [localTask, setLocalTask] = useState(task);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateTaskStatus = async (status) => {
    try {
      setIsUpdating(true);
      
      // Update local state first
      setLocalTask(prev => ({...prev, status}));
      
      await axios.put(`http://localhost:10000/api/tasks/${task.id}`, { status });
      console.log('✅ Task status updated to:', status);
      
      // DO NOT CALL onUpdate() - let user manually refresh
      console.log('✅ Task status update complete - no auto refresh');
      
    } catch (error) {
      console.error('Error updating task status:', error);
      // Revert on error
      setLocalTask(task);
    } finally {
      setIsUpdating(false);
    }
  };

  const updateSubtask = async (subtaskId, completed) => {
    try {
      console.log('🔄 updateSubtask called with:', { subtaskId, completed, taskId: task.id });
      console.log('🔄 Current subtasks:', localTask.subtasks);
      
      // Update local state FIRST (optimistic update)
      const updatedSubtasks = localTask.subtasks.map(st => 
        st.id === subtaskId ? {...st, completed: completed} : st
      );
      
      // Calculate new progress
      const completedCount = updatedSubtasks.filter(st => st.completed).length;
      const newProgress = Math.round((completedCount / updatedSubtasks.length) * 100);
      
      console.log('📊 New progress calculation:', {
        completedCount,
        totalSubtasks: updatedSubtasks.length,
        newProgress
      });
      
      // Update local state immediately for instant UI feedback
      setLocalTask(prev => ({
        ...prev,
        subtasks: updatedSubtasks,
        progress: newProgress,
        status: newProgress === 100 ? 'completed' : (newProgress > 0 ? 'in-progress' : prev.status)
      }));
      
      // Now make the API call
      const response = await axios.put(`http://localhost:10000/api/tasks/${task.id}/subtasks/${subtaskId}`, { 
        completed: completed 
      });
      
      console.log('✅ Subtask update response:', response.data);
      
      // If task is now complete, update it on the server
      if (newProgress === 100 && localTask.status !== 'completed') {
        console.log('✅ Auto-completing task as all subtasks are done');
        await axios.put(`http://localhost:10000/api/tasks/${task.id}`, { 
          status: 'completed',
          progress: 100
        });
      }
      
      // DO NOT CALL onUpdate() - let the user manually refresh if needed
      console.log('✅ Subtask update complete - no auto refresh');
      
    } catch (error) {
      console.error('❌ Error updating subtask:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      
      // Revert local state on error
      setLocalTask(task);
    }
  };

  const calculateProgress = () => {
    if (!localTask.subtasks || localTask.subtasks.length === 0) {
      return localTask.progress || 0;
    }
    const completed = localTask.subtasks.filter(st => st.completed).length;
    const progress = Math.round((completed / localTask.subtasks.length) * 100);
    console.log('📊 Calculating progress:', completed, '/', localTask.subtasks.length, '=', progress + '%');
    return progress;
  };

  const allSubtasksComplete = localTask.subtasks && localTask.subtasks.length > 0 
    ? localTask.subtasks.every(st => st.completed) 
    : calculateProgress() === 100;

  return (
    <div className="modal-overlay">
      <div className="modal-content task-details-modal">
        <div className="modal-header">
          <h2>{localTask.title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="task-details-content">
          <div className="task-info">
            <div className="task-description-full">
              <h3>Description</h3>
              <p>{localTask.description}</p>
            </div>

            <div className="task-progress-full">
              <h3>Progress: {calculateProgress()}%</h3>
              <div className="progress-bar-large">
                <div 
                  className="progress-fill" 
                  style={{ width: `${calculateProgress()}%` }}
                ></div>
              </div>
            </div>

            <div className="task-meta-full">
              <div className="meta-item">
                <strong>Status:</strong> 
                <span className="status-badge" style={{ backgroundColor: getStatusColor(localTask.status) }}>
                  {localTask.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
              <div className="meta-item">
                <strong>Priority:</strong> 
                <span className="priority-badge" style={{ backgroundColor: getPriorityColor(localTask.priority) }}>
                  {localTask.priority.toUpperCase()}
                </span>
              </div>
              <div className="meta-item"><strong>Due Date:</strong> {formatDate(localTask.due_date)}</div>
              <div className="meta-item"><strong>Category:</strong> {localTask.category}</div>
              <div className="meta-item"><strong>Assigned by:</strong> {localTask.assigned_by}</div>
              <div className="meta-item"><strong>Estimated Hours:</strong> {localTask.estimated_hours}</div>
            </div>
          </div>

          {localTask.subtasks && localTask.subtasks.length > 0 && (
            <div className="subtasks-section-details">
              <h3>Subtasks ({localTask.subtasks.filter(st => st.completed).length}/{localTask.subtasks.length})</h3>
              <div className="subtasks-list-details">
                {localTask.subtasks.map(subtask => (
                  <div key={subtask.id} className="subtask-item-details">
                    <label className="subtask-checkbox">
                      <input
                        type="checkbox"
                        checked={subtask.completed || false}
                        onChange={(e) => {
                          console.log('🔄 Checkbox clicked for subtask:', subtask.id, 'new value:', e.target.checked);
                          updateSubtask(subtask.id, e.target.checked);
                        }}
                      />
                      <span className={subtask.completed ? 'completed' : ''}>{subtask.title}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="task-actions-details">
            {allSubtasksComplete && localTask.status !== 'completed' && (
              <button 
                className="btn-complete-large"
                onClick={() => updateTaskStatus('completed')}
                disabled={isUpdating}
              >
                Mark Task Complete
              </button>
            )}
            
            {localTask.status !== 'completed' && (
              <button 
                className="btn-in-progress"
                onClick={() => updateTaskStatus('in-progress')}
                disabled={isUpdating}
              >
                Mark In Progress
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyTasks;
