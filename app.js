// app.js

const BACKEND_URL = 'https://student-housing-backend.onrender.com';

/** Modal Helpers **/
function openModal(id)  { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

/** Data caches **/
let allHostels = [];
let allRooms   = [];

/** Fetch master data **/
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

/** Render hostels **/
function renderHostels(list) {
  const container = document.getElementById('hostels-list');
  container.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = '<p>No hostels found.</p>';
    return;
  }
  list.forEach(h => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${h.name}</h3>
      ${h.address ? `<p><strong>Address:</strong> ${h.address}</p>` : ''}
      <p>${h.description}</p>
      <p><strong>Occupancy:</strong> ${h.occupancy_limit}</p>
      <button class="view-image" data-image="${h.photo_url || ''}">View</button>
    `;
    if (h.photo_url) {
      const img = document.createElement('img');
      img.src = h.photo_url;
      img.alt = h.name;
      card.appendChild(img);
    }
    container.appendChild(card);
  });
  attachImageHandlers();
}

/** Render rooms **/
function renderRooms(list) {
  const container = document.getElementById('rooms-list');
  container.innerHTML = '';
  if (!Array.isArray(list) || list.length === 0) {
    container.innerHTML = '<p>No rooms found.</p>';
    return;
  }
  list.forEach(r => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${r.name}</h3>
      <p>${r.description}</p>
      <p><strong>Price:</strong> $${r.price}</p>
      <p><strong>Occupancy:</strong> ${r.occupancy_limit}</p>
      <button class="view-image" data-image="${r.photo_url || ''}">View</button>
    `;
    if (r.photo_url) {
      const img = document.createElement('img');
      img.src = r.photo_url;
      img.alt = r.name;
      card.appendChild(img);
    }
    container.appendChild(card);
  });
  attachImageHandlers();
}

/** Attach click handlers to all .view-image buttons **/
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

/** Close modal on close-button or backdrop click **/
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('modal-close').onclick = () => closeModal('image-modal');
  document.getElementById('image-modal').onclick = e => {
    if (e.target.id === 'image-modal') closeModal('image-modal');
  };
});

/** Apply search filters **/
function filterAndRender() {
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

  renderHostels(filteredHostels);
  renderRooms(filteredRooms);
}

/** Clear filters **/
function clearFilters() {
  ['search-location','search-amenities','search-max-price','search-max-occupancy']
    .forEach(id => document.getElementById(id).value = '');
  renderHostels(allHostels);
  renderRooms(allRooms);
}

/** Initial load & event bindings **/
window.addEventListener('DOMContentLoaded', async () => {
  await fetchMasterData();
  renderHostels(allHostels);
  renderRooms(allRooms);

  document.getElementById('search-button').onclick = filterAndRender;
  document.getElementById('clear-search-button').onclick = clearFilters;

  document.getElementById('logout-link').onclick = () => {
    localStorage.clear();
    window.location.href = 'index.html';
  };
});
