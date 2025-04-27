// admin.js

// ─── Point at YOUR new Render service here ───────────────────────────────────
const BACKEND_URL = 'https://student-hostel-backend-bd96.onrender.com';

/** ── Admin Auth Link ──────────────────────────────────────────────────────── */
function setupAdminAuthLink() {
  const link = document.getElementById('admin-auth-link');
  if (!link) {
    console.error('Admin auth link (#admin-auth-link) missing');
    return;
  }
  const token = localStorage.getItem('adminToken');
  if (token) {
    link.textContent = 'Logout';
    link.href = '#';
    link.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('adminToken');
      window.location.href = 'admin-login.html';
    };
  } else {
    link.textContent = 'Login';
    link.href = 'admin-login.html';
    link.onclick = null;
  }
}

/** ── Fetch Wrapper ─────────────────────────────────────────────────────────── */
async function fetchWithErrorHandling(url, opts = {}) {
  const token = localStorage.getItem('adminToken');
  opts.headers = {
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.body  ? { 'Content-Type': 'application/json' } : {}),
  };
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    alert('Failed to load or save data. Check your network or login status.');
    return null;
  }
}

/** ── Modal Helpers ─────────────────────────────────────────────────────────── */
function openModal(id)  { document.getElementById(id)?.style.display = 'flex'; }
function closeModal(id) { document.getElementById(id)?.style.display = 'none'; }

/** ── HOSTELS CRU(D) ────────────────────────────────────────────────────────── */
async function loadHostelsAdmin() {
  const hostels = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels`);
  if (!hostels) return;
  const tbody = document.getElementById('hostels-table-body');
  if (!tbody) return console.error('Missing #hostels-table-body');
  tbody.innerHTML = '';
  hostels.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${h.id}</td>
      <td>${h.name}</td>
      <td>${h.description}</td>
      <td>${h.occupancy_limit}</td>
      <td><a href="${h.photo_url}" target="_blank" rel="noopener">View</a></td>
      <td>
        <button class="edit-hostel"   data-id="${h.id}">Edit</button>
        <button class="delete-hostel" data-id="${h.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.edit-hostel').forEach(btn =>
    btn.addEventListener('click', () => openHostelForm(btn.dataset.id))
  );
  document.querySelectorAll('.delete-hostel').forEach(btn =>
    btn.addEventListener('click', () => deleteHostel(btn.dataset.id))
  );
}

async function openHostelForm(id = '') {
  ['hostel-id','hostel-name','hostel-description','hostel-occupancy','hostel-photo']
    .forEach(fid => document.getElementById(fid).value = '');
  if (id) {
    const h = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels/${id}`);
    if (!h) return;
    document.getElementById('hostel-id').value          = h.id;
    document.getElementById('hostel-name').value        = h.name;
    document.getElementById('hostel-description').value = h.description;
    document.getElementById('hostel-occupancy').value   = h.occupancy_limit;
    document.getElementById('host
