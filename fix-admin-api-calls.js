const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'pages/AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all occurrences of the old pattern
content = content.replace(
  /const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001\/api';\s*const token = localStorage\.getItem\('menupi_user'\) \? JSON\.parse\(localStorage\.getItem\('menupi_user'\)!\)\.token : '';\s*/g,
  'const API_BASE = getApiBase();\n            const headers = getApiHeaders(true);\n            \n            '
);

// Replace API_URL with API_BASE in fetch calls
content = content.replace(/\$\{API_URL\}\/admin/g, '${API_BASE}/api/admin');

// Replace old headers pattern
content = content.replace(
  /headers: \{ 'Authorization': `Bearer \$\{token\}` \}/g,
  'headers'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed all API calls in AdminDashboard.tsx');

