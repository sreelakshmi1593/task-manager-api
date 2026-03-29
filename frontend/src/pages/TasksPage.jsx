import { useEffect, useState, useCallback } from "react";
import { tasksApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Tasks.css";

const PRIORITY_COLOR = { high: "var(--danger)", medium: "var(--warning)", low: "var(--success)" };
const STATUS_COLOR = { todo: "var(--text-muted)", in_progress: "var(--accent)", done: "var(--success)" };
const EMPTY_FORM = { title: "", description: "", status: "todo", priority: "medium", due_date: "" };

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [filters, setFilters] = useState({ page: 1, status: "", priority: "", search: "" });
  const [deleteId, setDeleteId] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: filters.page, limit: 8 };
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.search) params.search = filters.search;
      const res = await tasksApi.getAll(params);
      setTasks(res.data.data);
      setPagination(res.data.pagination);
    } catch { showToast("Failed to load tasks", "error"); }
    finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = () => { setEditTask(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description || "", status: task.status, priority: task.priority, due_date: task.due_date || "" });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditTask(null); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (!payload.due_date) delete payload.due_date;
      if (editTask) {
        await tasksApi.update(editTask.id, payload);
        showToast("Task updated");
      } else {
        await tasksApi.create(payload);
        showToast("Task created");
      }
      closeModal();
      fetchTasks();
    } catch (err) {
      const errs = err.response?.data?.errors;
      showToast(errs ? errs.map(e => e.msg).join(". ") : err.response?.data?.message || "Failed to save task", "error");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await tasksApi.delete(deleteId);
      showToast("Task deleted");
      setDeleteId(null);
      fetchTasks();
    } catch { showToast("Failed to delete task", "error"); }
  };

  return (
    <div className="tasks-page fade-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header">
        <div>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:28,fontWeight:700,letterSpacing:"-0.5px"}}>
            {user.role === "admin" ? "All Tasks" : "My Tasks"}
          </h1>
          <p style={{color:"var(--text-muted)",fontSize:14,marginTop:4}}>
            {pagination.total ?? 0} total tasks
          </p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Task</button>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <input
          type="text" placeholder="Search tasks..." value={filters.search}
          onChange={e => setFilters(f => ({ ...f, search: e.target.value, page: 1 }))}
          style={{flex:1, minWidth:180}}
        />
        <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value, page: 1 }))}>
          <option value="">All status</option>
          <option value="todo">Todo</option>
          <option value="in_progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select value={filters.priority} onChange={e => setFilters(f => ({ ...f, priority: e.target.value, page: 1 }))}>
          <option value="">All priority</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Tasks Table */}
      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:48}}><div className="spinner" style={{width:32,height:32}} /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◧</div>
          <p>No tasks found.</p>
          <button className="btn-primary btn-sm" onClick={openCreate} style={{marginTop:12}}>Create first task</button>
        </div>
      ) : (
        <div className="tasks-table-wrap">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                {user.role === "admin" && <th>Owner</th>}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id}>
                  <td>
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description.substring(0,60)}{task.description.length>60?"…":""}</div>}
                  </td>
                  <td>
                    <span className="status-badge" style={{color:STATUS_COLOR[task.status],background:`${STATUS_COLOR[task.status]}18`,borderColor:`${STATUS_COLOR[task.status]}30`}}>
                      {task.status.replace("_"," ")}
                    </span>
                  </td>
                  <td>
                    <span className="priority-badge" style={{color:PRIORITY_COLOR[task.priority]}}>
                      ● {task.priority}
                    </span>
                  </td>
                  <td className="text-muted-sm">{task.due_date ? new Date(task.due_date).toLocaleDateString() : "—"}</td>
                  {user.role === "admin" && <td className="text-muted-sm">{task.user_name || "—"}</td>}
                  <td>
                    <div className="action-btns">
                      <button className="btn-ghost btn-sm" onClick={() => openEdit(task)}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => setDeleteId(task.id)}>Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn-ghost btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Prev</button>
          <span className="page-info">Page {filters.page} of {pagination.totalPages}</span>
          <button className="btn-ghost btn-sm" disabled={filters.page >= pagination.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Next →</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editTask ? "Edit Task" : "New Task"}</h2>
              <button className="modal-close" onClick={closeModal}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} required placeholder="Task title" />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Optional description" style={{resize:"vertical"}} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-ghost" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? <span className="spinner" /> : editTask ? "Update Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{maxWidth:360}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Task</h2>
              <button className="modal-close" onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <p style={{color:"var(--text-muted)",fontSize:14,padding:"0 0 20px"}}>This action cannot be undone. Are you sure?</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
