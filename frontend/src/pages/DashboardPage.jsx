import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tasksApi } from "../services/api";
import "./Dashboard.css";

const PRIORITY_COLOR = { high: "var(--danger)", medium: "var(--warning)", low: "var(--success)" };
const STATUS_COLOR = { todo: "var(--text-muted)", in_progress: "var(--accent)", done: "var(--success)" };

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const tasksRes = await tasksApi.getAll({ limit: 5 });
        setRecentTasks(tasksRes.data.data);
        if (user.role === "admin") {
          const statsRes = await tasksApi.getStats();
          setStats(statsRes.data.data);
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) return <div className="page-loading"><div className="spinner" style={{width:32,height:32}} /></div>;

  const todoCount = recentTasks.filter(t => t.status === "todo").length;
  const inProgressCount = recentTasks.filter(t => t.status === "in_progress").length;
  const doneCount = recentTasks.filter(t => t.status === "done").length;

  return (
    <div className="dashboard fade-in">
      <div className="page-header">
        <div>
          <h1>{greeting()}, {user?.name?.split(" ")[0]} 👋</h1>
          <p className="text-muted">Here's your task overview for today</p>
        </div>
        <Link to="/tasks" className="btn-primary" style={{textDecoration:"none",padding:"10px 20px",borderRadius:"8px",fontSize:"14px",fontWeight:600}}>
          + New Task
        </Link>
      </div>

      {user.role === "admin" && stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.total_users}</div>
            <div className="stat-label">Total Users</div>
          </div>
          {stats.by_status?.map(s => (
            <div className="stat-card" key={s.status}>
              <div className="stat-value" style={{color: STATUS_COLOR[s.status]}}>{s.count}</div>
              <div className="stat-label">{s.status.replace("_"," ")}</div>
            </div>
          ))}
        </div>
      )}

      <div className="section">
        <div className="section-header">
          <h2>Recent Tasks</h2>
          <Link to="/tasks" className="see-all">See all →</Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◧</div>
            <p>No tasks yet. <Link to="/tasks">Create your first task</Link></p>
          </div>
        ) : (
          <div className="task-list">
            {recentTasks.map(task => (
              <div className="task-row" key={task.id}>
                <div className="task-row-left">
                  <span className="priority-dot" style={{background: PRIORITY_COLOR[task.priority]}} />
                  <div>
                    <div className="task-row-title">{task.title}</div>
                    {task.due_date && (
                      <div className="task-row-meta">Due {new Date(task.due_date).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
                <span className="status-badge" style={{color: STATUS_COLOR[task.status], background: `${STATUS_COLOR[task.status]}18`, borderColor: `${STATUS_COLOR[task.status]}30`}}>
                  {task.status.replace("_"," ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
