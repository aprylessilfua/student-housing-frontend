// app.js

const BACKEND_URL = 'https://student-hostel-backend-bd96.onrender.com';

// ─── Auth & Modal Helpers ───────────────────────────────────────────────────
function setupAuthLink() {
  const link = document.getElementById('auth-link');
  if (!link) return;
  if (localStorage.getItem('token')) {
    link.textContent = 'Logout';
    link.href = '#';
    link.onclick = () => {
      localStorage.clear();
      window.location.href = 'index.html';
    };
  } else {
    link.textContent = 'Login';
    link.href = 'login.html';
  }
}

function setupImageModal() {
  const modal = document.getElementById('image-modal');
  document.getElementById('modal-close')?.addEventListener('click', () =>
    modal.classList.remove('active')
  );
  modal?.addEventListener('click', e => {
    if (e.target === modal) modal.classList.remove('active');
  });
}

// ─── INDEX PAGE (hostels as columns + nested rooms + filters) ───────────────
let allHostels = [], allRooms = [];

async function fetchAllData() {
  try {
    const [hRes, rRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/hostels`),
      fetch(`${BACKEND_URL}/api/rooms`)
    ]);
    allHostels = await hRes.json();
    allRooms   = await rRes.json();
  } catch (err) {
    console.error('fetchAllData error:', err);
  }
}

function renderIndex() {
  const container = document.getElementById('hostels-container');
  if (!container) return;

  const locQ = document.getElementById('search-location')?.value.trim().toLowerCase() || '';
  const amQ  = document.getElementById('search-amenities')?.value.trim().toLowerCase() || '';
  const minP = Number(document.getElementById('search-min-price')?.value);
  const maxP = Number(document.getElementById('search-max-price')?.value);
  const maxO = Number(document.getElementById('search-max-occupancy')?.value);

  const roomsFiltered = allRooms.filter(r => {
    const desc = (r.description||'').toLowerCase();
    return (!minP || r.price >= minP)
        && (!maxP || r.price <= maxP)
        && (!maxO || r.occupancy_limit <= maxO)
        && (!amQ  || desc.includes(amQ));
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
          <p><strong>Price:</strong> GH₵${r.price}</p>
          <p><strong>Occupancy:</strong> ${r.occupancy_limit}</p>
          <button data-room-id="${r.id}">Apply</button>
          ${r.photo_url?`<button data-src="${r.photo_url}">View</button>`:``}
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

  // Attach handlers
  document.querySelectorAll('button[data-room-id]').forEach(btn => {
    btn.onclick = async () => {
      const uid = Number(localStorage.getItem('userId'));
      if (!uid) {
        alert('Please log in first.');
        return window.location = 'login.html';
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/applications`, {
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body: JSON.stringify({
            user_id: uid,
            room_id: Number(btn.dataset.roomId),
            status: 'Pending'
          })
        });
        if (!res.ok) throw new Error(res.statusText);
        alert('Application submitted!');
      } catch (e) {
        console.error('apply error:', e);
        alert('Failed to apply.');
      }
    };
  });
  document.querySelectorAll('button[data-src]').forEach(btn => {
    btn.onclick = () => {
      const src = btn.dataset.src;
      if (!src) return alert('No image available');
      document.getElementById('modal-image').src = src;
      document.getElementById('image-modal').classList.add('active');
    };
  });
}

// ─── SIMPLE LOADERS FOR OTHER STUDENT PAGES ─────────────────────────────────
async function loadHostelsPage() {
  const tbody = document.getElementById('hostels-table-body');
  if (!tbody) return;

  // show loading placeholder
  tbody.innerHTML = '<tr><td colspan="6">Loading hostels…</td></tr>';

  try {
    const res     = await fetch(`${BACKEND_URL}/api/hostels`);
    const hostels = await res.json();

    if (!Array.isArray(hostels) || hostels.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6">No hostels available.</td></tr>';
      return;
    }

    tbody.innerHTML = hostels.map(h => `
      <tr>
        <td>${h.id}</td>
        <td>${h.name}</td>
        <td>${h.address || '—'}</td>
        <td>${h.description}</td>
        <td>${h.occupancy_limit}</td>
        <td>
          <button class="btn-view" data-src="${h.photo_url || ''}">
            View
          </button>
        </td>
      </tr>
    `).join('');

    // Wire up the View buttons
    document.querySelectorAll('.btn-view').forEach(btn =>
      btn.addEventListener('click', () => {
        const src = btn.dataset.src;
        if (!src) return alert('No image available');
        document.getElementById('modal-image').src = src;
        document.getElementById('image-modal').classList.add('active');
      })
    );

  } catch (err) {
    console.error('loadHostelsPage error:', err);
    tbody.innerHTML = '<tr><td colspan="6">Error loading hostels.</td></tr>';
  }
}

async function loadRoomsPage() {
  const tbody = document.getElementById('rooms-table-body');
  if (!tbody) return;

  // show loading placeholder
  tbody.innerHTML = '<tr><td colspan="7">Loading rooms…</td></tr>';

  try {
    // fetch rooms and hostels (to map IDs → names)
    const [roomsRes, hostelsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/rooms`),
      fetch(`${BACKEND_URL}/api/hostels`)
    ]);
    const rooms   = await roomsRes.json();
    const hostels = await hostelsRes.json();

    // build a lookup: hostel_id → hostel.name
    const hostelMap = hostels.reduce((m, h) => {
      m[h.id] = h.name;
      return m;
    }, {});

    // format prices in GHS
    const ghFormatter = new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS',
      minimumFractionDigits: 2
    });

    // render rows
    if (!Array.isArray(rooms) || rooms.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7">No rooms available.</td></tr>';
      return;
    }

    tbody.innerHTML = rooms.map(r => {
      const priceFmt = ghFormatter.format(r.price);
      const hostelName = hostelMap[r.hostel_id] || 'Unknown';
      return `
        <tr>
          <td>${r.id}</td>
          <td>${r.name}</td>
          <td>${r.description}</td>
          <td>${priceFmt}</td>
          <td>${r.occupancy_limit}</td>
          <td>${hostelName}</td>
          <td>
            <button class="btn-view" data-src="${r.photo_url || ''}">View</button>
            <button class="btn-apply" data-room-id="${r.id}">Apply</button>
          </td>
        </tr>
      `;
    }).join('');

    // wire up the buttons
    document.querySelectorAll('.btn-view').forEach(btn =>
      btn.addEventListener('click', () => {
        const src = btn.dataset.src;
        if (!src) return alert('No image available');
        document.getElementById('modal-image').src = src;
        document.getElementById('image-modal').classList.add('active');
      })
    );

    document.querySelectorAll('.btn-apply').forEach(btn =>
      btn.addEventListener('click', async () => {
        const uid = Number(localStorage.getItem('userId'));
        if (!uid) {
          alert('Please log in first.');
          return window.location.href = 'login.html';
        }
        try {
          const res = await fetch(`${BACKEND_URL}/api/applications`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: uid,
              room_id: btn.dataset.roomId,
              status:  'Pending'
            })
          });
          if (!res.ok) throw new Error(res.statusText);
          alert('Application submitted!');
        } catch (err) {
          console.error('apply error:', err);
          alert('Failed to apply. Please try again.');
        }
      })
    );

  } catch (err) {
    console.error('loadRoomsPage error:', err);
    tbody.innerHTML = '<tr><td colspan="7">Error loading rooms.</td></tr>';
  }
}


async function loadApplicationsPage() {
  const ul = document.getElementById('applications-list');
  if (!ul) return;
  ul.innerHTML = '<li>Loading…</li>';
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const { applications = [] } = await res.json();

    ul.innerHTML = applications.length
      ? applications
          .map(a => `<li>Room: ${a.room} — ${a.status}</li>`)
          .join('')
      : '<li>No applications.</li>';

  } catch (e) {
    console.error('loadApplicationsPage error:', e);
    ul.innerHTML = '<li>Error loading.</li>';
  }
}

async function loadDashboardPage() {
  const token = localStorage.getItem('token');
  if (!token) return window.location = 'login.html';
  try {
    const res = await fetch(`${BACKEND_URL}/api/dashboard`, {
      headers:{ 'Authorization': `Bearer ${token}` }
    });
    const d = await res.json();
    document.getElementById('student-name').textContent  = d.profile?.name || 'N/A';
    document.getElementById('student-email').textContent = d.profile?.email    || 'N/A';
    document.getElementById('total-applications').textContent    = d.stats?.total    || 0;
    document.getElementById('pending-applications').textContent  = d.stats?.pending  || 0;
    document.getElementById('accepted-applications').textContent = d.stats?.accepted || 0;
    document.getElementById('rejected-applications').textContent = d.stats?.rejected || 0;

    const ar = document.getElementById('assigned-rooms-list');
    ar.innerHTML = (d.assignedRooms||[]).length
      ? d.assignedRooms.map(rm => `<li>${rm.room} @ ${rm.hostel}</li>`).join('')
      : '<li>No rooms assigned.</li>';

    const nl = document.getElementById('notifications-list');
    nl.innerHTML = (d.notifications||[]).length
      ? d.notifications.map(n => `<li>[${new Date(n.created_at).toLocaleString()}] ${n.message}</li>`).join('')
      : '<li>No notifications.</li>';
  } catch (e) {
    console.error('loadDashboardPage error:', e);
    alert('Failed to load dashboard.');
  }
}

// ─── AUTH HANDLERS ───────────────────────────────────────────────────────────
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const pwd   = document.getElementById('password').value.trim();
  if (!email || !pwd) {
    return alert('Fill both fields');
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password: pwd })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    const { token } = await res.json();
    localStorage.setItem('token', token);
    // decode JWT to get userId
    const payload = JSON.parse(atob(token.split('.')[1]));
    localStorage.setItem('userId', payload.id);
    window.location = 'dashboard.html';
  } catch (e) {
    console.error('Login error:', e);
    alert(`Login failed: ${e.message}`);
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name            = document.getElementById('name').value.trim();
  const email           = document.getElementById('email').value.trim();
  const phone           = document.getElementById('phone').value.trim();
  const password        = document.getElementById('password').value.trim();
  const confirmPassword = document.getElementById('confirm-password').value.trim();

  if (!name || !email || !phone || !password || !confirmPassword) {
    return alert('All fields required');
  }
  if (password !== confirmPassword) {
    return alert('Passwords must match');
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || res.statusText);
    }
    alert('Registered! Please log in.');
    window.location = 'login.html';
  } catch (e) {
    console.error('Register error:', e);
    alert(`Register failed: ${e.message}`);
  }
}

// ─── PAGE DISPATCHER ─────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  setupAuthLink();
  setupImageModal();

  const page = (location.pathname.split('/').pop()||'index.html').toLowerCase();
  switch (page) {
    case '':
    case 'index.html':
      await fetchAllData();
      renderIndex();
      document.getElementById('search-button')
        ?.addEventListener('click', renderIndex);
      document.getElementById('clear-search-button')
        ?.addEventListener('click', () => {
          ['search-location','search-amenities','search-min-price','search-max-price','search-max-occupancy']
            .forEach(id => document.getElementById(id).value = '');
          renderIndex();
        });
      break;

    case 'hostels.html':
      loadHostelsPage();
      break;

    case 'rooms.html':
      loadRoomsPage();
      break;

    case 'applications.html':
      loadApplicationsPage();
      break;

    case 'dashboard.html':
      loadDashboardPage();
      break;

    case 'login.html':
      document.getElementById('login-form')
        ?.addEventListener('submit', handleLogin);
      break;

    case 'register.html':
      document.getElementById('register-form')
        ?.addEventListener('submit', handleRegister);
      break;
  }
});
