// app.js

const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// Modal helpers
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

// Data stores
let allHostels = [];
let allRooms   = [];

// Fetch hostels & rooms from API
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

// Render hostels with nested, filtered rooms
function renderHostels() {
  const container = document.getElementById('hostels-container');
  container.innerHTML = '';

  // Read filter inputs
  const locQ    = document.getElementById('search-location').value.trim().toLowerCase();
  const amQ     = document.getElementById('search-amenities').value.trim().toLowerCase();
  const minP    = Number(document.getElementById('search-min-price').value);
  const maxP    = Number(document.getElementById('search-max-price').value);
  const maxO    = Number(document.getElementById('search-max-occupancy').value);

  // Pre-filter rooms
  const roomsFiltered = allRooms.filter(r => {
    const desc = (r.description||'').toLowerCase();
    return (
      (!minP || r.price >= minP) &&
      (!maxP || r.price <= maxP) &&
      (!maxO || r.occupancy_limit <= maxO) &&
      (!amQ  || desc.includes(amQ))
    );
  });

  // Filter and render each hostel
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
      : '<p>No matching rooms.</p>';

    col.innerHTML = `
      <h3>${h.name}</h3>
      <p>${h.description}</p>
      <div class="rooms-list">${roomsHTML}</div>
    `;
    container.appendChild(col);
  });

  attachRoomHandlers();
}

// Attach Apply & View button handlers
function attachRoomHandlers() {
  document.querySelectorAll('.apply-room').forEach(btn => {
    btn.onclick = async () => {
      const userId = Number(localStorage.getItem('userId'));
      if (!userId) {
        alert('Please log in.');
        return window.location.href = 'login.html';
      }
      try {
        const res = await fetch(`${BACKEND_URL}/api/applications`, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
            user_id: userId,
            room_id: Number(btn.dataset.id),
            status: 'Pending'
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
      if (!src) return alert('No image.');
      document.getElementById('modal-image').src = src;
      openModal('image-modal');
    };
  });
}

// Setup modal close & logout on DOM ready
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

// Initialize on load
window.addEventListener('DOMContentLoaded', async () => {
  await fetchData();
  renderHostels();
  document.getElementById('search-button').onclick = renderHostels;
  document.getElementById('clear-search-button').onclick = () => {
    ['search-location','search-amenities','search-min-price','search-max-price','search-max-occupancy']
      .forEach(id => document.getElementById(id).value = '');
    renderHostels();
  };
});
