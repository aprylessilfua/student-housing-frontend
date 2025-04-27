// app.js

const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// — Helpers for modal & logout
function openModal(id)  { document.getElementById(id)?.classList.add('active'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('active'); }
function setupLogout() {
  const l = document.getElementById('logout-link');
  if (l) l.onclick = () => { localStorage.clear(); window.location.href = 'index.html'; };
}
function setupModal() {
  const m = document.getElementById('image-modal');
  document.getElementById('modal-close')?.addEventListener('click', () => closeModal('image-modal'));
  m?.addEventListener('click', e => { if (e.target === m) closeModal('image-modal'); });
}

// — Shared data caches for index
let allHostels = [], allRooms = [];

// Single fetch for hostels/rooms
async function fetchAll() {
  try {
    const [hRes, rRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/hostels`),
      fetch(`${BACKEND_URL}/api/rooms`)
    ]);
    allHostels = await hRes.json();
    allRooms   = await rRes.json();
  } catch (err) {
    console.error('fetchAll error:', err);
  }
}

// — INDEX render
function renderIndex() {
  const container = document.getElementById('hostels-container');
  if (!container) return;

  // read filters
  const locQ = document.getElementById('search-location')?.value.trim().toLowerCase() || '';
  const amQ  = document.getElementById('search-amenities')?.value.trim().toLowerCase() || '';
  const minP = Number(document.getElementById('search-min-price')?.value);
  const maxP = Number(document.getElementById('search-max-price')?.value);
  const maxO = Number(document.getElementById('search-max-occupancy')?.value);

  // filter rooms
  const roomsFiltered = allRooms.filter(r => {
    const d = (r.description||'').toLowerCase();
    return (!minP || r.price >= minP)
        && (!maxP || r.price <= maxP)
        && (!maxO || r.occupancy_limit <= maxO)
        && (!amQ  || d.includes(amQ));
  });

  container.innerHTML = '';
  allHostels.forEach(h => {
    const addr = (h.address||'').toLowerCase();
    const desc = (h.description||'').toLowerCase();
    if (locQ && !addr.includes(locQ)) return;
    if (amQ  && !desc.includes(amQ)) return;

    const rooms = roomsFiltered.filter(r => r.hostel_id === h.id);
    const col = document.createElement('div');
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

  // attach handlers
  document.querySelectorAll('.apply-room').forEach(btn => {
    btn.onclick = async () => {
      const userId = Number(localStorage.getItem('userId'));
      if (!userId) {
        alert('Please log in to apply.');
        return window.location.href = 'login.html';
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/applications`, {
          method:'POST',
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
        alert('Failed to apply.');
      }
    };
  });
  document.querySelectorAll('.view-image').forEach(btn => {
    btn.onclick = () => {
      const src = btn.dataset.src;
      if (!src) return alert('No image');
      document.getElementById('modal-image').src = src;
      openModal('image-modal');
    };
  });
}

// — HOSTELS.HTML loader
async function loadHostelsPage() {
  const ul = document.getElementById('hostels-list');
  if (!ul) return;
  ul.innerHTML = '<li>Loading…</li>';
  try {
    const r = await fetch(`${BACKEND_URL}/api/hostels`);
    const data = await r.json();
    ul.innerHTML = Array.isArray(data) && data.length
      ? data.map(h => `<li>
          <h3>${h.name}</h3>
          <p>${h.description}</p>
          <p><strong>Occupancy:</strong> ${h.occupancy_limit}</p>
          ${h.photo_url?`<img src="${h.photo_url}" style="max-width:200px;">`:``}
        </li>`).join('')
      : '<li>No hostels found.</li>';
  } catch (e) {
    console.error(e);
    ul.innerHTML = '<li>Error loading hostels.</li>';
  }
}

// — ROOMS.HTML loader
async function loadRoomsPage() {
  const ul = document.getElementById('rooms-list');
  if (!ul) return;
  ul.innerHTML = '<li>Loading…</li>';
  try {
    const r = await fetch(`${BACKEND_URL}/api/rooms`);
    const data = await r.json();
    ul.innerHTML = Array.isArray(data) && data.length
      ? data.map(rm => `<li>
          <h3>${rm.name}</h3>
          <p>${rm.description}</p>
          <p><strong>Price:</strong> $${rm.price}</p>
          <p><strong>Occupancy:</strong> ${rm.occupancy_limit}</p>
          <button onclick="applyRoom(${rm.id})">Apply</button>
          ${rm.photo_url?`<button onclick="viewImage('${rm.photo_url}')">View</button>`:``}
        </li>`).join('')
      : '<li>No rooms found.</li>';
  } catch (e) {
    console.error(e);
    ul.innerHTML = '<li>Error loading rooms.</li>';
  }
}
async function applyRoom(id) {
  const uid = Number(localStorage.getItem('userId'));
  if (!uid) return alert('Please log in.');
  await fetch(`${BACKEND_URL}/api/applications`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ user_id:uid, room_id:id, status:'Pending' })
  });
  alert('Applied!');
}

// — APPLICATIONS.HTML loader
async function loadApplicationsPage() {
  const ul = document.getElementById('applications-list');
  if (!ul) return;
  ul.innerHTML = '<li>Loading…</li>';
  try {
    const token = localStorage.getItem('token');
    const r = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers:{ 'Authorization': `Bearer ${token}` }
    });
    const data = await r.json();
    const apps = data.applications||[];
    ul.innerHTML = apps.length
      ? apps.map(a => `<li>Room: ${a.room}, Status: ${a.status}, When: ${new Date(a.applied_at).toLocaleString()}</li>`).join('')
      : '<li>No applications.</li>';
  } catch (e) {
    console.error(e);
    ul.innerHTML = '<li>Error loading applications.</li>';
  }
}

// — DASHBOARD.HTML loader
async function loadDashboardPage() {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href='login.html';

  const nameEl  = document.getElementById('student-name');
  const emailEl = document.getElementById('student-email');
  const totalEl    = document.getElementById('total-applications');
  const pendingEl  = document.getElementById('pending-applications');
  const acceptedEl = document.getElementById('accepted-applications');
  const rejectedEl = document.getElementById('rejected-applications');
  const roomsUl    = document.getElementById('assigned-rooms-list');
  const notifsUl   = document.getElementById('notifications-list');

  try {
    const r = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers:{ 'Authorization': `Bearer ${token}` }
    });
    const d = await r.json();
    nameEl.textContent  = d.profile?.username || 'N/A';
    emailEl.textContent = d.profile?.email    || 'N/A';
    totalEl.textContent    = d.stats?.total   || 0;
    pendingEl.textContent  = d.stats?.pending || 0;
    acceptedEl.textContent = d.stats?.accepted|| 0;
    rejectedEl.textContent = d.stats?.rejected|| 0;
    roomsUl.innerHTML = (d.assignedRooms||[]).length
      ? d.assignedRooms.map(rm => `<li>${rm.room} @ ${rm.hostel}</li>`).join('')
      : '<li>No rooms.</li>';
    notifsUl.innerHTML = (d.notifications||[]).length
      ? d.notifications.map(n => `<li>[${new Date(n.created_at).toLocaleString()}] ${n.type}: ${n.message}</li>`).join('')
      : '<li>No notifications.</li>';
  } catch (e) {
    console.error(e);
    alert('Dashboard load failed.');
  }
}

// — LOGIN & REGISTER
async function login(event) {
  event.preventDefault();
  const em = document.getElementById('email')?.value.trim();
  const pw = document.getElementById('password')?.value.trim();
  if (!em||!pw) return alert('Fill both fields');
  try {
    const r = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ email:em, password:pw })
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error||r.statusText);
    }
    const { token } = await r.json();
    localStorage.setItem('token', token);
    const p = JSON.parse(atob(token.split('.')[1]));
    localStorage.setItem('userId', p.id);
    window.location.href='dashboard.html';
  } catch (e) {
    console.error(e);
    alert(`Login failed: ${e.message}`);
  }
}

async function register(event) {
  event.preventDefault();
  const un = document.getElementById('name')?.value.trim();
  const em = document.getElementById('email')?.value.trim();
  const ph = document.getElementById('phone')?.value.trim();
  const pw = document.getElementById('password')?.value.trim();
  const cf = document.getElementById('confirm-password')?.value.trim();
  if (!un||!em||!ph||!pw||!cf) return alert('All fields');
  if (pw!==cf) return alert('Passwords must match');
  try {
    const r = await fetch(`${BACKEND_URL}/api/users`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ username:un, email:em, phone:ph, password:pw })
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.error||r.statusText);
    }
    alert('Registered!');
    window.location='login.html';
  } catch (e) {
    console.error(e);
    alert(`Register failed: ${e.message}`);
  }
}

// — PAGE DISPATCHER
window.addEventListener('DOMContentLoaded', async () => {
  setupLogout();
  setupModal();
  const page = (location.pathname.split('/').pop()||'index.html').toLowerCase();

  if (!page || page==='index.html') {
    await fetchAll();
    renderIndex();
    document.getElementById('search-button')?.addEventListener('click', renderIndex);
    document.getElementById('clear-search-button')?.addEventListener('click', () => {
      ['search-location','search-amenities','search-min-price','search-max-price','search-max-occupancy']
        .forEach(id => { const el=document.getElementById(id); if(el)el.value=''; });
      renderIndex();
    });
  }
  if (page==='hostels.html')      await loadHostelsPage();
  if (page==='rooms.html')        await loadRoomsPage();
  if (page==='applications.html') await loadApplicationsPage();
  if (page==='dashboard.html')    await loadDashboardPage();
  if (page==='login.html')        document.getElementById('login-form')?.addEventListener('submit', login);
  if (page==='register.html')     document.getElementById('register-form')?.addEventListener('submit', register);
});
