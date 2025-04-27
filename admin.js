// admin.js

// Change this to your new Render backend URL if needed
//const BACKEND_URL = 'https://student-housing-backend.onrender.com';
const BACKEND_URL = 'https://student-hostel-backend-bd96.onrender.com';
/**
 * Admin Auth Link
 * - Uses a separate 'adminToken' key in localStorage
 * - Shows Login when no adminToken
 * - Shows Logout (and clears adminToken) when present
 */
function setupAdminAuthLink() {
  const link = document.getElementById('admin-auth-link');
  if (!link) {
    console.error('Admin auth link element not found.');
    return;
  }
  const token = localStorage.getItem('adminToken');
  if (token) {
    link.textContent = 'Logout';
    link.href = '#';
    link.onclick = (event) => {
      event.preventDefault();
      localStorage.removeItem('adminToken');
      window.location.href = 'admin-login.html';
    };
  } else {
    link.textContent = 'Login';
    link.href = 'admin-login.html';
    link.onclick = null;
  }
}

/**
 * Generic Fetch with Error Handling
 * - Automatically injects the adminToken into Authorization header
 */
async function fetchWithErrorHandling(url, options = {}) {
  const token = localStorage.getItem('adminToken');
  options.headers = {
    ...(options.headers || {}),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    'Content-Type': options.body ? 'application/json' : undefined
  };
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} - ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    alert('Failed to load data. Please try again.');
    return null;
  }
}

// Modal Helpers
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'flex';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.style.display = 'none';
}

// ─── Hostels CRUD ────────────────────────────────────────────────────────────

// Load Hostels Data
async function loadHostelsAdmin() {
  const hostels = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels`);
  if (!hostels) return;

  const tbody = document.getElementById('hostels-table-body');
  if (!tbody) {
    console.error('Hostels table body element not found.');
    return;
  }
  tbody.innerHTML = '';

  hostels.forEach(h => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${h.id}</td>
      <td>${h.name}</td>
      <td>${h.description}</td>
      <td>${h.occupancy_limit}</td>
      <td><a href="${h.photo_url}" target="_blank" rel="noopener">View</a></td>
      <td>
        <button class="edit-hostel"   data-id="${h.id}">Edit</button>
        <button class="delete-hostel" data-id="${h.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Wire up Edit/Delete buttons
  document.querySelectorAll('.edit-hostel').forEach(btn =>
    btn.addEventListener('click', () => openHostelForm(btn.dataset.id))
  );
  document.querySelectorAll('.delete-hostel').forEach(btn =>
    btn.addEventListener('click', () => deleteHostel(btn.dataset.id))
  );
}

// Open (or reset) the Hostel form modal
async function openHostelForm(id = '') {
  // Clear all fields
  ['hostel-id','hostel-name','hostel-description','hostel-occupancy','hostel-photo']
    .forEach(f => {
      const el = document.getElementById(f);
      if (el) el.value = '';
    });

  if (id) {
    const hostel = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels/${id}`);
    if (!hostel) return;
    document.getElementById('hostel-id').value          = hostel.id;
    document.getElementById('hostel-name').value        = hostel.name;
    document.getElementById('hostel-description').value = hostel.description;
    document.getElementById('hostel-occupancy').value   = hostel.occupancy_limit;
    document.getElementById('hostel-photo').value       = hostel.photo_url;
  }

  openModal('hostel-form-modal');
}

// Save (Create or Update) Hostel
async function saveHostel(event) {
  event.preventDefault();
  const id = document.getElementById('hostel-id').value;

  const payload = {
    name:            document.getElementById('hostel-name').value.trim(),
    description:     document.getElementById('hostel-description').value.trim(),
    occupancy_limit: Number(document.getElementById('hostel-occupancy').value),
    photo_url:       document.getElementById('hostel-photo').value.trim()
  };

  const url    = id
    ? `${BACKEND_URL}/api/hostels/${id}`
    : `${BACKEND_URL}/api/hostels`;
  const method = id ? 'PUT' : 'POST';

  const result = await fetchWithErrorHandling(url, {
    method,
    body: JSON.stringify(payload)
  });

  if (result) {
    closeModal('hostel-form-modal');
    loadHostelsAdmin();
  }
}

// Delete Hostel
async function deleteHostel(id) {
  if (!confirm('Are you sure you want to delete this hostel?')) return;
  const result = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels/${id}`, {
    method: 'DELETE'
  });
  if (result) loadHostelsAdmin();
}

// ─── Page Initialization ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setupAdminAuthLink();
  const raw = location.pathname;
  const page = raw.split('/').pop().toLowerCase();
  console.log('[admin.js] running on page:', page);

  if (page.includes('hostels')) {
    loadHostelsAdmin();
    // …wire up hostels form…
  }
  if (page.includes('rooms')) {
    loadRoomsAdmin();
    // …wire up rooms form…
  }
  if (page.includes('students')) {
    loadStudentsAdmin();
  }
  if (page.includes('applications')) {
    loadApplicationsAdmin();
  }
  if (page.includes('notifications')) {
    loadNotificationsAdmin();
    document.getElementById('notification-form')
      ?.addEventListener('submit', sendNotification);
  }
});
