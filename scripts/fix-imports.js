const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('from "@/lib/pris"')) {
      content = content.replace(/from "@\/lib\/pris"/g, 'from "@/lib/prisma"');
      fs.writeFileSync(filePath, content);
      console.log('Updated:', filePath);
    }
  } catch (err) {
    console.error('Error:', filePath, err.message);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath);
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      replaceInFile(filePath);
    }
  });
}

walkDir(path.join(__dirname, '..', 'src'));