const BACKEND_URL = 'https://student-hostel-backend-bd96.onrender.com';
//const BACKEND_URL = 'https://student-housing-backend.onrender.com';

// Admin Auth Link
function setupAdminAuthLink() {
  const link = document.getElementById('admin-auth-link');
  if (!link) {
    console.error('Admin auth link element not found.');
    return;
  }
  const token = localStorage.getItem('token');
  if (token) {
    link.textContent = 'Logout';
    link.href = '#';
    link.onclick = (event) => {
      event.preventDefault();
      localStorage.clear();
      window.location.href = 'login.html';
    };
  } else {
    link.textContent = 'Login';
    link.href = 'login.html';
    link.onclick = null;
  }
}

// Generic Fetch with Error Handling
async function fetchWithErrorHandling(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error);
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
  hostels.forEach((h) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${h.id}</td>
      <td>${h.name}</td>
      <td>${h.description}</td>
      <td>${h.occupancy_limit}</td>
      <td><a href="${h.photo_url}" target="_blank" rel="noopener noreferrer">View</a></td>
      <td>
        <button class="edit-hostel" data-id="${h.id}">Edit</button>
        <button class="delete-hostel" data-id="${h.id}">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  document.querySelectorAll('.edit-hostel').forEach((btn) =>
    btn.addEventListener('click', () => openHostelForm(btn.dataset.id))
  );
  document.querySelectorAll('.delete-hostel').forEach((btn) =>
    btn.addEventListener('click', () => deleteHostel(btn.dataset.id))
  );
}

// Open Hostel Form
async function openHostelForm(id = '') {
  const formFields = ['hostel-id', 'hostel-name', 'hostel-description', 'hostel-occupancy', 'hostel-photo'];
  formFields.forEach((field) => {
    const input = document.getElementById(field);
    if (input) input.value = '';
  });

  if (id) {
    const hostel = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels/${id}`);
    if (!hostel) return;
    document.getElementById('hostel-id').value = hostel.id;
    document.getElementById('hostel-name').value = hostel.name;
    document.getElementById('hostel-description').value = hostel.description;
    document.getElementById('hostel-occupancy').value = hostel.occupancy_limit;
    document.getElementById('hostel-photo').value = hostel.photo_url;
  }
  openModal('hostel-form-modal');
}

// Save Hostel
async function saveHostel(e) {
  e.preventDefault();
  const id = document.getElementById('hostel-id').value;
  const payload = {
    name: document.getElementById('hostel-name').value.trim(),
    description: document.getElementById('hostel-description').value.trim(),
    occupancy_limit: Number(document.getElementById('hostel-occupancy').value),
    photo_url: document.getElementById('hostel-photo').value.trim(),
  };
  const url = id ? `${BACKEND_URL}/api/hostels/${id}` : `${BACKEND_URL}/api/hostels`;
  const method = id ? 'PUT' : 'POST';
  const result = await fetchWithErrorHandling(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (result) {
    closeModal('hostel-form-modal');
    loadHostelsAdmin();
  }
}

// Delete Hostel
async function deleteHostel(id) {
  if (!confirm('Are you sure you want to delete this hostel?')) return;
  const result = await fetchWithErrorHandling(`${BACKEND_URL}/api/hostels/${id}`, { method: 'DELETE' });
  if (result) loadHostelsAdmin();
}

// Page Initialization
window.addEventListener('DOMContentLoaded', () => {
  setupAdminAuthLink();

  const path = location.pathname.split('/').pop().toLowerCase();
  if (path === 'admin-hostels.html') {
    loadHostelsAdmin();
    document.getElementById('create-hostel-button')?.addEventListener('click', () => openHostelForm());
    document.getElementById('hostel-form')?.addEventListener('submit', saveHostel);
    document.getElementById('hostel-form-cancel')?.addEventListener('click', (e) => {
      e.preventDefault();
      closeModal('hostel-form-modal');
    });
  }
});
