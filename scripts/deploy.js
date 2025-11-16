#!/usr/bin/env node

/**
 * Firebase Backend Deployment Script (Node.js version)
 * This script deploys Firestore rules, indexes, and Cloud Functions to Firebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printInfo(message) {
  print(`ℹ ${message}`, 'blue');
}

function printSuccess(message) {
  print(`✓ ${message}`, 'green');
}

function printWarning(message) {
  print(`⚠ ${message}`, 'yellow');
}

function printError(message) {
  print(`✗ ${message}`, 'red');
}

function execCommand(command, options = {}) {
  try {
    execSync(command, { 
      stdio: 'inherit', 
      ...options 
    });
    return true;
  } catch (error) {
    return false;
  }
}

function checkFirebaseCLI() {
  try {
    execSync('firebase --version', { stdio: 'ignore' });
    return true;
  } catch {
    printError('Firebase CLI is not installed. Please install it with: npm install -g firebase-tools');
    return false;
  }
}

function checkFirebaseLogin() {
  try {
    execSync('firebase projects:list', { stdio: 'ignore' });
    return true;
  } catch {
    printWarning('You may not be logged in to Firebase. Please run: firebase login');
    return false;
  }
}

function getCurrentProject() {
  try {
    const output = execSync('firebase use', { encoding: 'utf-8' });
    const match = output.match(/\(([^)]+)\)/);
    return match ? match[1] : 'default';
  } catch {
    return 'default';
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    rules: false,
    storage: false,
    indexes: false,
    functions: false,
    project: null,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--rules':
        options.rules = true;
        break;
      case '--storage':
        options.storage = true;
        break;
      case '--indexes':
        options.indexes = true;
        break;
      case '--functions':
        options.functions = true;
        break;
      case '--project':
        options.project = args[++i];
        break;
      case '--help':
        options.help = true;
        break;
      default:
        printError(`Unknown option: ${args[i]}`);
        print('Use --help for usage information');
        process.exit(1);
    }
  }

  const deployAll = !options.rules && !options.storage && !options.indexes && !options.functions;

  return { ...options, deployAll };
}

function showHelp() {
  console.log('Usage: node scripts/deploy.js [OPTIONS]');
  console.log('');
  console.log('Options:');
  console.log('  --rules       Deploy only Firestore rules');
  console.log('  --storage     Deploy only Storage rules');
  console.log('  --indexes     Deploy only Firestore indexes');
  console.log('  --functions   Deploy only Cloud Functions');
  console.log('  --project ID  Specify Firebase project ID');
  console.log('  --help        Show this help message');
  console.log('');
  console.log('If no options are specified, all resources will be deployed.');
}

async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  // Check prerequisites
  if (!checkFirebaseCLI()) {
    process.exit(1);
  }

  if (!checkFirebaseLogin()) {
    process.exit(1);
  }

  // Set project if specified
  if (options.project) {
    printInfo(`Using Firebase project: ${options.project}`);
    if (!execCommand(`firebase use ${options.project}`)) {
      printError('Failed to set Firebase project');
      process.exit(1);
    }
  }

  const currentProject = getCurrentProject();
  printInfo(`Current Firebase project: ${currentProject}`);

  // Confirm deployment
  if (options.deployAll) {
    printWarning('This will deploy:');
    console.log('  - Firestore rules');
    console.log('  - Storage rules');
    console.log('  - Firestore indexes');
    console.log('  - Cloud Functions');
    console.log('');
    
    // In a real implementation, you might want to use readline for user input
    // For now, we'll proceed automatically
    printInfo('Proceeding with deployment...');
  }

  let success = true;

  // Deploy Firestore rules
  if (options.deployAll || options.rules) {
    printInfo('Deploying Firestore rules...');
    if (execCommand('firebase deploy --only firestore:rules')) {
      printSuccess('Firestore rules deployed successfully');
    } else {
      printError('Failed to deploy Firestore rules');
      success = false;
    }
  }

  // Deploy Storage rules
  if (options.deployAll || options.storage) {
    printInfo('Deploying Storage rules...');
    if (execCommand('firebase deploy --only storage')) {
      printSuccess('Storage rules deployed successfully');
    } else {
      printError('Failed to deploy Storage rules');
      success = false;
    }
  }

  // Deploy Firestore indexes
  if (options.deployAll || options.indexes) {
    printInfo('Deploying Firestore indexes...');
    if (execCommand('firebase deploy --only firestore:indexes')) {
      printSuccess('Firestore indexes deployed successfully');
    } else {
      printError('Failed to deploy Firestore indexes');
      success = false;
    }
  }

  // Deploy Cloud Functions
  if (options.deployAll || options.functions) {
    printInfo('Building Cloud Functions...');
    const functionsDir = path.join(process.cwd(), 'functions');
    if (execCommand('npm run build', { cwd: functionsDir })) {
      printSuccess('Functions built successfully');
    } else {
      printError('Failed to build functions');
      success = false;
    }

    if (success) {
      printInfo('Deploying Cloud Functions...');
      if (execCommand('firebase deploy --only functions')) {
        printSuccess('Cloud Functions deployed successfully');
      } else {
        printError('Failed to deploy Cloud Functions');
        success = false;
      }
    }
  }

  if (success) {
    printSuccess('Deployment completed successfully!');
  } else {
    printError('Deployment completed with errors');
    process.exit(1);
  }
}

main().catch((error) => {
  printError(`Unexpected error: ${error.message}`);
  process.exit(1);
});

