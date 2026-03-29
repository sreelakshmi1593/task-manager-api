import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../services/api";
import "./Tasks.css";

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers({ page, limit: 10 });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch { showToast("Failed to load users", "error"); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = async (id) => {
    try {
      await adminApi.toggleUser(id);
      showToast("User status updated");
      fetchUsers();
    } catch (e) { showToast(e.response?.data?.message || "Failed", "error"); }
  };

  const handleRole = async (id, currentRole) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!window.confirm(`Change role to ${newRole}?`)) return;
    try {
      await adminApi.changeRole(id, newRole);
      showToast("Role updated");
      fetchUsers();
    } catch { showToast("Failed to update role", "error"); }
  };

  return (
    <div className="tasks-page fade-in">
      {toast && <div className={`toast toast-${toast.type}`}>{toast.message}</div>}

      <div className="page-header" style={{marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:"var(--font-display)",fontSize:28,fontWeight:700,letterSpacing:"-0.5px"}}>User Management</h1>
          <p style={{color:"var(--text-muted)",fontSize:14,marginTop:4}}>{pagination.total ?? 0} registered users</p>
        </div>
      </div>

      {loading ? (
        <div style={{display:"flex",justifyContent:"center",padding:48}}><div className="spinner" style={{width:32,height:32}} /></div>
      ) : (
        <div className="tasks-table-wrap">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:32,height:32,borderRadius:"50%",background:"var(--accent)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0}}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span className="task-title">{u.name}</span>
                    </div>
                  </td>
                  <td className="text-muted-sm">{u.email}</td>
                  <td>
                    <span className="status-badge" style={{
                      color: u.role === "admin" ? "var(--warning)" : "var(--accent)",
                      background: u.role === "admin" ? "var(--warning-dim)" : "var(--accent-dim)",
                      borderColor: u.role === "admin" ? "rgba(245,158,11,0.3)" : "rgba(108,99,255,0.3)",
                    }}>{u.role}</span>
                  </td>
                  <td>
                    <span className="status-badge" style={{
                      color: u.is_active ? "var(--success)" : "var(--danger)",
                      background: u.is_active ? "var(--success-dim)" : "var(--danger-dim)",
                      borderColor: u.is_active ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                    }}>{u.is_active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="text-muted-sm">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-ghost btn-sm" onClick={() => handleRole(u.id, u.role)}>
                        → {u.role === "admin" ? "User" : "Admin"}
                      </button>
                      <button className={`btn-sm ${u.is_active ? "btn-danger" : "btn-ghost"}`} onClick={() => handleToggle(u.id)}>
                        {u.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="page-info">Page {page} of {pagination.totalPages}</span>
          <button className="btn-ghost btn-sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
