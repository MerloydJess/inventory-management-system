const fs = require('fs');
const path = require('path');

console.log("=".repeat(60));
console.log("PATH DIAGNOSTICS FOR PRODUCTION BUILD");
console.log("=".repeat(60));
console.log("");

console.log("Current paths:");
console.log("  __dirname:", __dirname);
console.log("  process.cwd():", process.cwd());
console.log("  process.execPath:", process.execPath);
console.log("");

console.log("Checking for build folder in possible locations:");
console.log("");

const possibleBuildPaths = [
  path.join(__dirname, 'build'),
  path.join(__dirname, '..', 'build'),
  path.join(process.cwd(), 'build'),
  path.join(path.dirname(process.execPath), 'build'),
  path.join(path.dirname(process.execPath), 'resources', 'app', 'build')
];

possibleBuildPaths.forEach((p, index) => {
  const exists = fs.existsSync(p);
  const symbol = exists ? '✓' : '✗';
  console.log(`${index + 1}. ${symbol} ${p}`);
  
  if (exists) {
    console.log(`   Contents:`);
    const files = fs.readdirSync(p);
    files.forEach(f => {
      const isDir = fs.statSync(path.join(p, f)).isDirectory();
      console.log(`     ${isDir ? '📁' : '📄'} ${f}`);
    });
    console.log("");
  }
});

console.log("");
console.log("Checking for server.js:");
const possibleServerPaths = [
  path.join(__dirname, 'server.js'),
  path.join(__dirname, '..', 'server.js'),
  path.join(process.cwd(), 'server.js')
];

possibleServerPaths.forEach((p, index) => {
  const exists = fs.existsSync(p);
  const symbol = exists ? '✓' : '✗';
  console.log(`${index + 1}. ${symbol} ${p}`);
});

console.log("");
console.log("=".repeat(60));
