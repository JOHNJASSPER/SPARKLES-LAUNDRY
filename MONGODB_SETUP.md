# MongoDB Setup Guide for Windows

## Option 1: Install MongoDB Community Edition (Recommended)

1. **Download MongoDB**
   - Visit: https://www.mongodb.com/try/download/community
   - Select "Windows" platform
   - Download the MSI installer

2. **Install MongoDB**
   - Run the downloaded MSI file
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass (optional GUI tool)

3. **Verify Installation**
   ```powershell
   mongod --version
   ```

4. **Start MongoDB Service**
   - MongoDB should start automatically as a Windows Service
   - Or manually start it:
   ```powershell
   net start MongoDB
   ```

## Option 2: Use MongoDB Atlas (Cloud Database - Free Tier)

If you don't want to install MongoDB locally, use MongoDB Atlas:

1. **Create Account**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free

2. **Create Cluster**
   - Choose FREE tier (M0)
   - Select a cloud provider and region
   - Click "Create Cluster"

3. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster.mongodb.net/sparkles-laundry`

4. **Update .env File**
   - Replace the MONGODB_URI in your `.env` file with the Atlas connection string
   - Replace `<password>` with your actual password

## After Setup

Once MongoDB is installed or configured, restart your server:

```powershell
npm start
```

The server will connect to MongoDB and you'll see:
```
✅ MongoDB connected successfully
```
