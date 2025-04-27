// app.js

const BACKEND_URL = 'https://student-housing-backend.onrender.com';

/** Modal Helpers **/
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

/** Data stores **/
let allHostels = [];
let allRooms   = [];
let hostelsToShow = [];
let roomsToShow   = [];

/** Fetch and cache hostels & rooms **/
async function fetchMasterData() {
  try {
    const [hRes, rRes] = await Promise.all([
      fetch(`${BACKEND_URL}/api/hostels`),
      fetch(`${BACKEND_URL}/api/rooms`)
    ]);
    allHostels = await hRes.json();
    allRooms   = await rRes.json();
    // initialize filters
    hostelsToShow = allHostels;
    roomsToShow   = allRooms;
  } catch (err) {
    console.error('Error fetching data:', err);
  }
}

/** Render hostels each with nested rooms **/
function renderHostelsWithRooms() {
  const container = document.getElementById('hostels-container');
  container.innerHTML = '';
  if (!Array.isArray(hostelsToShow) || hostelsToShow.length === 0) {
    container.innerHTML = '<p>No hostels found.</p>';
    return;
  }
  hostelsToShow.forEach(h => {
    const col = document.createElement('div');
    col.className = 'hostel-column';
    // Nested rooms for this hostel
    const related = roomsToShow.filter(r => r.hostel_id === h.id);
    const roomsHTML = related.length
      ? related.map(r => `
          <div class="room-card">
            <h4>${r.name}</h4>
            <p>Price: $${r.price}</p>
            <p>Occupancy: ${r.occupancy_limit}</p>
            <button class="apply-room" data-room-id="${r.id}">Apply</button>
            ${r.photo_url ? `<button class="view-image" data-image="${r.photo_url}">View</button>` : ''}
          </div>
        `).join('')
      : `<p>No rooms available.</p>`;

    col.innerHTML = `
      <h3>${h.name}</h3>
      ${h.address ? `<p><strong>Address:</strong> ${h.address}</p>` : ''}
      <p>${h.description}</p>
      <div class="rooms-list">${roomsHTML}</div>
    `;
    container.appendChild(col);
  });
  attachImageHandlers();
  attachApplyHandlers();
}

/** Attach handlers to “View” buttons **/
function attachImageHandlers() {
  document.querySelectorAll('.view-image').forEach(btn => {
    btn.onclick = () => {
      const src = btn.dataset.image;
      if (!src) return;
      document.getElementById('modal-image').src = src;
      openModal('image-modal');
    };
  });
}

/** Attach handlers to “Apply” buttons **/
function attachApplyHandlers() {
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
            room_id: Number(btn.dataset.roomId),
            status: 'Pending'
          })
        });
        if (!res.ok) throw new Error('Apply failed');
        alert('Application submitted!');
      } catch (err) {
        console.error('Apply error:', err);
        alert('Failed to apply.');
      }
    };
  });
}

/** Filter logic **/
function filterAndRender() {
  const locQ = document.getElementById('search-location').value.trim().toLowerCase();
  const amQ  = document.getElementById('search-amenities').value.trim().toLowerCase();
  const maxP = Number(document.getElementById('search-max-price').value);
  const maxO = Number(document.getElementById('search-max-occupancy').value);

  hostelsToShow = allHostels.filter(h =>
    (!locQ || (h.address||'').toLowerCase().includes(locQ)) &&
    (!amQ  || (h.description||'').toLowerCase().includes(amQ))
  );
  roomsToShow = allRooms.filter(r =>
    (!maxP || r.price <= maxP) &&
    (!maxO || r.occupancy_limit <= maxO) &&
    (!amQ  || (r.description||'').toLowerCase().includes(amQ))
  );
  renderHostelsWithRooms();
}

/** Clear filters **/
function clearFilters() {
  ['search-location','search-amenities','search-max-price','search-max-occupancy']
    .forEach(id => document.getElementById(id).value = '');
  hostelsToShow = allHostels;
  roomsToShow   = allRooms;
  renderHostelsWithRooms();
}

// — Modal close handlers —
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-close').onclick = () => closeModal('image-modal');
  document.getElementById('image-modal').onclick = e => {
    if (e.target.id === 'image-modal') closeModal('image-modal');
  };
});

// — Init on page load —
window.addEventListener('DOMContentLoaded', async () => {
  // Fetch data → render
  await fetchMasterData();
  renderHostelsWithRooms();

  // Bind UI controls
  document.getElementById('search-button').onclick      = filterAndRender;
  document.getElementById('clear-search-button').onclick = clearFilters;
  document.getElementById('logout-link').onclick        = () => {
    localStorage.clear();
    window.location.href = 'index.html';
  };
});
