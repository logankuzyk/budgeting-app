# Firebase Deployment Scripts

This directory contains scripts to deploy the Firebase backend, including Firestore rules, indexes, and Cloud Functions.

## Prerequisites

1. **Firebase CLI**: Install globally with `npm install -g firebase-tools`
2. **Firebase Login**: Run `firebase login` to authenticate
3. **Project Configuration**: Update `.firebaserc` with your Firebase project ID

## Configuration

### 1. Set Your Firebase Project ID

Edit `.firebaserc` in the root directory:

```json
{
  "projects": {
    "default": "your-actual-project-id"
  }
}
```

Or use the `--project` flag when deploying.

### 2. Verify Firebase Configuration

The `firebase.json` file configures:
- Firestore rules location: `firestore.rules`
- Firestore indexes location: `firestore.indexes.json`
- Cloud Functions source: `functions/` directory
- Pre-deploy build step for functions

## Usage

**Important**: Always run deployment commands from the **root directory** of the project, not from `functions/`.

### Using npm scripts (Recommended)

```bash
# From the root directory
npm run deploy              # Deploy everything (rules, indexes, and functions)
npm run deploy:rules       # Deploy only Firestore rules
npm run deploy:indexes    # Deploy only Firestore indexes
npm run deploy:functions  # Deploy only Cloud Functions
```

### Using the Node.js script directly

```bash
# From the root directory
node scripts/deploy.js                    # Deploy everything
node scripts/deploy.js --rules            # Deploy only rules
node scripts/deploy.js --indexes         # Deploy only indexes
node scripts/deploy.js --functions       # Deploy only functions
node scripts/deploy.js --project your-id # Deploy to specific project
```

## What Gets Deployed

### Firestore Rules (`firestore.rules`)
- Security rules for all collections
- User-scoped access control
- Deployed with: `firebase deploy --only firestore:rules`

### Firestore Indexes (`firestore.indexes.json`)
- Composite indexes for queries
- Required for complex queries (e.g., filtering + ordering)
- Deployed with: `firebase deploy --only firestore:indexes`

### Cloud Functions (`functions/`)
- `onUserCreate`: Seeds default categories when a user is created
- `onRawFileCreate`: Processes uploaded files (statements/receipts)
- Functions are built with TypeScript before deployment
- Deployed with: `firebase deploy --only functions`

## Deployment Process

1. **Pre-flight Checks**
   - Verifies Firebase CLI is installed
   - Checks if user is logged in
   - Confirms project selection

2. **Build Functions** (if deploying functions)
   - Runs `npm run build` in the `functions/` directory
   - Compiles TypeScript to JavaScript

3. **Deploy Resources**
   - Deploys Firestore rules
   - Deploys Firestore indexes
   - Deploys Cloud Functions

4. **Verification**
   - Reports success/failure for each step
   - Exits with error code if any step fails

## Troubleshooting

### "Firebase CLI is not installed"
```bash
npm install -g firebase-tools
```

### "You are not logged in to Firebase"
```bash
firebase login
```

### "Project not found"
- Update `.firebaserc` with the correct project ID
- Or use `--project` flag: `npm run deploy -- --project your-project-id`

### "Functions build failed"
- Check that `functions/package.json` dependencies are installed
- Run `cd functions && npm install` if needed
- Verify TypeScript compilation: `cd functions && npm run build`


## CI/CD Integration

For continuous deployment, you can use these scripts in your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Deploy to Firebase
  run: |
    npm install -g firebase-tools
    firebase login --no-localhost --token ${{ secrets.FIREBASE_TOKEN }}
    npm run deploy
```

Or with a service account:

```bash
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account.json"
npm run deploy
```

## Manual Deployment

If you prefer to deploy manually:

```bash
# Deploy rules
firebase deploy --only firestore:rules

# Deploy indexes
firebase deploy --only firestore:indexes

# Build and deploy functions
cd functions
npm run build
cd ..
firebase deploy --only functions

# Or deploy everything at once
firebase deploy
```

