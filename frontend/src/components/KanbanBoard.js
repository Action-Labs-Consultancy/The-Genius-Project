import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTasksStore } from '../stores/authStore';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import './KanbanBoard.css';

const KanbanBoard = ({ 
  tasksByStatus, 
  onTaskClick, 
  onAddTask, 
  canEditTask, 
  projectId 
}) => {
  const { moveTask } = useTasksStore();
  const [draggedTask, setDraggedTask] = useState(null);

  const columns = [
    { id: 'todo', title: 'To Do', color: '#666' },
    { id: 'in_progress', title: 'In Progress', color: '#2196F3' },
    { id: 'review', title: 'Review', color: '#FF9800' },
    { id: 'done', title: 'Done', color: '#4CAF50' }
  ];

  const handleDragStart = (start) => {
    const taskId = parseInt(start.draggableId);
    const task = Object.values(tasksByStatus)
      .flat()
      .find(task => task.id === taskId);
    setDraggedTask(task);
  };

  const handleDragEnd = async (result) => {
    setDraggedTask(null);
    
    if (!result.destination) return;

    const taskId = parseInt(result.draggableId);
    const newStatus = result.destination.droppableId;
    const newPosition = result.destination.index;

    // Check if user can edit this task
    const task = Object.values(tasksByStatus)
      .flat()
      .find(task => task.id === taskId);
    
    if (!task || !canEditTask(task)) {
      return;
    }

    try {
      await moveTask(taskId, newStatus, newPosition);
    } catch (error) {
      console.error('Failed to move task:', error);
      // Could show error notification here
    }
  };

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="kanban-board">
        {columns.map(column => (
          <div key={column.id} className="kanban-column">
            <div className="column-header" style={{ borderTopColor: column.color }}>
              <div className="column-title">
                <div 
                  className="status-indicator"
                  style={{ backgroundColor: column.color }}
                />
                <h3>{column.title}</h3>
                <span className="task-count">
                  {tasksByStatus[column.id]?.length || 0}
                </span>
              </div>
              <button 
                className="add-task-column-btn"
                onClick={() => onAddTask(column.id)}
                title={`Add task to ${column.title}`}
              >
                <Plus size={16} />
              </button>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div 
                  className={`column-content ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {tasksByStatus[column.id]?.map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id.toString()}
                      index={index}
                      isDragDisabled={!canEditTask(task)}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            opacity: snapshot.isDragging ? 0.8 : 1,
                          }}
                        >
                          <TaskCard
                            task={task}
                            onClick={() => onTaskClick(task)}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  
                  {/* Empty state for columns */}
                  {tasksByStatus[column.id]?.length === 0 && (
                    <div className="empty-column">
                      <div className="empty-icon">📋</div>
                      <p>No tasks yet</p>
                      <button 
                        className="add-first-task-btn"
                        onClick={() => onAddTask(column.id)}
                      >
                        <Plus size={16} />
                        Add first task
                      </button>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default KanbanBoard;
