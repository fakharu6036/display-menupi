import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, 'pages/AdminDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern 1: Replace API_URL and token declaration
content = content.replace(
  /const API_URL = import\.meta\.env\.VITE_API_URL \|\| 'http:\/\/localhost:3001\/api';\s*const token = localStorage\.getItem\('menupi_user'\) \? JSON\.parse\(localStorage\.getItem\('menupi_user'\)!\)\.token : '';\s*/g,
  'const API_BASE = getApiBase();\n            const headers = getApiHeaders(true);\n            \n            '
);

// Pattern 2: Replace ${API_URL}/admin with ${API_BASE}/api/admin
content = content.replace(/\$\{API_URL\}\/admin/g, '${API_BASE}/api/admin');

// Pattern 3: Replace headers object with just headers
content = content.replace(
  /headers:\s*\{\s*['"]Authorization['"]:\s*`Bearer \$\{token\}`\s*\}/g,
  'headers'
);

// Pattern 4: Replace headers with Authorization and Content-Type
content = content.replace(
  /headers:\s*\{\s*['"]Content-Type['"]:\s*['"]application\/json['"],\s*['"]Authorization['"]:\s*`Bearer \$\{token\}`\s*\}/g,
  'headers'
);

// Pattern 5: Replace headers with Content-Type, Authorization (any order)
content = content.replace(
  /headers:\s*\{\s*['"]Authorization['"]:\s*`Bearer \$\{token\}`,\s*['"]Content-Type['"]:\s*['"]application\/json['"]\s*\}/g,
  'headers'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed all API calls in AdminDashboard.tsx');

