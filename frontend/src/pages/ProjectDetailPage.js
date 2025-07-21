import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useProjectsStore, useTasksStore, useAuthStore } from '../stores/authStore';
import { ArrowLeft, Plus, Filter, Search } from 'lucide-react';
import KanbanBoard from '../components/KanbanBoard';
import TaskModal from '../components/TaskModal';
import './ProjectDetailPage.css';

const ProjectDetailPage = ({ user }) => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentProject, loadProject, loading: projectLoading } = useProjectsStore();
  const { tasks, loadTasks, loading: tasksLoading } = useTasksStore();
  const { canEditTask, canAssignTasks } = useAuthStore();
  
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  // Get highlighted task from navigation state
  const highlightTaskId = location.state?.highlightTaskId;

  useEffect(() => {
    if (projectId) {
      loadProject(projectId);
      loadTasks(projectId);
    }
  }, [projectId, loadProject, loadTasks]);

  // Highlight task if coming from dashboard
  useEffect(() => {
    if (highlightTaskId && tasks.length > 0) {
      const taskElement = document.getElementById(`task-${highlightTaskId}`);
      if (taskElement) {
        taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        taskElement.classList.add('highlighted');
        setTimeout(() => {
          taskElement.classList.remove('highlighted');
        }, 3000);
      }
    }
  }, [highlightTaskId, tasks]);

  const handleEditTask = (task) => {
    if (canEditTask(task)) {
      setEditingTask(task);
      setShowTaskModal(true);
    }
  };

  const handleAddTask = (status = 'todo') => {
    setEditingTask({ status, project_id: projectId });
    setShowTaskModal(true);
  };

  const getFilteredTasks = () => {
    return tasks.filter(task => {
      // Search filter
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Assignee filter
      if (filterAssignee !== 'all') {
        if (filterAssignee === 'unassigned' && task.assigned_to_id) return false;
        if (filterAssignee === 'me' && task.assigned_to_id !== user.id) return false;
        if (filterAssignee !== 'unassigned' && filterAssignee !== 'me' && 
            task.assigned_to_id !== parseInt(filterAssignee)) return false;
      }
      
      // Priority filter
      if (filterPriority !== 'all' && task.priority !== filterPriority) {
        return false;
      }
      
      return true;
    });
  };

  const filteredTasks = getFilteredTasks();

  // Group tasks by status
  const tasksByStatus = {
    todo: filteredTasks.filter(task => task.status === 'todo'),
    in_progress: filteredTasks.filter(task => task.status === 'in_progress'),
    review: filteredTasks.filter(task => task.status === 'review'),
    done: filteredTasks.filter(task => task.status === 'done')
  };

  // Get unique assignees for filter
  const assignees = [...new Set(tasks.map(task => task.assignee).filter(Boolean))];

  if (projectLoading || !currentProject) {
    return (
      <div className="project-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      {/* Header */}
      <div className="page-header">
        <button 
          className="back-btn"
          onClick={() => navigate(`/clients/${currentProject.client_id}`)}
        >
          <ArrowLeft size={20} />
          Back to {currentProject.client_name}
        </button>
        
        <div className="project-info">
          <div className="project-title">
            <h1>{currentProject.name}</h1>
            <div className={`project-status ${currentProject.status}`}>
              {currentProject.status}
            </div>
          </div>
          {currentProject.description && (
            <p className="project-description">{currentProject.description}</p>
          )}
        </div>

        <div className="project-meta">
          <div className="meta-item">
            <span className="label">Due Date:</span>
            <span className="value">
              {currentProject.due_date 
                ? new Date(currentProject.due_date).toLocaleDateString()
                : 'No deadline'
              }
            </span>
          </div>
          <div className="meta-item">
            <span className="label">Team:</span>
            <div className="team-avatars">
              {currentProject.team_members?.slice(0, 3).map((member, i) => (
                <img 
                  key={i}
                  src={member.avatar_url || `https://ui-avatars.com/api/?name=${member.full_name}&background=FFD600&color=181818&size=32`}
                  alt={member.full_name}
                  className="team-avatar"
                  title={member.full_name}
                />
              ))}
              {currentProject.team_members?.length > 3 && (
                <div className="team-overflow">
                  +{currentProject.team_members.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="project-controls">
        <div className="filters-section">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <select 
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Assignees</option>
              <option value="me">My Tasks</option>
              <option value="unassigned">Unassigned</option>
              {assignees.map(assignee => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.full_name}
                </option>
              ))}
            </select>

            <select 
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        <button 
          className="add-task-btn"
          onClick={() => handleAddTask()}
        >
          <Plus size={20} />
          Add Task
        </button>
      </div>

      {/* Task Statistics */}
      <div className="task-stats">
        <div className="stat-item">
          <span className="stat-number">{tasksByStatus.todo.length}</span>
          <span className="stat-label">To Do</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{tasksByStatus.in_progress.length}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{tasksByStatus.review.length}</span>
          <span className="stat-label">Review</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{tasksByStatus.done.length}</span>
          <span className="stat-label">Done</span>
        </div>
      </div>

      {/* Kanban Board */}
      {tasksLoading ? (
        <div className="tasks-loading">
          <div className="loading-spinner"></div>
          <p>Loading tasks...</p>
        </div>
      ) : (
        <KanbanBoard
          tasksByStatus={tasksByStatus}
          onTaskClick={handleEditTask}
          onAddTask={handleAddTask}
          canEditTask={canEditTask}
          projectId={projectId}
        />
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projectId={projectId}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={() => {
            setShowTaskModal(false);
            setEditingTask(null);
            loadTasks(projectId); // Refresh tasks
          }}
          canEdit={editingTask ? canEditTask(editingTask) : true}
          canAssign={canAssignTasks()}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;
