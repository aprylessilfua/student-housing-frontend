// admin.js

const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// — Modal Helpers
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

// — Auth
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// — HOSTELS CRUD
async function loadHostelsAdmin() {
  const tbody = document.getElementById('hostels-table-body');
  tbody.innerHTML = '<tr><td colspan="8">Loading hostels…</td></tr>';
  try {
    const [hRes, rRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/hostels`),
      fetch(`${BACKEND_URL}/api/rooms`)
    ]);
    if (!hRes.ok) throw new Error(`Hostels API ${hRes.status}`);
    if (!rRes.ok) throw new Error(`Rooms API ${rRes.status}`);
    const hostels = await hRes.json();
    const rooms   = await rRes.json();
    if (!Array.isArray(hostels) || !Array.isArray(rooms)) {
      throw new Error('Expected arrays');
    }

    tbody.innerHTML = '';
    if (hostels.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8">No hostels found.</td></tr>';
      return;
    }

    hostels.forEach(h => {
      const linkedRooms = rooms
        .filter(r => r.hostel_id === h.id)
        .map(r => r.name)
        .join(', ') || '—';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${h.id}</td>
        <td>${h.name}</td>
        <td>${h.address || ''}</td>
        <td>${h.description}</td>
        <td>${h.occupancy_limit}</td>
        <td>${linkedRooms}</td>
        <td><a href="${h.photo_url}" target="_blank">View</a></td>
        <td>
          <button class="edit-hostel"   data-id="${h.id}">Edit</button>
          <button class="delete-hostel" data-id="${h.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading hostels:', err);
    tbody.innerHTML = `<tr><td colspan="8">Error loading hostels.</td></tr>`;
  }
}

async function openHostelForm(id = '') {
  ['hostel-id','hostel-name','hostel-address','hostel-description','hostel-occupancy','hostel-photo']
    .forEach(fid => document.getElementById(fid).value = '');

  if (id) {
    const res = await fetch(`${BACKEND_URL}/api/hostels/${id}`);
    if (!res.ok) return alert('Hostel not found');
    const h = await res.json();
    document.getElementById('hostel-id').value          = h.id;
    document.getElementById('hostel-name').value        = h.name;
    document.getElementById('hostel-address').value     = h.address || '';
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
    address:         document.getElementById('hostel-address').value.trim(),
    description:     document.getElementById('hostel-description').value.trim(),
    occupancy_limit: Number(document.getElementById('hostel-occupancy').value),
    photo_url:       document.getElementById('hostel-photo').value.trim()
  };
  await fetch(
    `${BACKEND_URL}/api/hostels${id ? `/${id}` : ''}`,
    {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );
  closeModal('hostel-form-modal');
  loadHostelsAdmin();
}

async function deleteHostel(id) {
  if (!confirm('Delete this hostel?')) return;
  await fetch(`${BACKEND_URL}/api/hostels/${id}`, { method: 'DELETE' });
  loadHostelsAdmin();
}


// — ROOMS CRUD
async function loadRoomsAdmin() {
  const tbody = document.getElementById('rooms-table-body');
  tbody.innerHTML = '<tr><td colspan="8">Loading rooms…</td></tr>';
  try {
    const [rRes, hRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/rooms`),
      fetch(`${BACKEND_URL}/api/hostels`)
    ]);
    if (!rRes.ok) throw new Error(`Rooms API ${rRes.status}`);
    if (!hRes.ok) throw new Error(`Hostels API ${hRes.status}`);
    const rooms   = await rRes.json();
    const hostels = await hRes.json();
    if (!Array.isArray(rooms) || !Array.isArray(hostels)) {
      throw new Error('Expected arrays');
    }

    tbody.innerHTML = '';
    if (rooms.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8">No rooms found.</td></tr>';
      return;
    }

    rooms.forEach(r => {
      const hostelName = (hostels.find(h => h.id === r.hostel_id) || {}).name || '—';
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.name}</td>
        <td>${r.description}</td>
        <td>${r.price}</td>
        <td>${r.occupancy_limit}</td>
        <td>${hostelName}</td>
        <td><a href="${r.photo_url}" target="_blank">View</a></td>
        <td>
          <button class="edit-room"   data-id="${r.id}">Edit</button>
          <button class="delete-room" data-id="${r.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading rooms:', err);
    tbody.innerHTML = `<tr><td colspan="8">Error loading rooms.</td></tr>`;
  }
}

async function openRoomForm(id = '') {
  ['room-id','room-name','room-description','room-price','room-occupancy','room-hostel-id','room-photo']
    .forEach(fid => document.getElementById(fid).value = '');

  if (id) {
    const res = await fetch(`${BACKEND_URL}/api/rooms/${id}`);
    if (!res.ok) return alert('Room not found');
    const r = await res.json();
    document.getElementById('room-id').value           = r.id;
    document.getElementById('room-name').value         = r.name;
    document.getElementById('room-description').value  = r.description;
    document.getElementById('room-price').value        = r.price;
    document.getElementById('room-occupancy').value    = r.occupancy_limit;
    document.getElementById('room-hostel-id').value    = r.hostel_id;
    document.getElementById('room-photo').value        = r.photo_url;
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
  await fetch(
    `${BACKEND_URL}/api/rooms${id ? `/${id}` : ''}`,
    {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );
  closeModal('room-form-modal');
  loadRoomsAdmin();
}

async function deleteRoom(id) {
  if (!confirm('Delete this room?')) return;
  await fetch(`${BACKEND_URL}/api/rooms/${id}`, { method: 'DELETE' });
  loadRoomsAdmin();
}


// — STUDENTS CRUD
async function loadStudentsAdmin() {
  const tbody = document.getElementById('students-table-body');
  tbody.innerHTML = '<tr><td colspan="5">Loading students…</td></tr>';
  try {
    const res   = await fetch(`${BACKEND_URL}/api/users`);
    if (!res.ok) throw new Error(`Users API ${res.status}`);
    const users = await res.json();
    if (!Array.isArray(users)) throw new Error('Expected array');

    tbody.innerHTML = '';
    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5">No students found.</td></tr>';
      return;
    }

    users.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${u.id}</td>
        <td>${u.username}</td>
        <td>${u.email}</td>
        <td>${u.phone || ''}</td>
        <td>
          <button class="delete-student" data-id="${u.id}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading students:', err);
    tbody.innerHTML = `<tr><td colspan="5">Error loading students.</td></tr>`;
  }
}

async function deleteStudent(id) {
  if (!confirm('Delete this student?')) return;
  await fetch(`${BACKEND_URL}/api/users/${id}`, { method: 'DELETE' });
  loadStudentsAdmin();
}


// — APPLICATIONS CRUD
async function loadApplicationsAdmin() {
  const tbody = document.getElementById('applications-table-body');
  tbody.innerHTML = '<tr><td colspan="6">Loading applications…</td></tr>';
  try {
    const res  = await fetch(`${BACKEND_URL}/api/applications`);
    if (!res.ok) throw new Error(`Applications API ${res.status}`);
    const apps = await res.json();
    if (!Array.isArray(apps)) throw new Error('Expected array');

    tbody.innerHTML = '';
    if (apps.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No applications found.</td></tr>';
      return;
    }

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
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading applications:', err);
    tbody.innerHTML = `<tr><td colspan="6">Error loading applications.</td></tr>`;
  }
}

async function updateApplication(id, status) {
  await fetch(`${BACKEND_URL}/api/applications/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  });
  loadApplicationsAdmin();
}


// — NOTIFICATIONS CRUD
async function loadNotificationsAdmin() {
  const tbody = document.getElementById('notifications-table-body');
  tbody.innerHTML = '<tr><td colspan="7">Loading notifications…</td></tr>';
  try {
    const res    = await fetch(`${BACKEND_URL}/api/notifications`);
    if (!res.ok) throw new Error(`Notifications API ${res.status}`);
    const notifs = await res.json();
    if (!Array.isArray(notifs)) throw new Error('Expected array');

    tbody.innerHTML = '';
    if (notifs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No notifications found.</td></tr>';
      return;
    }

    notifs.forEach(n => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${n.id}</td>
        <td>${n.user_id}</td>
        <td>${n.user_role}</td>
        <td>${n.message}</td>
        <td>${n.type}</td>
        <td>${n.is_read ? 'Yes' : 'No'}</td>
        <td><button class="read-notif" data-id="${n.id}">Mark Read</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    console.error('Error loading notifications:', err);
    tbody.innerHTML = `<tr><td colspan="7">Error loading notifications.</td></tr>`;
  }
}

async function markNotifRead(id) {
  await fetch(`${BACKEND_URL}/api/notifications/${id}/read`, { method: 'PUT' });
  loadNotificationsAdmin();
}

async function sendNotification(e) {
  e.preventDefault();
  const payload = {
    user_id:    +document.getElementById('notif-user-id').value,
    user_role:  document.getElementById('notif-user-role').value,
    message:    document.getElementById('notif-message').value,
    type:       document.getElementById('notif-type').value,
    is_read:    false,
    created_at: new Date().toISOString()
  };
  await fetch(`${BACKEND_URL}/api/notifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  loadNotificationsAdmin();
}


// — INITIALIZE & DELEGATE
window.addEventListener('DOMContentLoaded', () => {
  // common
  document.getElementById('logout-link')?.addEventListener('click', logout);

  // hostels page
  if (location.pathname.endsWith('admin-hostels.html')) {
    loadHostelsAdmin();
    document.getElementById('create-hostel-button')
      ?.addEventListener('click', () => openHostelForm());
    document.getElementById('hostels-table-body')
      ?.addEventListener('click', e => {
        if (e.target.matches('.edit-hostel'))   openHostelForm(e.target.dataset.id);
        if (e.target.matches('.delete-hostel')) deleteHostel(e.target.dataset.id);
      });
    document.getElementById('hostel-form')
      ?.addEventListener('submit', saveHostel);
  }

  // rooms page
  if (location.pathname.endsWith('admin-rooms.html')) {
    loadRoomsAdmin();
    document.getElementById('create-room-button')
      ?.addEventListener('click', () => openRoomForm());
    document.getElementById('rooms-table-body')
      ?.addEventListener('click', e => {
        if (e.target.matches('.edit-room'))   openRoomForm(e.target.dataset.id);
        if (e.target.matches('.delete-room')) deleteRoom(e.target.dataset.id);
      });
    document.getElementById('room-form')
      ?.addEventListener('submit', saveRoom);
  }

  // students page
  if (location.pathname.endsWith('admin-students.html')) {
    loadStudentsAdmin();
    document.getElementById('students-table-body')
      ?.addEventListener('click', e => {
        if (e.target.matches('.delete-student')) deleteStudent(e.target.dataset.id);
      });
  }

  // applications page
  if (location.pathname.endsWith('admin-applications.html')) {
    loadApplicationsAdmin();
    document.getElementById('applications-table-body')
      ?.addEventListener('click', e => {
        if (e.target.matches('.approve-app')) updateApplication(e.target.dataset.id, 'Accepted');
        if (e.target.matches('.reject-app'))  updateApplication(e.target.dataset.id, 'Rejected');
      });
  }

  // notifications page
  if (location.pathname.endsWith('admin-notifications.html')) {
    loadNotificationsAdmin();
    document.getElementById('notification-form')
      ?.addEventListener('submit', sendNotification);
    document.getElementById('notifications-table-body')
      ?.addEventListener('click', e => {
        if (e.target.matches('.read-notif')) markNotifRead(e.target.dataset.id);
      });
  }
});
