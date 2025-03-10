# Deploying T-Shirt Sizing App to Azure

This guide provides step-by-step instructions for deploying the T-Shirt Sizing app to Azure.

## Prerequisites
- Azure account
- Azure CLI installed
- Node.js and npm installed locally
- Git installed

## Steps

### 1. Prepare Your Application
```bash
# Build the application for production
npm run build
```

### 2. Initialize Azure Resources

```bash
# Login to Azure
az login

# Create a resource group
az group create --name t-shirt-sizing-rg --location eastus

# Create an App Service plan
az appservice plan create --name t-shirt-sizing-plan --resource-group t-shirt-sizing-rg --sku B1
```

### 3. Create Web App

```bash
# Create the web app
az webapp create --name t-shirt-sizing --resource-group t-shirt-sizing-rg --plan t-shirt-sizing-plan --runtime "NODE|18-lts"
```

### 4. Configure Web App Settings

```bash
# Configure the web app to use Node.js
az webapp config appsettings set --name t-shirt-sizing --resource-group t-shirt-sizing-rg --settings WEBSITE_NODE_DEFAULT_VERSION=~18 SCM_DO_BUILD_DURING_DEPLOYMENT=true

# Set the startup command
az webapp config set --name t-shirt-sizing --resource-group t-shirt-sizing-rg --startup-file "npm start"
```

### 5. Deploy the Application

```bash
# Create a deployment ZIP from your project
# First, ensure you're in the root directory of your project
git archive --format zip --output ./app.zip HEAD

# Deploy the ZIP to Azure
az webapp deployment source config-zip --name t-shirt-sizing --resource-group t-shirt-sizing-rg --src ./app.zip
```

### 6. Enable WebSockets (if needed)
Since this app uses WebSockets:

```bash
# Enable WebSockets
az webapp config set --name t-shirt-sizing --resource-group t-shirt-sizing-rg --web-sockets-enabled true
```

### 7. View Your Deployed Application
Your application will be available at: `https://t-shirt-sizing.azurewebsites.net`

## Optional: Set Up Continuous Deployment

1. Go to Azure Portal
2. Navigate to your App Service
3. Select "Deployment Center"
4. Connect to your GitHub repository
5. Configure build provider and settings

## Troubleshooting
- Check App Service logs in Azure Portal
- Use `az webapp log tail` to view live logs
- Verify WebSocket connections if real-time features aren't working