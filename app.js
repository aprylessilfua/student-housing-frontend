// app.js
const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// — Logout (student) —
function logoutStudent() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// — Load Hostels —
async function loadHostels() {
  const list = document.getElementById('hostels-list');
  if (!list) return;
  list.innerHTML = '<li>Loading hostels…</li>';
  try {
    const res  = await fetch(`${BACKEND_URL}/api/hostels`);
    if (!res.ok) throw new Error(`Hostels API ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected array');
    if (data.length === 0) {
      list.innerHTML = '<li>No hostels available.</li>';
      return;
    }
    list.innerHTML = '';
    data.forEach(h => {
      const li = document.createElement('li');
      li.innerHTML = `
        <h3>${h.name}</h3>
        ${h.address ? `<p>Address: ${h.address}</p>` : ''}
        <p>${h.description}</p>
        <p>Occupancy limit: ${h.occupancy_limit}</p>
        ${h.photo_url ? `<img src="${h.photo_url}" alt="Hostel photo" style="max-width:200px;">` : ''}
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading hostels:', err);
    list.innerHTML = '<li>Error loading hostels.</li>';
  }
}

// — Load Rooms + Apply Button —
async function loadRooms() {
  const list = document.getElementById('rooms-list');
  if (!list) return;
  list.innerHTML = '<li>Loading rooms…</li>';
  try {
    const res  = await fetch(`${BACKEND_URL}/api/rooms`);
    if (!res.ok) throw new Error(`Rooms API ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Expected array');
    if (data.length === 0) {
      list.innerHTML = '<li>No rooms available.</li>';
      return;
    }
    list.innerHTML = '';
    data.forEach(r => {
      const li = document.createElement('li');
      li.innerHTML = `
        <h3>${r.name}</h3>
        <p>${r.description}</p>
        <p>Price: $${r.price}</p>
        <p>Occupancy: ${r.occupancy_limit}</p>
        ${r.photo_url ? `<img src="${r.photo_url}" alt="Room photo" style="max-width:200px;">` : ''}
        <button class="apply-room" data-room-id="${r.id}">Apply</button>
      `;
      list.appendChild(li);
    });
    // bind apply
    document.querySelectorAll('.apply-room').forEach(btn => {
      btn.addEventListener('click', () => applyForHousing(btn.dataset.roomId));
    });
  } catch (err) {
    console.error('Error loading rooms:', err);
    list.innerHTML = '<li>Error loading rooms.</li>';
  }
}

// — Search (on Index) —
async function performSearch(e) {
  e.preventDefault();
  const q = document.getElementById('search-input').value.trim().toLowerCase();
  if (!q) {
    loadHostels();
    loadRooms();
    return;
  }
  const [hRes, rRes] = await Promise.all([
    fetch(`${BACKEND_URL}/api/hostels`),
    fetch(`${BACKEND_URL}/api/rooms`)
  ]);
  const hostels = await hRes.json();
  const rooms   = await rRes.json();

  // filter hostels
  const hl = document.getElementById('hostels-list');
  hl.innerHTML = '';
  (Array.isArray(hostels) ? hostels : []).filter(h =>
    h.name.toLowerCase().includes(q) ||
    h.description.toLowerCase().includes(q) ||
    (h.address||'').toLowerCase().includes(q)
  ).forEach(h => {
    const li = document.createElement('li');
    li.innerHTML = `
      <h3>${h.name}</h3>
      <p>${h.description}</p>
    `;
    hl.appendChild(li);
  });
  // filter rooms
  const rl = document.getElementById('rooms-list');
  rl.innerHTML = '';
  (Array.isArray(rooms) ? rooms : []).filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.description.toLowerCase().includes(q)
  ).forEach(r => {
    const li = document.createElement('li');
    li.innerHTML = `
      <h3>${r.name}</h3>
      <p>${r.description}</p>
    `;
    rl.appendChild(li);
  });
}
function clearSearch() {
  document.getElementById('search-input').value = '';
  loadHostels();
  loadRooms();
}

// — Apply for Housing —
async function applyForHousing(roomId) {
  const userId = Number(localStorage.getItem('userId'));
  if (!userId) {
    alert('Please login to apply');
    return window.location.href = 'login.html';
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        room_id: Number(roomId),
        status: 'Pending'
      })
    });
    if (!res.ok) throw new Error('Apply failed');
    alert('Application submitted!');
  } catch (err) {
    console.error('Apply error:', err);
    alert('Failed to apply.');
  }
}

// — View My Applications —
async function loadApplications() {
  const list = document.getElementById('applications-list');
  if (!list) return;
  list.innerHTML = '<li>Loading applications…</li>';
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Dashboard ${res.status}`);
    const data = await res.json();
    const apps = data.applications || [];
    if (apps.length === 0) {
      list.innerHTML = '<li>No applications found.</li>';
      return;
    }
    list.innerHTML = '';
    apps.forEach(a => {
      const li = document.createElement('li');
      li.textContent = `Room: ${a.room}  Status: ${a.status}  Applied: ${new Date(a.applied_at).toLocaleString()}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading applications:', err);
    list.innerHTML = '<li>Error loading applications.</li>';
  }
}

// — Auth: Login & Register —
async function login(event) {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!email || !password) return alert('Fill both fields');
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const { token } = await res.json();
    localStorage.setItem('token', token);
    const payload = JSON.parse(atob(token.split('.')[1]));
    localStorage.setItem('userId', payload.id);
    window.location.href = 'dashboard.html';
  } catch (err) {
    console.error('Login error:', err);
    alert(`Login failed: ${err.message}`);
  }
}

async function register(event) {
  event.preventDefault();
  const username = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const phone    = document.getElementById('phone').value.trim();
  const pwd      = document.getElementById('password').value.trim();
  const confirm  = document.getElementById('confirm-password').value.trim();
  if (!username||!email||!phone||!pwd||!confirm) return alert('All fields required');
  if (pwd !== confirm) return alert('Passwords do not match');
  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, email, phone, password: pwd })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    alert('Registration successful!');
    window.location.href = 'login.html';
  } catch (err) {
    console.error('Register error:', err);
    alert(`Registration failed: ${err.message}`);
  }
}

// — Dashboard —
async function loadDashboard() {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'login.html';
  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error(`Dashboard ${res.status}`);
    const data = await res.json();
    // Profile
    document.getElementById('student-name').textContent  = data.profile?.username || 'N/A';
    document.getElementById('student-email').textContent = data.profile?.email    || 'N/A';
    // Stats
    document.getElementById('total-applications').textContent    = data.stats.total   || 0;
    document.getElementById('pending-applications').textContent  = data.stats.pending || 0;
    document.getElementById('accepted-applications').textContent = data.stats.accepted|| 0;
    document.getElementById('rejected-applications').textContent = data.stats.rejected|| 0;
    // Assigned Rooms
    const ar = document.getElementById('assigned-rooms-list');
    ar.innerHTML = '';
    (Array.isArray(data.assignedRooms)?data.assignedRooms:[]).forEach(r => {
      const li = document.createElement('li');
      li.textContent = `Room: ${r.room}, Hostel: ${r.hostel}`;
      ar.appendChild(li);
    });
    if (!data.assignedRooms?.length) {
      ar.innerHTML = '<li>No rooms assigned.</li>';
    }
    // Notifications
    const nl = document.getElementById('notifications-list');
    nl.innerHTML = '';
    (Array.isArray(data.notifications)?data.notifications:[]).forEach(n => {
      const li = document.createElement('li');
      li.textContent = `[${new Date(n.created_at).toLocaleString()}] ${n.type}: ${n.message}`;
      nl.appendChild(li);
    });
    if (!data.notifications?.length) {
      nl.innerHTML = '<li>No notifications.</li>';
    }
  } catch (err) {
    console.error('Dashboard error:', err);
    alert('Failed to load dashboard.');
  }
}

// — Init & Bind —
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logout-link')?.addEventListener('click', logoutStudent);

  const page = location.pathname.split('/').pop();
  if (page === '' || page === 'index.html') {
    loadHostels();
    loadRooms();
    document.getElementById('search-button')?.addEventListener('click', performSearch);
    document.getElementById('clear-search-button')?.addEventListener('click', clearSearch);
  }
  if (page === 'hostels.html') loadHostels();
  if (page === 'rooms.html')   loadRooms();
  if (page === 'applications.html') loadApplications();
  if (page === 'dashboard.html')  loadDashboard();

  document.getElementById('login-form')?.addEventListener('submit', login);
  document.getElementById('register-form')?.addEventListener('submit', register);
});
