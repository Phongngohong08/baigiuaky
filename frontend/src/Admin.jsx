import { useState, useEffect, useCallback } from 'react';

// Hidden admin dashboard. Reachable ONLY by typing the /admin URL — there is no
// navigation button/link to it anywhere in the public UI. The passcode entered at
// login is sent as the X-Admin-Key header on every admin API request.
const ADMIN_PASSCODE = 'admin@123';

const EMPTY_COURSE = {
  id: null, title: '', description: '', instructor: '', price: 0, category: '', image_url: '',
};

export default function Admin() {
  const [secret, setSecret] = useState('');        // admin key used for API calls
  const [passInput, setPassInput] = useState('');
  const [authError, setAuthError] = useState('');

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [modal, setModal] = useState(null);        // { isNew, form } | null
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const adminFetch = useCallback((url, opts = {}) => {
    return fetch(url, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'X-Admin-Key': secret, ...(opts.headers || {}) },
    });
  }, [secret]);

  const loadStats = useCallback(async () => {
    if (!secret) return;
    setLoading(true);
    setError('');
    try {
      const res = await adminFetch('/api/admin/stats');
      if (res.status === 401) throw new Error('Sai mã quản trị (API từ chối).');
      if (!res.ok) throw new Error('Không tải được số liệu (HTTP ' + res.status + ')');
      setStats(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [secret, adminFetch]);

  useEffect(() => { if (secret) loadStats(); }, [secret, loadStats]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passInput === ADMIN_PASSCODE) {
      setSecret(passInput);
      setAuthError('');
    } else {
      setAuthError('Mã quản trị không đúng');
    }
  };

  // ----- Course CRUD -----
  const openAdd = () => { setFormError(''); setModal({ isNew: true, form: { ...EMPTY_COURSE } }); };
  const openEdit = (c) => {
    setFormError('');
    setModal({ isNew: false, form: {
      id: c.id, title: c.title || '', description: c.description || '', instructor: c.instructor || '',
      price: c.price || 0, category: c.category || '', image_url: c.image_url || '',
    } });
  };
  const setField = (k, v) => setModal((m) => ({ ...m, form: { ...m.form, [k]: v } }));

  const saveCourse = async () => {
    const f = modal.form;
    if (!f.title.trim() || !f.category.trim()) { setFormError('Tiêu đề và danh mục là bắt buộc.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        title: f.title, description: f.description, instructor: f.instructor,
        price: parseFloat(f.price) || 0, category: f.category, image_url: f.image_url,
      };
      const url = modal.isNew ? '/api/admin/courses' : `/api/admin/courses/${f.id}`;
      const method = modal.isNew ? 'POST' : 'PUT';
      const res = await adminFetch(url, { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error((await res.text()) || 'Lưu thất bại');
      setModal(null);
      await loadStats();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeCourse = async (c) => {
    if (!window.confirm(`Xóa khóa học "${c.title}"?\nMọi đánh giá, đăng ký, yêu thích liên quan cũng bị xóa.`)) return;
    try {
      const res = await adminFetch(`/api/admin/courses/${c.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.text()) || 'Xóa thất bại');
      await loadStats();
    } catch (err) { window.alert(err.message); }
  };

  const removeReview = async (rv) => {
    if (!window.confirm(`Xóa đánh giá của ${rv.user_email}?`)) return;
    try {
      const res = await adminFetch(`/api/admin/reviews/${rv.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.text()) || 'Xóa thất bại');
      await loadStats();
    } catch (err) { window.alert(err.message); }
  };

  const removeRegistration = async (rg) => {
    if (!window.confirm(`Xóa đăng ký của ${rg.user_email} (${rg.course})?`)) return;
    try {
      const res = await adminFetch(`/api/admin/registrations/${rg.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.text()) || 'Xóa thất bại');
      await loadStats();
    } catch (err) { window.alert(err.message); }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset toàn bộ database về dữ liệu mẫu?')) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Reset thất bại');
      await loadStats();
      window.alert('Đã reset database.');
    } catch (err) { window.alert(err.message); }
  };

  // ----- Login screen -----
  if (!secret) {
    return (
      <div style={{ ...pageWrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ ...card, width: 360, maxWidth: '100%' }}>
          <h2 style={{ marginTop: 0 }}>🔒 Khu vực Quản trị</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Trang dành riêng cho quản trị viên. Vui lòng nhập mã quản trị để tiếp tục.
          </p>
          <input
            type="password" value={passInput} onChange={(e) => setPassInput(e.target.value)}
            placeholder="Mã quản trị" autoFocus style={inputStyle}
          />
          {authError && <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{authError}</div>}
          <button type="submit" style={btnPrimary}>Đăng nhập</button>
        </form>
      </div>
    );
  }

  const t = stats?.totals;

  return (
    <div style={pageWrap}>
      <div style={{ maxWidth: 1150, margin: '0 auto' }}>
        <div style={headerRow}>
          <h1 style={{ margin: 0 }}>📊 Bảng điều khiển Quản trị</h1>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button onClick={loadStats} style={btnSecondary}>↻ Làm mới</button>
            <button onClick={handleReset} style={btnDanger}>Reset Database</button>
            <a href="/" style={{ ...btnSecondary, textDecoration: 'none' }}>← Về trang chủ</a>
          </div>
        </div>

        {loading && <p style={{ color: 'var(--text-secondary)' }}>Đang tải số liệu…</p>}
        {error && <p style={{ color: 'var(--error-color)' }}>{error}</p>}

        {t && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', margin: '1.5rem 0' }}>
              <StatCard label="Tổng khóa học" value={t.courses} />
              <StatCard label="Lượt đăng ký" value={t.registrations} />
              <StatCard label="Đăng ký hoàn tất" value={t.completed_registrations} accent="var(--success-color)" />
              <StatCard label="Đánh giá" value={t.reviews} />
              <StatCard label="Yêu thích" value={t.wishlist} />
              <StatCard label="Doanh thu ($)" value={Number(t.revenue).toFixed(2)} accent="var(--accent-light)" />
            </div>

            {/* ---- Courses ---- */}
            <div style={sectionHead}>
              <h2 style={{ margin: 0 }}>Quản lý khóa học</h2>
              <button onClick={openAdd} style={btnPrimary}>+ Thêm khóa học</button>
            </div>
            <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['ID', 'Tiêu đề', 'Danh mục', 'Giá', 'Điểm TB', 'Đánh giá', 'Lượt ĐK', 'Hoàn tất', 'Thao tác'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {stats.courses.map((c) => (
                    <tr key={c.id}>
                      <td style={tdStyle}>{c.id}</td>
                      <td style={tdStyle}>{c.title}</td>
                      <td style={tdStyle}>{c.category}</td>
                      <td style={tdStyle}>{c.price === 0 ? 'Miễn phí' : '$' + Number(c.price).toFixed(2)}</td>
                      <td style={tdStyle}>{Number(c.rating).toFixed(1)}</td>
                      <td style={tdStyle}>{c.reviews_count}</td>
                      <td style={tdStyle}>{c.registrations}</td>
                      <td style={tdStyle}>{c.completed}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <button onClick={() => openEdit(c)} style={btnMiniSecondary}>Sửa</button>
                        <button onClick={() => removeCourse(c)} style={btnMiniDanger}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---- Reviews ---- */}
            <h2 style={{ margin: '2rem 0 0.75rem' }}>Kiểm duyệt đánh giá</h2>
            <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['ID', 'Học viên', 'Khóa học', 'Sao', 'Bình luận', 'Thao tác'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {stats.reviews.length === 0 && <tr><td style={tdStyle} colSpan={6}>Chưa có đánh giá nào.</td></tr>}
                  {stats.reviews.map((rv) => (
                    <tr key={rv.id}>
                      <td style={tdStyle}>{rv.id}</td>
                      <td style={tdStyle}>{rv.user_email}</td>
                      <td style={tdStyle}>{rv.course}</td>
                      <td style={tdStyle}>{'★'.repeat(rv.rating)}</td>
                      <td style={tdStyle}>{rv.comment}</td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <button onClick={() => removeReview(rv)} style={btnMiniDanger}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ---- Registrations ---- */}
            <h2 style={{ margin: '2rem 0 0.75rem' }}>Quản lý đăng ký</h2>
            <div style={{ ...card, padding: 0, overflowX: 'auto' }}>
              <table style={tableStyle}>
                <thead>
                  <tr>{['ID', 'Học viên', 'Khóa học', 'Trạng thái', 'Thao tác'].map((h) => <th key={h} style={thStyle}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {stats.registrations.length === 0 && <tr><td style={tdStyle} colSpan={5}>Chưa có đăng ký nào.</td></tr>}
                  {stats.registrations.map((rg) => (
                    <tr key={rg.id}>
                      <td style={tdStyle}>{rg.id}</td>
                      <td style={tdStyle}>{rg.user_email}</td>
                      <td style={tdStyle}>{rg.course}</td>
                      <td style={tdStyle}><span style={statusBadge(rg.status)}>{rg.status}</span></td>
                      <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                        <button onClick={() => removeRegistration(rg)} style={btnMiniDanger}>Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ---- Course add/edit modal ---- */}
      {modal && (
        <div style={overlay} onClick={() => !saving && setModal(null)}>
          <div style={{ ...card, width: 520, maxWidth: '94%', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{modal.isNew ? 'Thêm khóa học' : `Sửa khóa học #${modal.form.id}`}</h2>
            <Field label="Tiêu đề *"><input style={inputStyle} value={modal.form.title} onChange={(e) => setField('title', e.target.value)} /></Field>
            <Field label="Danh mục *">
              <input style={inputStyle} list="admin-categories" value={modal.form.category} onChange={(e) => setField('category', e.target.value)} placeholder="Go, Frontend, DevOps…" />
              <datalist id="admin-categories"><option value="Go" /><option value="Frontend" /><option value="DevOps" /></datalist>
            </Field>
            <Field label="Giảng viên"><input style={inputStyle} value={modal.form.instructor} onChange={(e) => setField('instructor', e.target.value)} /></Field>
            <Field label="Giá ($, 0 = miễn phí)"><input type="number" min="0" step="0.01" style={inputStyle} value={modal.form.price} onChange={(e) => setField('price', e.target.value)} /></Field>
            <Field label="Ảnh (image_url)"><input style={inputStyle} value={modal.form.image_url} onChange={(e) => setField('image_url', e.target.value)} placeholder="/images/go.svg" /></Field>
            <Field label="Mô tả"><textarea style={{ ...inputStyle, height: 90, resize: 'vertical' }} value={modal.form.description} onChange={(e) => setField('description', e.target.value)} /></Field>
            {formError && <div style={{ color: 'var(--error-color)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{formError}</div>}
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setModal(null)} style={btnSecondary} disabled={saving}>Hủy</button>
              <button onClick={saveCourse} style={btnPrimary} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div style={{ ...card, minWidth: 160, flex: '1 1 160px' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{label}</div>
      <div style={{ fontSize: '1.8rem', fontWeight: 700, color: accent || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: '0.85rem' }}>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '0.3rem' }}>{label}</div>
      {children}
    </label>
  );
}

const pageWrap = { minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', padding: '2rem' };
const card = { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem' };
const headerRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' };
const sectionHead = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2rem 0 0.75rem', flexWrap: 'wrap', gap: '0.75rem' };
const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 50 };
const tableStyle = { width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' };
const thStyle = { textAlign: 'left', padding: '0.75rem 1rem', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', whiteSpace: 'nowrap', fontWeight: 600 };
const tdStyle = { padding: '0.7rem 1rem', borderBottom: '1px solid var(--border-color)' };
const inputStyle = { width: '100%', padding: '0.65rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '0.9rem' };
const btnPrimary = { padding: '0.55rem 1.1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 600, cursor: 'pointer' };
const btnSecondary = { padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 500, display: 'inline-flex', alignItems: 'center' };
const btnDanger = { padding: '0.55rem 1rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--error-color)', color: '#fff', cursor: 'pointer', fontWeight: 600 };
const btnMiniSecondary = { padding: '0.3rem 0.7rem', marginRight: '0.4rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.82rem' };
const btnMiniDanger = { padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-sm)', border: 'none', background: 'var(--error-color)', color: '#fff', cursor: 'pointer', fontSize: '0.82rem' };
function statusBadge(status) {
  const colors = { completed: 'var(--success-color)', pending: '#f59e0b', cancelled: 'var(--text-muted)' };
  return { padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.78rem', background: 'rgba(255,255,255,0.06)', color: colors[status] || 'var(--text-secondary)', border: '1px solid var(--border-color)' };
}
