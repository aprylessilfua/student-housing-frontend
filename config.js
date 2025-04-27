// pick up the URL from an env var (or from window.BACKEND_URL_OVERRIDE if set)
const BACKEND_URL = process.env.BACKEND_URL
                 || window.BACKEND_URL_OVERRIDE
                 || 'https://student-housing-backend.onrender.com';
