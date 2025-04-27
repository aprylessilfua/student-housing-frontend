// app.js
const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// —— Helpers for modal & logout ——
function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

function setupLogout() {
  const link = document.getElementById('logout-link');
  if (link) {
    link.onclick = () => {
      localStorage.clear(); // Clears all stored data
      alert('You have been logged out.');
      window.location.href = 'login.html'; // Redirect to login page
    };
  }
}

function setupModal() {
  const modal = document.getElementById('image-modal');
  document.getElementById('modal-close')?.addEventListener('click', () => closeModal('image-modal'));
  modal?.addEventListener('click', e => {
    if (e.target === modal) closeModal('image-modal');
  });
}

// —— Shared caches for index page ——
let allHostels = [], allRooms = [];

// Fetch once for index
async function fetchAll() {
  try {
    const [hRes, rRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/hostels`),
      fetch(`${BACKEND_URL}/api/rooms`)
    ]);
    allHostels = await hRes.json();
    allRooms = await rRes.json();
  } catch (err) {
    console.error('fetchAll error:', err);
  }
}

// —— INDEX: columns + nested rooms + filters ——
function renderIndex() {
  const container = document.getElementById('hostels-container');
  if (!container) return;

  // read filter inputs
  const locQ = document.getElementById('search-location')?.value.trim().toLowerCase() || '';
  const amQ = document.getElementById('search-amenities')?.value.trim().toLowerCase() || '';
  const minP = Number(document.getElementById('search-min-price')?.value);
  const maxP = Number(document.getElementById('search-max-price')?.value);
  const maxO = Number(document.getElementById('search-max-occupancy')?.value);

  // filter rooms
  const roomsFiltered = allRooms.filter(r => {
    const d = (r.description || '').toLowerCase();
    return (!minP || r.price >= minP)
        && (!maxP || r.price <= maxP)
        && (!maxO || r.occupancy_limit <= maxO)
        && (!amQ || d.includes(amQ));
  });

  container.innerHTML = '';
  allHostels.forEach(h => {
    const addr = (h.address || '').toLowerCase();
    const desc = (h.description || '').toLowerCase();
    if (locQ && !addr.includes(locQ)) return;
    if (amQ && !desc.includes(amQ)) return;

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

  // Attach handlers
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
          headers: { 'Content-Type': 'application/json' },
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
      if (!src) return alert('No image.');
      document.getElementById('modal-image').src = src;
      openModal('image-modal');
    };
  });
}

// —— LOGIN & REGISTER ——
async function login(event) {
  event.preventDefault();
  const email = document.getElementById('email')?.value.trim();
  const pwd = document.getElementById('password')?.value.trim();
  if (!email || !pwd) return alert('Please fill in both email and password.');

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    alert('Login successful.');
    window.location.href = 'dashboard.html';
  } catch (error) {
    console.error('Login error:', error);
    alert(`Error: ${error.message}`);
  }
}

async function register(event) {
  event.preventDefault();
  const username = document.getElementById('name')?.value.trim();
  const email = document.getElementById('email')?.value.trim();
  const phone = document.getElementById('phone')?.value.trim();
  const pwd = document.getElementById('password')?.value.trim();
  const conf = document.getElementById('confirm-password')?.value.trim();
  if (!username || !email || !phone || !pwd || !conf) return alert('All fields required');
  if (pwd !== conf) return alert('Passwords must match');

  try {
    const res = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, phone, password: pwd })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    alert('Registration successful!');
    window.location.href = 'login.html';
  } catch (e) {
    console.error(e);
    alert(`Registration failed: ${e.message}`);
  }
}

// —— PAGE DISPATCHER ——
window.addEventListener('DOMContentLoaded', async () => {
  setupLogout();
  setupModal();

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

  if (page === '' || page === 'index.html') {
    await fetchAll();
    renderIndex();
    document.getElementById('search-button')?.addEventListener('click', renderIndex);
    document.getElementById('clear-search-button')?.addEventListener('click', () => {
      ['search-location', 'search-amenities', 'search-min-price', 'search-max-price', 'search-max-occupancy']
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      renderIndex();
    });
  }
  if (page === 'hostels.html') await loadHostels();
  if (page === 'rooms.html') await loadRooms();
  if (page === 'applications.html') await loadApplicationsPage();
  if (page === 'dashboard.html') await loadDashboardPage();
  if (page === 'login.html') document.getElementById('login-form')?.addEventListener('submit', login);
  if (page === 'register.html') document.getElementById('register-form')?.addEventListener('submit', register);
});
