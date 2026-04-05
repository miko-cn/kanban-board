import { useState, useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { isAuthenticated, removeToken } from './api/client';
import './App.css';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  getColumns,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  archiveCompletedTasks,
  type Column,
  type Task,
} from './api/client';
import { Column as KanbanColumn } from './components/Column';
import { TaskCard } from './components/TaskCard';
import LoginPage from './pages/Login';

// 私有路由包装器
function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function KanbanBoard() {
  const navigate = useNavigate();
  const dragStartColumnRef = useRef<string | null>(null); // 记录拖拽开始时的列 ID
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('kanban-theme');
    return (saved as 'light' | 'dark') || 'light';
  });
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Drag state
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState({ title: '', description: '' });

  // Dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('kanban-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleLogout = () => {
    removeToken();
    navigate('/login');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [columnsData, tasksData] = await Promise.all([
          getColumns(),
          getTasks()
        ]);
        setColumns(columnsData);
        setTasks(tasksData);
        setError(null);
      } catch (err) {
        setError('Failed to fetch data from API');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getTasksByColumn = (columnId: string) => {
    return tasks.filter(task => task.columnId === columnId).sort((a, b) => a.order - b.order);
  };

  // Drag handlers
  // 拖拽开始
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedTask = tasks.find(t => t.id === active.id);
    if (draggedTask) {
      setActiveTask(draggedTask);
      dragStartColumnRef.current = draggedTask.columnId; // 保存原始列 ID
    }
  };

  // 拖拽中 - 只更新列ID用于预览，不处理排序
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // 确定目标列
    const isOverColumn = columns.some(c => c.id === overId);
    let overColumnId: string | null = null;
    
    if (isOverColumn) {
      overColumnId = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) overColumnId = overTask.columnId;
    }

    if (!overColumnId) return;

    // 只在列变化时更新预览
    if (activeTask.columnId !== overColumnId) {
      setTasks(prev => prev.map(t => 
        t.id === activeId ? { ...t, columnId: overColumnId! } : t
      ));
    }
  };

  // 拖拽结束 - 统一在这里处理所有状态更新
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // 找到 active task
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // 确定目标列 ID
    const isOverColumn = columns.some(c => c.id === overId);
    let targetColumnId: string;
    
    if (isOverColumn) {
      targetColumnId = overId;
    } else {
      const overTask = tasks.find(t => t.id === overId);
      if (!overTask) return;
      targetColumnId = overTask.columnId;
    }

    // 不管位置是否相同，只要列不同就更新
    // 用 ref 判断是否跨列（而不是当前 state）
    const originalColumnId = dragStartColumnRef.current;
    // console.log originalColumnId:', originalColumnId, 'targetColumnId:', targetColumnId);
    if (originalColumnId !== targetColumnId) {
      // console.log Move to column:', targetColumnId);
      
      // 获取目标列的任务
      let targetColumnTasks = tasks
        .filter(t => t.columnId === targetColumnId)
        .sort((a, b) => a.order - b.order);
      
      // 找到插入位置
      let insertIndex = targetColumnTasks.length;
      const isOverColumn = columns.some(c => c.id === overId);
      if (!isOverColumn) {
        const overIdx = targetColumnTasks.findIndex(t => t.id === overId);
        if (overIdx !== -1) insertIndex = overIdx;
      }
      
      // console.log Insert at index:', insertIndex);
      
      // 移除被拖拽的任务（如果已经在目标列）
      targetColumnTasks = targetColumnTasks.filter(t => t.id !== activeId);
      
      // 插入到新位置
      const activeTaskData = { ...activeTask, columnId: targetColumnId };
      targetColumnTasks.splice(insertIndex, 0, activeTaskData);
      
      // 重新分配 order：0, 1, 2...
      const updates = targetColumnTasks.map((t, idx) => ({
        id: t.id,
        order: idx
      }));
      
      // console.log Updates:', updates);
      
      // 前端更新
      setTasks(prev => {
        const updated = [...prev];
        updates.forEach(u => {
          const idx = updated.findIndex(t => t.id === u.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], order: u.order, columnId: targetColumnId };
          }
        });
        return updated;
      });

      // 后端持久化
      try {
        await Promise.all(updates.map(u => 
          updateTask(u.id, { columnId: targetColumnId, order: u.order })
        ));
        // console.log API success');
      } catch (err) {
        console.error('[DragEnd] API failed:', err);
      }
      return;
    }

    // 同列排序 - 检查位置是否变化
    const columnTasks = tasks
      .filter(t => t.columnId === targetColumnId)
      .sort((a, b) => a.order - b.order);
    
    const activeIndex = columnTasks.findIndex(t => t.id === activeId);
    const targetIndex = columnTasks.findIndex(t => t.id === overId);

    if (activeIndex === targetIndex) {
      // console.log Same position, skip');
      return;
    }

    // 重新排序
    const newColumnTasks = [...columnTasks];
    newColumnTasks.splice(activeIndex, 1);
    newColumnTasks.splice(targetIndex, 0, activeTask);

    // 更新 order
    const updates = newColumnTasks.map((t, idx) => ({
      id: t.id,
      order: idx
    }));

    // 前端更新
    setTasks(prev => {
      const updated = [...prev];
      updates.forEach(u => {
        const idx = updated.findIndex(t => t.id === u.id);
        if (idx !== -1) {
          updated[idx] = { ...updated[idx], order: u.order };
        }
      });
      return updated;
    });

    // 后端持久化
    try {
      await Promise.all(updates.map(u => 
        updateTask(u.id, { order: u.order })
      ));
      // console.log Reorder API success');
    } catch (err) {
      console.error('[DragEnd] Reorder API failed:', err);
    }
  };

  // Task modal handlers
  const handleAddTask = (columnId: string) => {
    setSelectedColumnId(columnId);
    setModalMode('add');
    setTaskForm({ title: '', description: '' });
    setEditingTask(null);
    setModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setModalMode('edit');
    setEditingTask(task);
    setTaskForm({ title: task.title, description: task.description });
    setModalOpen(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!taskForm.title.trim()) return;

    try {
      if (modalMode === 'add') {
        const newTask = await createTask({
          columnId: selectedColumnId,
          title: taskForm.title,
          description: taskForm.description,
        });
        setTasks(prev => [...prev, newTask]);
      } else if (editingTask) {
        const updatedTask = await updateTask(editingTask.id, {
          title: taskForm.title,
          description: taskForm.description,
        });
        setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t));
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">
          <svg className="openclaw-logo" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" width="32" height="32">
            <defs>
              <linearGradient id="lobster-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff4d4d"/>
                <stop offset="100%" stopColor="#991b1b"/>
              </linearGradient>
            </defs>
            <path d="M60 10 C30 10 15 35 15 55 C15 75 30 95 45 100 L45 110 L55 110 L55 100 C55 100 60 102 65 100 L65 110 L75 110 L75 100 C90 95 105 75 105 55 C105 35 90 10 60 10Z" fill="url(#lobster-gradient)"/>
            <path d="M20 45 C5 40 0 50 5 60 C10 70 20 65 25 55 C28 48 25 45 20 45Z" fill="url(#lobster-gradient)"/>
            <path d="M100 45 C115 40 120 50 115 60 C110 70 100 65 95 55 C92 48 95 45 100 45Z" fill="url(#lobster-gradient)"/>
            <path d="M45 15 Q35 5 30 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
            <path d="M75 15 Q85 5 90 8" stroke="#ff4d4d" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="45" cy="35" r="6" fill="#050810"/>
            <circle cx="75" cy="35" r="6" fill="#050810"/>
            <circle cx="46" cy="34" r="2.5" fill="#00e5cc"/>
            <circle cx="76" cy="34" r="2.5" fill="#00e5cc"/>
          </svg>
          Openclaw Kanban
        </h1>
        <div className="header-actions">
          <button 
            className="archive-btn"
            onClick={async () => {
              if (confirm('Archive all completed tasks?')) {
                try {
                  const result = await archiveCompletedTasks();
                  alert(`Archived ${result.archived} tasks!`);
                  // 刷新数据
                  const [columnsData, tasksData] = await Promise.all([
                    getColumns(),
                    getTasks()
                  ]);
                  setColumns(columnsData);
                  setTasks(tasksData);
                } catch (err) {
                  alert('Failed to archive tasks');
                }
              }
            }}
            aria-label="Archive completed tasks"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"></polyline>
              <rect x="1" y="3" width="22" height="5"></rect>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
          </button>
          <button 
            className="theme-toggle" 
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
          {theme === 'light' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          )}
          </button>
          <button 
            className="logout-btn"
            onClick={handleLogout}
            aria-label="Logout"
            title="退出登录"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
    </header>

      {/* Main Content */}
      <main className="kanban-board">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : columns.length === 0 ? (
          <div className="empty-state">
            <p>No columns yet. Create one to get started!</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="columns-container">
              {columns.sort((a, b) => a.order - b.order).map(column => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  tasks={getTasksByColumn(column.id)}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                />
              ))}
            </div>
            
            <DragOverlay>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* Task Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{modalMode === 'add' ? 'Add Task' : 'Edit Task'}</h2>
            <form onSubmit={handleModalSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  id="title"
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={taskForm.description}
                  onChange={e => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description (optional)"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {modalMode === 'add' ? 'Add' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// 主 App 组件：路由配置
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route 
        path="/" 
        element={
          <PrivateRoute>
            <KanbanBoard />
          </PrivateRoute>
        } 
      />
    </Routes>
  );
}

export default App;