// admin.js
const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// Admin Auth Link
function setupAdminAuthLink() {
  const link = document.getElementById('admin-auth-link');
  if (!link) return;
  if (localStorage.getItem('token')) {
    link.textContent = 'Logout';
    link.href = '#';
    link.onclick = () => {
      localStorage.clear();
      window.location.href = 'login.html';
    };
  } else {
    link.textContent = 'Login';
    link.href = 'login.html';
  }
}

// Modal Helpers (same as student)
function openModal(id)  { document.getElementById(id)?.style.display = 'flex'; }
function closeModal(id) { document.getElementById(id)?.style.display = 'none'; }

// Hostels
async function loadHostelsAdmin() {
  const res = await fetch(`${BACKEND_URL}/api/hostels`);
  const hostels = await res.json();
  const tbody = document.getElementById('hostels-table-body');
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
        <button class="edit-hostel" data-id="${h.id}">Edit</button>
        <button class="delete-hostel" data-id="${h.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.edit-hostel').forEach(b => b.addEventListener('click', () => openHostelForm(b.dataset.id)));
  document.querySelectorAll('.delete-hostel').forEach(b => b.addEventListener('click', () => deleteHostel(b.dataset.id)));
}

async function openHostelForm(id='') {
  // Reset
  ['hostel-id','hostel-name','hostel-description','hostel-occupancy','hostel-photo']
    .forEach(i => document.getElementById(i).value='');
  if (id) {
    const h = await (await fetch(`${BACKEND_URL}/api/hostels/${id}`)).json();
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
    name:           document.getElementById('hostel-name').value.trim(),
    description:    document.getElementById('hostel-description').value.trim(),
    occupancy_limit:Number(document.getElementById('hostel-occupancy').value),
    photo_url:      document.getElementById('hostel-photo').value.trim(),
  };
  const url    = id ? `${BACKEND_URL}/api/hostels/${id}` : `${BACKEND_URL}/api/hostels`;
  const method = id ? 'PUT' : 'POST';
  await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  closeModal('hostel-form-modal');
  loadHostelsAdmin();
}

async function deleteHostel(id) {
  if (!confirm('Delete this hostel?')) return;
  await fetch(`${BACKEND_URL}/api/hostels/${id}`, { method:'DELETE' });
  loadHostelsAdmin();
}

// Rooms
async function loadRoomsAdmin() {
  const res = await fetch(`${BACKEND_URL}/api/rooms`);
  const rooms = await res.json();
  const tbody = document.getElementById('rooms-table-body');
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
        <button class="edit-room" data-id="${r.id}">Edit</button>
        <button class="delete-room" data-id="${r.id}">Delete</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.edit-room').forEach(b => b.addEventListener('click', () => openRoomForm(b.dataset.id)));
  document.querySelectorAll('.delete-room').forEach(b => b.addEventListener('click', () => deleteRoom(b.dataset.id)));
}

async function openRoomForm(id='') {
  ['room-id','room-name','room-description','room-price','room-occupancy','room-hostel-id','room-photo']
    .forEach(i => document.getElementById(i).value='');
  if (id) {
    const rm = await (await fetch(`${BACKEND_URL}/api/rooms/${id}`)).json();
    document.getElementById('room-id').value           = rm.id;
    document.getElementById('room-name').value         = rm.name;
    document.getElementById('room-description').value  = rm.description;
    document.getElementById('room-price').value        = rm.price;
    document.getElementById('room-occupancy').value    = rm.occupancy_limit;
    document.getElementById('room-hostel-id').value    = rm.hostel_id;
    document.getElementById('room-photo').value        = rm.photo_url;
  }
  openModal('room-form-modal');
}

async function saveRoom(e) {
  e.preventDefault();
  const id = document.getElementById('room-id').value;
  const payload = {
    name:           document.getElementById('room-name').value.trim(),
    description:    document.getElementById('room-description').value.trim(),
    price:          Number(document.getElementById('room-price').value),
    occupancy_limit:Number(document.getElementById('room-occupancy').value),
    hostel_id:      Number(document.getElementById('room-hostel-id').value),
    photo_url:      document.getElementById('room-photo').value.trim(),
  };
  const url    = id ? `${BACKEND_URL}/api/rooms/${id}` : `${BACKEND_URL}/api/rooms`;
  const method = id ? 'PUT' : 'POST';
  await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
  closeModal('room-form-modal');
  loadRoomsAdmin();
}

async function deleteRoom(id) {
  if (!confirm('Delete this room?')) return;
  await fetch(`${BACKEND_URL}/api/rooms/${id}`, { method:'DELETE' });
  loadRoomsAdmin();
}

// Students
async function loadStudentsAdmin() {
  const res = await fetch(`${BACKEND_URL}/api/users`);
  const users = await res.json();
  const tbody = document.getElementById('students-table-body');
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
  document.querySelectorAll('.delete-student').forEach(b => b.addEventListener('click', () => deleteStudent(b.dataset.id)));
}

async function deleteStudent(id) {
  if (!confirm('Delete this student?')) return;
  await fetch(`${BACKEND_URL}/api/users/${id}`, { method:'DELETE' });
  loadStudentsAdmin();
}

// Applications
async function loadApplicationsAdmin() {
  const res = await fetch(`${BACKEND_URL}/api/applications`);
  const apps = await res.json();
  const tbody = document.getElementById('applications-table-body');
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
        <button class="reject-app" data-id="${a.id}">Reject</button>
      </td>`;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.approve-app').forEach(b => b.addEventListener('click', () => updateApplication(b.dataset.id, 'Accepted')));
  document.querySelectorAll('.reject-app').forEach(b => b.addEventListener('click', () => updateApplication(b.dataset.id, 'Rejected')));
}

async function updateApplication(id, status) {
  await fetch(`${BACKEND_URL}/api/applications/${id}`, {
    method:'PUT',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ status })
  });
  loadApplicationsAdmin();
}

// Notifications
async function loadNotificationsAdmin() {
  const res = await fetch(`${BACKEND_URL}/api/notifications`);
  const notifs = await res.json();
  const tbody = document.getElementById('notifications-table-body');
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
  document.querySelectorAll('.read-notif').forEach(b => b.addEventListener('click', () => markNotifRead(b.dataset.id)));
}

async function markNotifRead(id) {
  await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, { method:'PUT' });
  loadNotificationsAdmin();
}

async function sendNotification(e) {
  e.preventDefault();
  const payload = {
    user_id:   +document.getElementById('notif-user-id').value,
    user_role: document.getElementById('notif-user-role').value,
    message:   document.getElementById('notif-message').value,
    type:      document.getElementById('notif-type').value,
    is_read:   false,
    created_at:new Date().toISOString()
  };
  await fetch(`${BACKEND_URL}/api/notifications`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify(payload)
  });
  loadNotificationsAdmin();
}

// ─── PAGE INIT ───────────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setupAdminAuthLink();

  const path = location.pathname.split('/').pop().toLowerCase();
  if (path === 'admin-hostels.html') {
    loadHostelsAdmin();
    document.getElementById('create-hostel-button')?.addEventListener('click',()=>openHostelForm());
    document.getElementById('hostel-form')?.addEventListener('submit', saveHostel);
    document.getElementById('hostel-form-cancel')?.addEventListener('click', e=>{e.preventDefault();closeModal('hostel-form-modal');});
  }
  if (path === 'admin-rooms.html') {
    loadRoomsAdmin();
    document.getElementById('create-room-button')?.addEventListener('click',()=>openRoomForm());
    document.getElementById('room-form')?.addEventListener('submit', saveRoom);
    document.getElementById('room-form-cancel')?.addEventListener('click', e=>{e.preventDefault();closeModal('room-form-modal');});
  }
  if (path === 'admin-students.html')    loadStudentsAdmin();
  if (path === 'admin-applications.html')loadApplicationsAdmin();
  if (path === 'admin-notifications.html'){
    loadNotificationsAdmin();
    document.getElementById('notification-form')?.addEventListener('submit', sendNotification);
  }
});
