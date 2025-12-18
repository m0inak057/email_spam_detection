#!/bin/bash

# Email Spam Detection System - Setup Script
# This script automates the setup process

echo "🚀 Email Spam Detection System - Setup Script"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Python installation
echo "Checking Python installation..."
if ! command -v python &> /dev/null; then
    echo -e "${RED}❌ Python is not installed. Please install Python 3.8+ first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python found: $(python --version)${NC}"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
cd backend
python -m venv venv
echo -e "${GREEN}✅ Virtual environment created${NC}"
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source venv/Scripts/activate
else
    source venv/bin/activate
fi
echo -e "${GREEN}✅ Virtual environment activated${NC}"
echo ""

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt
echo -e "${GREEN}✅ Backend dependencies installed${NC}"
echo ""

# Download NLTK data
echo "Downloading NLTK data..."
python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('omw-1.4')"
echo -e "${GREEN}✅ NLTK data downloaded${NC}"
echo ""

# Install ML dependencies
echo "Installing ML dependencies..."
cd ../ml_model
pip install -r requirements.txt
echo -e "${GREEN}✅ ML dependencies installed${NC}"
echo ""

# Check for dataset
echo "Checking for dataset..."
if [ ! -f "spam.csv" ]; then
    echo -e "${YELLOW}⚠️  Dataset not found!${NC}"
    echo "Please download spam.csv from:"
    echo "https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset"
    echo "and place it in the ml_model/ directory"
else
    echo -e "${GREEN}✅ Dataset found${NC}"
fi
echo ""

# Run migrations
echo "Running Django migrations..."
cd ../backend
python manage.py migrate
echo -e "${GREEN}✅ Migrations completed${NC}"
echo ""

echo "=============================================="
echo -e "${GREEN}🎉 Setup Complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Download spam.csv if you haven't already"
echo "2. Run the training notebooks (eda.ipynb, train_model.ipynb)"
echo "3. Copy model.pkl and vectorizer.pkl to backend/predictor/ml/"
echo "4. Start the server: python manage.py runserver"
echo "5. Open frontend/index.html in your browser"
echo ""
echo "For detailed instructions, see README.md or QUICKSTART.md"
echo "=============================================="
