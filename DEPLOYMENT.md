# Multi-Tenant Ticketing System - Deployment Guide

## Quick Start - Deploy to Vercel

### Prerequisites
1. [Vercel Account](https://vercel.com)
2. [Supabase Account](https://supabase.com) (for PostgreSQL database)
3. [Firebase Account](https://firebase.google.com) (for authentication)
4. Gmail account with App Password (for email integration)

### Step 1: Database Setup (Supabase)

1. Create a new project in Supabase
2. Go to Settings > Database
3. Copy the connection string and direct URL
4. Note down your project URL and anon key

### Step 2: Firebase Setup

1. Create a new Firebase project
2. Enable Authentication with Email/Password
3. Get your config from Project Settings > General > Your apps
4. Note down all the configuration values

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel CLI (Current Method)

1. Install Vercel CLI: `npm install -g vercel`
2. Run deployment: `vercel`
3. Follow the prompts to create a new project
4. Add environment variables in Vercel dashboard

#### Option B: Deploy via GitHub (Recommended)

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure environment variables
4. Deploy automatically

### Step 4: Environment Variables

Add these environment variables in your Vercel project settings:

#### Database (Required)
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public&pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres?schema=public
```

#### Supabase (Required)
```
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### Firebase (Required)
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

#### Email (Optional - for email ticketing)
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
CC_EMAIL=optional-cc@gmail.com
```

### Step 5: Database Migration

After deployment, you need to set up the database schema:

1. Go to your Vercel project dashboard
2. Open the Functions tab
3. Create a one-time function to run migrations, or
4. Use Supabase SQL Editor to run the schema manually

### Step 6: Test the Deployment

1. Visit your Vercel deployment URL
2. Try registering a new company account
3. Test the login functionality
4. Create a test ticket

## Troubleshooting

### Build Failures
- Ensure all required environment variables are set
- Check that Firebase configuration is valid
- Verify database connection string format

### Runtime Errors
- Check Vercel Function logs
- Ensure database is accessible from Vercel's edge network
- Verify Firebase authentication is properly configured

### Email Integration Issues
- Confirm Gmail App Password is correctly generated
- Check email credentials in environment variables
- Test SMTP connection separately

## Production Considerations

1. **Security**: Use environment variables for all sensitive data
2. **Database**: Consider connection pooling limits
3. **Email**: Set up proper SPF/DKIM records for your domain
4. **Monitoring**: Enable Vercel Analytics and error reporting
5. **Backup**: Implement regular database backups

## Support

For issues with deployment, check:
1. Vercel deployment logs
2. Browser console for client-side errors
3. Network tab for API failures
4. Supabase logs for database issues

## Next Steps After Deployment

1. Set up custom domain (optional)
2. Configure email integration with your domain
3. Set up monitoring and alerts
4. Plan for scaling and performance optimization

# Azure Deployment Guide

This guide will help you deploy the Multi-Tenant Ticketing System to Azure.

## Prerequisites

1. Azure Account
2. Azure CLI installed
3. Git installed
4. Node.js and npm installed

## Deployment Steps

### 1. Initial Setup

1. Install Azure CLI if you haven't already:
   ```bash
   winget install Microsoft.AzureCLI
   ```

2. Login to Azure:
   ```bash
   az login
   ```

### 2. Environment Variables

Create a `.env` file in the root directory with the following variables:
```
DATABASE_URL=your_azure_database_connection_string
NODE_ENV=production
```

### 3. Database Setup

1. Create an Azure Database for PostgreSQL:
   ```bash
   az postgres flexible-server create --resource-group multi-tenant-ticketing-rg --name multi-tenant-ticketing-db --location eastus --admin-user adminuser --admin-password your_password --sku-name Standard_B1ms
   ```

2. Get the connection string:
   ```bash
   az postgres flexible-server show-connection-string --server-name multi-tenant-ticketing-db --admin-user adminuser --admin-password your_password
   ```

3. Update the DATABASE_URL in your environment variables with the connection string.

### 4. Application Deployment

1. Run the deployment script:
   ```powershell
   ./scripts/deploy-azure.ps1
   ```

2. The script will:
   - Create a resource group
   - Create an App Service plan
   - Create a Web App
   - Configure environment variables
   - Set up deployment

### 5. Database Migration

After deployment, run the database migrations:
```bash
npx prisma migrate deploy
```

### 6. Verify Deployment

1. Visit your application at: `https://multi-tenant-ticketing-app.azurewebsites.net`
2. Check the Azure Portal for any deployment issues
3. Monitor the application logs in Azure Portal

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify the DATABASE_URL in Azure App Service Configuration
   - Check if the database server firewall rules allow connections

2. **Deployment Failures**
   - Check the deployment logs in Azure Portal
   - Verify all environment variables are set correctly

3. **Application Errors**
   - Check the application logs in Azure Portal
   - Verify the Node.js version matches your local environment

### Getting Help

If you encounter any issues:
1. Check the Azure Portal logs
2. Review the deployment script output
3. Contact Azure support if needed

## Maintenance

### Updating the Application

1. Make your changes locally
2. Test thoroughly
3. Commit and push to your repository
4. Azure will automatically deploy the changes

### Scaling

To scale your application:
1. Go to Azure Portal
2. Navigate to your App Service
3. Select "Scale up (App Service plan)"
4. Choose the appropriate tier

## Security Considerations

1. Keep your database credentials secure
2. Regularly update dependencies
3. Monitor application logs for suspicious activity
4. Use Azure Key Vault for sensitive information

## Cost Management

1. Monitor your Azure usage in the Azure Portal
2. Set up budget alerts
3. Consider using Azure Dev/Test pricing if applicable
4. Review and optimize resource usage regularly
