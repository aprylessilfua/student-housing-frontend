// admin.js

// ─── Point at Your Render Backend Here ───────────────────────────────────────
const BACKEND_URL = 'https://student-hostel-backend-bd96.onrender.com';

/** ── Admin Auth Link ──────────────────────────────────────────────────────── */
function setupAdminAuthLink() {
  const link = document.getElementById('admin-auth-link');
  if (!link) return console.error('No #admin-auth-link');
  const token = localStorage.getItem('adminToken');
  if (token) {
    link.textContent = 'Logout';
    link.href = '#';
    link.onclick = e => {
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
    ...(opts.body ? { 'Content-Type': 'application/json' } : {})
  };
  try {
    const res = await fetch(url, opts);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Fetch ${url} failed:`, err);
    alert('Failed to load or save data. Check your network or login status.');
    return null;
  }
}

/** ── Modal Helpers ─────────────────────────────────────────────────────────── */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return console.error(`Modal "${id}" not found`);
  // show
  modal.style.display = 'flex';
  // outside‐click to close (only once)
  if (!modal.hasAttribute('data-modal-listener')) {
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal(id);
    });
    modal.setAttribute('data-modal-listener', 'true');
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return console.error(`Modal "${id}" not found`);
  modal.style.display = 'none';
}

// ESC key closes any open modal
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal').forEach(m => {
      if (m.style.display === 'flex') m.style.display = 'none';
    });
  }
});

// ─── HOSTELS ──────────────────────────────────────────────────────────────────
async function loadHostelsAdmin() {
  const hostels = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels`);
  if (!hostels) return;
  const tbody = document.getElementById('hostels-table-body');
  if (!tbody) return console.error('No #hostels-table-body');
  tbody.innerHTML = '';
  hostels.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${h.id}</td>
      <td>${h.name}</td>
      <td>${h.description}</td>
      <td>${h.occupancy_limit}</td>
      <td><a href="${h.photo_url}" target="_blank">View</a></td>
      <td>
        <button class="edit-hostel"   data-id="${h.id}">Edit</button>
        <button class="delete-hostel" data-id="${h.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.edit-hostel').forEach(b =>
    b.addEventListener('click', () => openHostelForm(b.dataset.id))
  );
  document.querySelectorAll('.delete-hostel').forEach(b =>
    b.addEventListener('click', () => deleteHostel(b.dataset.id))
  );
}

async function openHostelForm(id = '') {
  ['hostel-id','hostel-name','hostel-description','hostel-occupancy','hostel-photo']
    .forEach(f => { const e = document.getElementById(f); if (e) e.value = ''; });
  if (id) {
    const h = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels/${id}`);
    if (!h) return;
    document.getElementById('hostel-id').value          = h.id;
    document.getElementById('hostel-name').value        = h.name;
    document.getElementById('hostel-description').value = h.description;
    document.getElementById('hostel-occupancy').value   = h.occupancy_limit;
    document.getElementById('hostel-photo').value       = h.photo_url;
  }
  openModal('hostel-form-modal');
}

async function saveHostel(e) {
  e.preventDefault();
  const id = document.getElementById('hostel-id').value;
  const payload = {
    name:            document.getElementById('hostel-name').value.trim(),
    description:     document.getElementById('hostel-description').value.trim(),
    occupancy_limit: Number(document.getElementById('hostel-occupancy').value),
    photo_url:       document.getElementById('hostel-photo').value.trim()
  };
  const url    = id ? `${BACKEND_URL}/api/hostels/${id}` : `${BACKEND_URL}/api/hostels`;
  const method = id ? 'PUT' : 'POST';
  const res    = await fetchWithErrorHandling(url, { method, body: JSON.stringify(payload) });
  if (res) {
    closeModal('hostel-form-modal');
    loadHostelsAdmin();
  }
}

async function deleteHostel(id) {
  if (!confirm('Delete this hostel?')) return;
  const res = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels/${id}`, { method: 'DELETE' });
  if (res) loadHostelsAdmin();
}

// ─── ROOMS ─────────────────────────────────────────────────────────────────────
async function loadRoomsAdmin() {
  const rooms = await fetchWithErrorHandling(`${BACKEND_URL}/api/rooms`);
  if (!rooms) return;
  const tbody = document.getElementById('rooms-table-body');
  if (!tbody) return console.error('No #rooms-table-body');
  tbody.innerHTML = '';
  rooms.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.name}</td>
      <td>${r.description}</td>
      <td>${r.price}</td>
      <td>${r.occupancy_limit}</td>
      <td>${r.hostel_id}</td>
      <td><a href="${r.photo_url}" target="_blank">View</a></td>
      <td>
        <button class="edit-room"   data-id="${r.id}">Edit</button>
        <button class="delete-room" data-id="${r.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.edit-room').forEach(b =>
    b.addEventListener('click', () => openRoomForm(b.dataset.id))
  );
  document.querySelectorAll('.delete-room').forEach(b =>
    b.addEventListener('click', () => deleteRoom(b.dataset.id))
  );
}

async function openRoomForm(id = '') {
  ['room-id','room-name','room-description','room-price','room-occupancy','room-hostel-id','room-photo']
    .forEach(f => { const e = document.getElementById(f); if (e) e.value = ''; });
  if (id) {
    const r = await fetchWithErrorHandling(`${BACKEND_URL}/api/rooms/${id}`);
    if (!r) return;
    document.getElementById('room-id').value         = r.id;
    document.getElementById('room-name').value       = r.name;
    document.getElementById('room-description').value= r.description;
    document.getElementById('room-price').value      = r.price;
    document.getElementById('room-occupancy').value  = r.occupancy_limit;
    document.getElementById('room-hostel-id').value  = r.hostel_id;
    document.getElementById('room-photo').value      = r.photo_url;
  }
  openModal('room-form-modal');
}

async function saveRoom(e) {
  e.preventDefault();
  const id = document.getElementById('room-id').value;
  const payload = {
    name:            document.getElementById('room-name').value.trim(),
    description:     document.getElementById('room-description').value.trim(),
    price:           Number(document.getElementById('room-price').value),
    occupancy_limit: Number(document.getElementById('room-occupancy').value),
    hostel_id:       Number(document.getElementById('room-hostel-id').value),
    photo_url:       document.getElementById('room-photo').value.trim()
  };
  const url    = id ? `${BACKEND_URL}/api/rooms/${id}` : `${BACKEND_URL}/api/rooms`;
  const method = id ? 'PUT' : 'POST';
  const res    = await fetchWithErrorHandling(url, { method, body: JSON.stringify(payload) });
  if (res) {
    closeModal('room-form-modal');
    loadRoomsAdmin();
  }
}

async function deleteRoom(id) {
  if (!confirm('Delete this room?')) return;
  const res = await fetchWithErrorHandling(`${BACKEND_URL}/api/rooms/${id}`, { method:'DELETE' });
  if (res) loadRoomsAdmin();
}

// ─── STUDENTS ─────────────────────────────────────────────────────────────────
async function loadStudentsAdmin() {
  const users = await fetchWithErrorHandling(`${BACKEND_URL}/api/users`);
  if (!users) return;
  const tbody = document.getElementById('students-table-body');
  if (!tbody) return console.error('No #students-table-body');
  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.username}</td>
      <td>${u.email}</td>
      <td>${u.phone}</td>
      <td><button class="delete-student" data-id="${u.id}">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.delete-student').forEach(b =>
    b.addEventListener('click', () => deleteStudent(b.dataset.id))
  );
}

async function deleteStudent(id) {
  if (!confirm('Delete this student?')) return;
  const res = await fetchWithErrorHandling(`${BACKEND_URL}/api/users/${id}`, { method:'DELETE' });
  if (res) loadStudentsAdmin();
}

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
async function loadApplicationsAdmin() {
  const apps = await fetchWithErrorHandling(`${BACKEND_URL}/api/applications`);
  if (!apps) return;
  const tbody = document.getElementById('applications-table-body');
  if (!tbody) return console.error('No #applications-table-body');
  tbody.innerHTML = '';
  apps.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${a.id}</td>
      <td>${a.user_id}</td>
      <td>${a.room_id}</td>
      <td>${a.status}</td>
      <td>${new Date(a.applied_at).toLocaleString()}</td>
      <td>
        <button class="approve-app" data-id="${a.id}">Approve</button>
        <button class="reject-app"  data-id="${a.id}">Reject</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.approve-app').forEach(b =>
    b.addEventListener('click', () => updateApplication(b.dataset.id, 'Accepted'))
  );
  document.querySelectorAll('.reject-app').forEach(b =>
    b.addEventListener('click', () => updateApplication(b.dataset.id, 'Rejected'))
  );
}

async function updateApplication(id, status) {
  const res = await fetchWithErrorHandling(`${BACKEND_URL}/api/applications/${id}`, {
    method:'PUT', body: JSON.stringify({ status })
  });
  if (res) loadApplicationsAdmin();
}

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
async function loadNotificationsAdmin() {
  const notifs = await fetchWithErrorHandling(`${BACKEND_URL}/api/notifications`);
  if (!notifs) return;
  const tbody = document.getElementById('notifications-table-body');
  if (!tbody) return console.error('No #notifications-table-body');
  tbody.innerHTML = '';
  notifs.forEach(n => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${n.id}</td>
      <td>${n.user_id}</td>
      <td>${n.user_role}</td>
      <td>${n.message}</td>
      <td>${n.type}</td>
      <td>${n.is_read ? 'Yes' : 'No'}</td>
      <td><button class="read-notif" data-id="${n.id}">Mark Read</button></td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.read-notif').forEach(b =>
    b.addEventListener('click', () => {
      fetchWithErrorHandling(`${BACKEND_URL}/api/notifications/${b.dataset.id}/read`, { method:'PUT' })
        .then(ok => { if (ok) loadNotificationsAdmin(); });
    })
  );
}

async function sendNotification(e) {
  e.preventDefault();
  const payload = {
    user_id:    +document.getElementById('notif-user-id').value,
    user_role:  document.getElementById('notif-user-role').value,
    type:       document.getElementById('notif-type').value,
    message:    document.getElementById('notif-message').value,
    is_read:    false,
    created_at: new Date().toISOString()
  };
  const res = await fetchWithErrorHandling(`${BACKEND_URL}/api/notifications`, {
    method:'POST', body: JSON.stringify(payload)
  });
  if (res) loadNotificationsAdmin();
}

// ─── INITIALIZE ─────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setupAdminAuthLink();
  const page = location.pathname.split('/').pop().toLowerCase();

  if (page.includes('hostels'))   loadHostelsAdmin();
  if (page.includes('rooms'))     loadRoomsAdmin();
  if (page.includes('students'))  loadStudentsAdmin();
  if (page.includes('applications')) loadApplicationsAdmin();
  if (page.includes('notifications')) {
    loadNotificationsAdmin();
    document.getElementById('notification-form')
      ?.addEventListener('submit', sendNotification);
  }

  if (page.includes('hostels')) {
    document.getElementById('create-hostel-button')
      ?.addEventListener('click', () => openHostelForm());
    document.getElementById('hostel-form')
      ?.addEventListener('submit', saveHostel);
    document.getElementById('hostel-form-cancel')
      ?.addEventListener('click', e => { e.preventDefault(); closeModal('hostel-form-modal'); });
  }

  if (page.includes('rooms')) {
    document.getElementById('create-room-button')
      ?.addEventListener('click', () => openRoomForm());
    document.getElementById('room-form')
      ?.addEventListener('submit', saveRoom);
    document.getElementById('room-form-cancel')
      ?.addEventListener('click', e => { e.preventDefault(); closeModal('room-form-modal'); });
  }
});
