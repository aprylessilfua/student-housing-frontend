// app.js

const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// Modal helpers
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Data stores
let allHostels = [];
let allRooms   = [];

// Fetch data from backend
async function fetchData() {
  try {
    const [hRes, rRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/hostels`),
      fetch(`${BACKEND_URL}/api/rooms`)
    ]);
    allHostels = await hRes.json();
    allRooms   = await rRes.json();
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

// Render hostels each with nested rooms
function renderHostels(filteredHostels, filteredRooms) {
  const container = document.getElementById('hostels-container');
  container.innerHTML = '';

  if (!Array.isArray(filteredHostels) || filteredHostels.length === 0) {
    container.innerHTML = '<p>No hostels found.</p>';
    return;
  }

  filteredHostels.forEach(h => {
    const col = document.createElement('div');
    col.className = 'hostel-column';

    // Filter rooms for this hostel
    const rooms = filteredRooms.filter(r => r.hostel_id === h.id);

    // Build rooms HTML
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

// Attach Apply & View handlers
function attachRoomHandlers() {
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
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            user_id: userId,
            room_id: Number(btn.dataset.id),
            status:  'Pending'
          })
        });
        if (!res.ok) throw new Error('Apply failed');
        alert('Application submitted!');
      } catch (err) {
        console.error(err);
        alert('Error submitting application.');
      }
    };
  });

  document.querySelectorAll('.view-image').forEach(btn => {
    btn.onclick = () => {
      const src = btn.dataset.src;
      if (!src) return alert('No image available');
      document.getElementById('modal-image').src = src;
      openModal('image-modal');
    };
  });
}

// Close modal on backdrop or button
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-close').onclick = () => closeModal('image-modal');
  document.getElementById('image-modal').onclick = e => {
    if (e.target.id === 'image-modal') closeModal('image-modal');
  };
  document.getElementById('logout-link').onclick = () => {
    localStorage.clear();
    window.location.href = 'index.html';
  };
});

// Filtering logic
function applyFilters() {
  const locQ = document.getElementById('search-location').value.trim().toLowerCase();
  const amQ  = document.getElementById('search-amenities').value.trim().toLowerCase();
  const maxP = Number(document.getElementById('search-max-price').value);
  const maxO = Number(document.getElementById('search-max-occupancy').value);

  const filteredHostels = allHostels.filter(h =>
    (!locQ || (h.address||'').toLowerCase().includes(locQ)) &&
    (!amQ  || (h.description||'').toLowerCase().includes(amQ))
  );
  const filteredRooms = allRooms.filter(r =>
    (!maxP || r.price <= maxP) &&
    (!maxO || r.occupancy_limit <= maxO) &&
    (!amQ  || (r.description||'').toLowerCase().includes(amQ))
  );

  renderHostels(filteredHostels, filteredRooms);
}

// Clear filters
function clearFilters() {
  ['search-location','search-amenities','search-max-price','search-max-occupancy']
    .forEach(id => document.getElementById(id).value = '');
  renderHostels(allHostels, allRooms);
}

// Init on load
window.addEventListener('DOMContentLoaded', async () => {
  await fetchData();
  renderHostels(allHostels, allRooms);
  document.getElementById('search-button').onclick      = applyFilters;
  document.getElementById('clear-search-button').onclick = clearFilters;
});
