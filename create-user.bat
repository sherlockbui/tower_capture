@echo off
echo Creating new user...
echo.

if "%1"=="" (
    echo Usage: create-user.bat username password [role]
    echo Example: create-user.bat john password123 user
    echo Example: create-user.bat admin admin123 admin
    pause
    exit /b 1
)

if "%2"=="" (
    echo Error: Password is required
    echo Usage: create-user.bat username password [role]
    pause
    exit /b 1
)

if "%3"=="" (
    set role=user
) else (
    set role=%3
)

echo Username: %1
echo Role: %role
echo.

cd backend
node src/create-user.js %1 %2 %role%

echo.
pause
