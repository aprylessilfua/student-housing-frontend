// config.js

// 1) Your live backend URL
const REAL_BACKEND_URL = 'https://student-hostel-backend-bd96.onrender.com';

// 2) (Optional) Allow override via a global before this script loads
const OVERRIDE = window.BACKEND_URL_OVERRIDE;

// 3) Expose a single reliable global for all your scripts
window.BACKEND_URL = OVERRIDE || REAL_BACKEND_URL;
