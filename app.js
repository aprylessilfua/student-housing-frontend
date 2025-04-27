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

// Render hostels with nested rooms
function renderHostels() {
  const container = document.getElementById('hostels-container');
  container.innerHTML = '';

  if (!Array.isArray(allHostels) || allHostels.length === 0) {
    container.innerHTML = '<p>No hostels found.</p>';
    return;
  }

  allHostels.forEach(h => {
    const col = document.createElement('div');
    col.className = 'hostel-column';

    // Find rooms belonging to this hostel
    const rooms = Array.isArray(allRooms)
      ? allRooms.filter(r => r.hostel_id === h.id)
      : [];

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

// Setup modal close & logout
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

// Init on load
window.addEventListener('DOMContentLoaded', async () => {
  await fetchData();
  renderHostels();
});
