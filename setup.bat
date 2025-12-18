@echo off
REM Email Spam Detection System - Windows Setup Script

echo ========================================
echo Email Spam Detection System - Setup
echo ========================================
echo.

REM Check Python installation
echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed. Please install Python 3.8+ first.
    pause
    exit /b 1
)
echo [OK] Python found
echo.

REM Create virtual environment
echo Creating virtual environment...
cd backend
python -m venv venv
echo [OK] Virtual environment created
echo.

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo [OK] Virtual environment activated
echo.

REM Install backend dependencies
echo Installing backend dependencies...
pip install -r requirements.txt
echo [OK] Backend dependencies installed
echo.

REM Download NLTK data
echo Downloading NLTK data...
python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('omw-1.4')"
echo [OK] NLTK data downloaded
echo.

REM Install ML dependencies
echo Installing ML dependencies...
cd ..\ml_model
pip install -r requirements.txt
echo [OK] ML dependencies installed
echo.

REM Check for dataset
echo Checking for dataset...
if not exist "spam.csv" (
    echo [WARNING] Dataset not found!
    echo Please download spam.csv from:
    echo https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset
    echo and place it in the ml_model\ directory
) else (
    echo [OK] Dataset found
)
echo.

REM Run migrations
echo Running Django migrations...
cd ..\backend
python manage.py migrate
echo [OK] Migrations completed
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Download spam.csv if you haven't already
echo 2. Run the training notebooks (eda.ipynb, train_model.ipynb)
echo 3. Copy model.pkl and vectorizer.pkl to backend\predictor\ml\
echo 4. Start the server: python manage.py runserver
echo 5. Open frontend\index.html in your browser
echo.
echo For detailed instructions, see README.md or QUICKSTART.md
echo ========================================
echo.
pause
