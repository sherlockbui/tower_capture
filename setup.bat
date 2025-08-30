@echo off
echo ========================================
echo Tower Capture Management App Setup
echo ========================================
echo.

echo Installing root dependencies...
yarn install

echo.
echo Installing backend dependencies...
cd backend
yarn install
cd ..

echo.
echo Installing frontend dependencies...
cd frontend
yarn install
cd ..

echo.
echo Creating necessary directories...
if not exist "backend\uploads" mkdir "backend\uploads"
if not exist "backend\temp" mkdir "backend\temp"

echo.
echo Setup complete! Next steps:
echo 1. Copy backend\env.example to backend\.env
echo 2. Edit backend\.env with your MongoDB settings
echo 3. Start MongoDB service
echo 4. Run: cd backend ^&^& node src/init-db.js
echo 5. Start the app: yarn dev
echo.
echo See SETUP.md for detailed instructions.
pause
