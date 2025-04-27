// app.js

const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// —————————————————————————————————————————————————————————————
// Modal & Logout Helpers
// —————————————————————————————————————————————————————————————
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }

function setupLogout() {
  const link = document.getElementById('logout-link');
  if (link) link.onclick = () => {
    localStorage.clear();
    window.location.href = 'index.html';
  };
}

// Always close image modal on backdrop or “×”
function setupModal() {
  const modal = document.getElementById('image-modal');
  document.getElementById('modal-close')?.onclick = () => closeModal('image-modal');
  modal?.addEventListener('click', e => {
    if (e.target === modal) closeModal('image-modal');
  });
}

// —————————————————————————————————————————————————————————————
// INDEX.HTML: Hostels as columns + nested rooms + filters
// —————————————————————————————————————————————————————————————
let allHostels = [], allRooms = [];

async function fetchMasterData() {
  try {
    const [hRes, rRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/hostels`),
      fetch(`${BACKEND_URL}/api/rooms`)
    ]);
    allHostels = await hRes.json();
    allRooms   = await rRes.json();
  } catch (err) {
    console.error('Error fetching master data:', err);
  }
}

function renderIndex() {
  const container = document.getElementById('hostels-container');
  if (!container) return;

  // read filters
  const locQ = document.getElementById('search-location')?.value.trim().toLowerCase() || '';
  const amQ  = document.getElementById('search-amenities')?.value.trim().toLowerCase() || '';
  const minP = Number(document.getElementById('search-min-price')?.value);
  const maxP = Number(document.getElementById('search-max-price')?.value);
  const maxO = Number(document.getElementById('search-max-occupancy')?.value);

  // filter rooms first
  const roomsFiltered = allRooms.filter(r => {
    const desc = (r.description||'').toLowerCase();
    return (
      (!minP || r.price >= minP) &&
      (!maxP || r.price <= maxP) &&
      (!maxO || r.occupancy_limit <= maxO) &&
      (!amQ  || desc.includes(amQ))
    );
  });

  container.innerHTML = '';
  allHostels.forEach(h => {
    const addr = (h.address||'').toLowerCase();
    const desc = (h.description||'').toLowerCase();
    if (locQ && !addr.includes(locQ)) return;
    if (amQ  && !desc.includes(amQ)) return;

    const rooms = roomsFiltered.filter(r => r.hostel_id === h.id);
    const col   = document.createElement('div');
    col.className = 'hostel-column';

    const roomsHTML = rooms.length
      ? rooms.map(r => `
        <div class="room-card">
          <h4>${r.name}</h4>
          <p>${r.description}</p>
          <p><strong>Price:</strong> $${r.price}</p>
          <p><strong>Occupancy:</strong> ${r.occupancy_limit}</p>
          <button class="apply-room" data-id="${r.id}">Apply</button>
          ${r.photo_url
            ? `<button class="view-image" data-src="${r.photo_url}">View</button>`
            : ''
          }
        </div>
      `).join('')
      : '<p>No rooms available.</p>';

    col.innerHTML = `
      <h3>${h.name}</h3>
      <p>${h.description}</p>
      <div class="rooms-list">${roomsHTML}</div>
    `;
    container.appendChild(col);
  });

  attachRoomHandlers();
}

function attachRoomHandlers() {
  // Apply
  document.querySelectorAll('.apply-room').forEach(btn => {
    btn.onclick = async () => {
      const userId = Number(localStorage.getItem('userId'));
      if (!userId) {
        alert('Please log in to apply.');
        return window.location.href = 'login.html';
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/applications`, {
          method: 'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            user_id: userId,
            room_id: Number(btn.dataset.id),
            status: 'Pending'
          })
        });
        if (!res.ok) throw new Error(res.statusText);
        alert('Application submitted!');
      } catch (e) {
        console.error(e);
        alert('Failed to submit application.');
      }
    };
  });

  // View image
  document.querySelectorAll('.view-image').forEach(btn => {
    btn.onclick = () => {
      const src = btn.dataset.src;
      if (!src) return alert('No image available');
      document.getElementById('modal-image').src = src;
      openModal('image-modal');
    };
  });
}

// —————————————————————————————————————————————————————————————
// HOSTELS.HTML loader
// —————————————————————————————————————————————————————————————
async function loadHostelsPage() {
  const ul = document.getElementById('hostels-list');
  if (!ul) return;
  ul.innerHTML = '<li>Loading hostels…</li>';
  try {
    const res = await fetch(`${BACKEND_URL}/api/hostels`);
    const data = await res.json();
    ul.innerHTML = Array.isArray(data) && data.length
      ? data.map(h => `<li>
          <h3>${h.name}</h3>
          <p>${h.description}</p>
          <p><strong>Occupancy:</strong> ${h.occupancy_limit}</p>
          ${h.photo_url ? `<img src="${h.photo_url}" style="max-width:200px;">` : ''}
        </li>`).join('')
      : '<li>No hostels available.</li>';
  } catch (e) {
    console.error(e);
    ul.innerHTML = '<li>Error loading hostels.</li>';
  }
}

// —————————————————————————————————————————————————————————————
// ROOMS.HTML loader
// —————————————————————————————————————————————————————————————
async function loadRoomsPage() {
  const ul = document.getElementById('rooms-list');
  if (!ul) return;
  ul.innerHTML = '<li>Loading rooms…</li>';
  try {
    const res = await fetch(`${BACKEND_URL}/api/rooms`);
    const data = await res.json();
    ul.innerHTML = Array.isArray(data) && data.length
      ? data.map(r => `<li>
          <h3>${r.name}</h3>
          <p>${r.description}</p>
          <p><strong>Price:</strong> $${r.price}</p>
          <p><strong>Occupancy:</strong> ${r.occupancy_limit}</p>
          <button onclick="applyRoom(${r.id})">Apply</button>
          ${r.photo_url ? `<button onclick="viewImage('${r.photo_url}')">View</button>` : ''}
        </li>`).join('')
      : '<li>No rooms available.</li>';
  } catch (e) {
    console.error(e);
    ul.innerHTML = '<li>Error loading rooms.</li>';
  }
}

// helper for rooms.html
async function applyRoom(roomId) {
  const userId = Number(localStorage.getItem('userId'));
  if (!userId) {
    alert('Please log in.');
    return window.location.href = 'login.html';
  }
  try {
    await fetch(`${BACKEND_URL}/api/applications`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ user_id:userId, room_id:roomId, status:'Pending' })
    });
    alert('Applied!');
  } catch {
    alert('Failed to apply.');
  }
}

// —————————————————————————————————————————————————————————————
// APPLICATIONS.HTML loader
// —————————————————————————————————————————————————————————————
async function loadApplicationsPage() {
  const ul = document.getElementById('applications-list');
  if (!ul) return;
  ul.innerHTML = '<li>Loading applications…</li>';
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers:{ 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    const apps = data.applications || [];
    ul.innerHTML = apps.length
      ? apps.map(a => `<li>Room: ${a.room}, Status: ${a.status}, Applied: ${new Date(a.applied_at).toLocaleString()}</li>`).join('')
      : '<li>No applications found.</li>';
  } catch (e) {
    console.error(e);
    ul.innerHTML = '<li>Error loading applications.</li>';
  }
}

// —————————————————————————————————————————————————————————————
// DASHBOARD.HTML loader
// —————————————————————————————————————————————————————————————
async function loadDashboardPage() {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'login.html';

  // Profile
  const nameEl  = document.getElementById('student-name');
  const emailEl = document.getElementById('student-email');
  // Stats
  const totalEl    = document.getElementById('total-applications');
  const pendingEl  = document.getElementById('pending-applications');
  const acceptedEl = document.getElementById('accepted-applications');
  const rejectedEl = document.getElementById('rejected-applications');
  // Assigned rooms & notifications
  const roomsUl        = document.getElementById('assigned-rooms-list');
  const notifsUl       = document.getElementById('notifications-list');

  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers:{ 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    // fill profile
    nameEl.textContent  = data.profile?.username || 'N/A';
    emailEl.textContent = data.profile?.email    || 'N/A';

    // fill stats
    totalEl.textContent    = data.stats.total   || 0;
    pendingEl.textContent  = data.stats.pending || 0;
    acceptedEl.textContent = data.stats.accepted|| 0;
    rejectedEl.textContent = data.stats.rejected|| 0;

    // assigned rooms
    roomsUl.innerHTML = (data.assignedRooms||[]).length
      ? data.assignedRooms.map(r => `<li>Room: ${r.room}, Hostel: ${r.hostel}</li>`).join('')
      : '<li>No rooms assigned.</li>';

    // notifications
    notifsUl.innerHTML = (data.notifications||[]).length
      ? data.notifications.map(n => `<li>[${new Date(n.created_at).toLocaleString()}] ${n.type}: ${n.message}</li>`).join('')
      : '<li>No notifications.</li>';
  } catch (e) {
    console.error(e);
    alert('Failed to load dashboard.');
  }
}

// —————————————————————————————————————————————————————————————
// LOGIN & REGISTER
// —————————————————————————————————————————————————————————————
async function login(event) {
  event.preventDefault();
  const email = document.getElementById('email')?.value.trim();
  const pwd   = document.getElementById('password')?.value.trim();
  if (!email||!pwd) return alert('Fill both fields');
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email, password: pwd })
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
  } catch (e) {
    console.error(e);
    alert(`Login failed: ${e.message}`);
  }
}

async function register(event) {
  event.preventDefault();
  const username = document.getElementById('name')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const phone    = document.getElementById('phone')?.value.trim();
  const pwd      = document.getElementById('password')?.value.trim();
  const conf     = document.getElementById('confirm-password')?.value.trim();
  if (!username||!email||!phone||!pwd||!conf) return alert('All fields required');
  if (pwd!==conf) return alert('Passwords must match');
  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username, email, phone, password: pwd })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error||'Registration failed');
    }
    alert('Registration successful!');
    window.location.href = 'login.html';
  } catch (e) {
    console.error(e);
    alert(`Registration failed: ${e.message}`);
  }
}

// —————————————————————————————————————————————————————————————
// PAGE DISPATCHER
// —————————————————————————————————————————————————————————————
window.addEventListener('DOMContentLoaded', async () => {
  setupLogout();
  setupModal();

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  if (page === '' || page === 'index.html') {
    // index
    await fetchMasterData();
    renderIndex();
    document.getElementById('search-button')?.addEventListener('click', renderIndex);
    document.getElementById('clear-search-button')?.addEventListener('click', () => {
      ['search-location','search-amenities','search-min-price','search-max-price','search-max-occupancy']
        .forEach(id => document.getElementById(id).value = '');
      renderIndex();
    });
  }

  if (page === 'hostels.html')       await loadHostelsPage();
  if (page === 'rooms.html')         await loadRoomsPage();
  if (page === 'applications.html')  await loadApplicationsPage();
  if (page === 'dashboard.html')     await loadDashboardPage();
  if (page === 'login.html')         document.getElementById('login-form')?.addEventListener('submit', login);
  if (page === 'register.html')      document.getElementById('register-form')?.addEventListener('submit', register);
});
