// app.js

const BACKEND_URL = 'https://student-housing-backend.onrender.com';

/**
 * Load and render all hostels
 */
async function loadHostels() {
  const list = document.getElementById('hostels-list');
  if (!list) return;
  list.innerHTML = '<li>Loading hostels…</li>';
  try {
    const res = await fetch(`${BACKEND_URL}/api/hostels`);
    if (!res.ok) throw new Error(`Hostels API ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid hostels payload');
    if (data.length === 0) {
      list.innerHTML = '<li>No hostels available.</li>';
      return;
    }
    list.innerHTML = '';
    data.forEach(h => {
      const li = document.createElement('li');
      // your GET /api/hostels returns { id, name, description, occupancy_limit, photo_url }
      li.textContent = `${h.name} – ${h.description}`;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading hostels:', err);
    list.innerHTML = '<li>Error loading hostels.</li>';
  }
}

/**
 * Load and render all rooms
 */
async function loadRooms() {
  const list = document.getElementById('rooms-list');
  if (!list) return;
  list.innerHTML = '<li>Loading rooms…</li>';
  try {
    const res = await fetch(`${BACKEND_URL}/api/rooms`);
    if (!res.ok) throw new Error(`Rooms API ${res.status}`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Invalid rooms payload');
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
      `;
      list.appendChild(li);
    });
  } catch (err) {
    console.error('Error loading rooms:', err);
    list.innerHTML = '<li>Error loading rooms.</li>';
  }
}

// … your existing login(), register(), dashboard(), etc. …

// Attach on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  // on index.html, hostels.html
  loadHostels();
  // on index.html, rooms.html
  loadRooms();

  // your existing listeners
  document.getElementById('login-form')?.addEventListener('submit', login);
  document.getElementById('register-form')?.addEventListener('submit', register);
});
