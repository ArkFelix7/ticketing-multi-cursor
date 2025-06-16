# Azure Deployment Script
Write-Host "Starting Azure deployment process..."

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "Azure CLI is not installed. Please install it from https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
}

# Login to Azure
Write-Host "Logging into Azure..."
az login

# Create resource group if it doesn't exist
$resourceGroup = "multi-tenant-ticketing-rg"
$location = "eastus"

Write-Host "Creating resource group $resourceGroup..."
az group create --name $resourceGroup --location $location

# Create App Service plan
$appServicePlan = "multi-tenant-ticketing-plan"
Write-Host "Creating App Service plan $appServicePlan..."
az appservice plan create --name $appServicePlan --resource-group $resourceGroup --sku B1 --is-linux

# Create Web App
$webAppName = "multi-tenant-ticketing-app"
Write-Host "Creating Web App $webAppName..."
az webapp create --name $webAppName --resource-group $resourceGroup --plan $appServicePlan --runtime "NODE:20-lts"

# Configure environment variables
Write-Host "Configuring environment variables..."
az webapp config appsettings set --name $webAppName --resource-group $resourceGroup --settings NODE_ENV=production

# Deploy the application
Write-Host "Deploying application..."
az webapp deployment source config-local-git --name $webAppName --resource-group $resourceGroup

# Get the deployment URL
$deploymentUrl = az webapp deployment source config-local-git --name $webAppName --resource-group $resourceGroup --query url -o tsv
Write-Host "Deployment URL: $deploymentUrl"

Write-Host "Deployment completed successfully!"
Write-Host "Your application will be available at: https://$webAppName.azurewebsites.net" 