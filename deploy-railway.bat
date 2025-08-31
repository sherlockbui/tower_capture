@echo off
echo 🚂 Railway CLI Deployment for Windows
echo ======================================
echo.

echo 📦 Installing Railway CLI via npm...
npm install -g @railway/cli

echo.
echo 🔐 Logging into Railway...
railway login

echo.
echo 🚀 Initializing Railway project...
cd backend
railway init

echo.
echo 🔗 Linking project to current directory...
railway link

echo.
echo 🆕 Creating new service...
railway add

echo.
echo 🔗 Linking service...
railway service

echo.
echo ⚙️ Setting environment variables...
echo Setting NODE_ENV...
railway variables --set "NODE_ENV=production"

echo Setting PORT...
railway variables --set "PORT=5000"

echo Setting MONGODB_URI...
railway variables --set "MONGODB_URI=your_mongodb_uri_here"

echo Setting JWT_SECRET...
railway variables --set "JWT_SECRET=your_jwt_secret_here"

echo Setting CLOUDINARY_CLOUD_NAME...
railway variables --set "CLOUDINARY_CLOUD_NAME=your_cloud_name_here"

echo Setting CLOUDINARY_API_KEY...
railway variables --set "CLOUDINARY_API_KEY=your_api_key_here"

echo Setting CLOUDINARY_API_SECRET...
railway variables --set "CLOUDINARY_API_SECRET=your_api_secret_here"

echo Setting CORS_ORIGIN...
railway variables --set "CORS_ORIGIN=https://your-frontend.vercel.app"

echo.
echo 🚀 Deploying to Railway...
railway up

echo.
echo ✅ Deployment completed!
echo 📍 Check your Railway dashboard for the URL
echo.
echo 💡 Next steps:
echo 1. Update environment variables with real values
echo 2. Test your endpoints
echo 3. Check logs with: railway logs
echo.
pause
