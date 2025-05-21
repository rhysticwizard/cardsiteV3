const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Full path to git executable
const GIT_PATH = 'C:\\Program Files\\Git\\bin\\git.exe';
const BUILD_DIR = path.join(process.cwd(), 'build');

try {
  console.log('Starting deployment to GitHub Pages...');
  
  // Make sure the build folder exists
  if (!fs.existsSync(BUILD_DIR)) {
    throw new Error('Build directory does not exist. Run npm run build first.');
  }

  // Create a temporary directory for the gh-pages branch
  const tempDir = path.join(process.cwd(), 'temp_deploy');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir);

  // Initialize a new git repo in the temp directory
  process.chdir(tempDir);
  execSync(`"${GIT_PATH}" init`);
  execSync(`"${GIT_PATH}" checkout -b gh-pages`);
  
  // Copy all files from build directory to the temp directory
  const files = fs.readdirSync(BUILD_DIR);
  files.forEach(file => {
    fs.cpSync(path.join(BUILD_DIR, file), path.join(tempDir, file), { recursive: true });
  });
  
  // Setup the remote
  execSync(`"${GIT_PATH}" remote add origin https://github.com/rhysticwizard/cardsiteV3.git`);
  
  // Commit all files
  execSync(`"${GIT_PATH}" add .`);
  execSync(`"${GIT_PATH}" commit -m "Deploy to GitHub Pages"`);
  
  // Force push to gh-pages branch
  execSync(`"${GIT_PATH}" push origin gh-pages -f`);
  
  console.log('Successfully deployed to GitHub Pages!');
  
  // Clean up
  process.chdir(process.cwd());
  fs.rmSync(tempDir, { recursive: true, force: true });
  
} catch (error) {
  console.error('Deployment failed:', error.message);
  console.error(error.stdout?.toString() || '');
  console.error(error.stderr?.toString() || '');
  process.exit(1);
} 