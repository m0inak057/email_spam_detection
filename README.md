# Email Spam Detection System

## 🎓 Engineering Degree Project

A complete end-to-end email spam detection system using Machine Learning, Django REST API, and a modern web interface.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Model Details](#model-details)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

This project implements an AI-powered email spam detection system that classifies emails as spam or legitimate (ham) with high accuracy. The system uses Natural Language Processing (NLP) and Machine Learning techniques including TF-IDF vectorization and classification algorithms.

### Key Components:

1. **Machine Learning Pipeline**: Data preprocessing, feature extraction, model training
2. **Django Backend**: REST API for email classification
3. **Frontend Interface**: Modern, responsive web UI
4. **Deployment Ready**: Can be deployed on Render, Vercel, and other platforms

## ✨ Features

- ✅ **Real-time Spam Detection**: Instant email classification
- ✅ **Confidence Scoring**: Probability-based predictions
- ✅ **Text Preprocessing**: Advanced NLP techniques (lemmatization, stopword removal)
- ✅ **Multiple ML Models**: Naive Bayes, Logistic Regression, SVM, Random Forest
- ✅ **REST API**: Easy integration with any frontend
- ✅ **Modern UI**: Beautiful, responsive interface
- ✅ **Health Check Endpoint**: Monitor API status
- ✅ **CORS Enabled**: Cross-origin requests supported

## 📁 Project Structure

```
email_spam_detector/
│
├── backend/
│   ├── spam_detection/           # Django project
│   │   ├── __init__.py
│   │   ├── settings.py           # Django settings
│   │   ├── urls.py               # URL routing
│   │   ├── wsgi.py              # WSGI config
│   │   └── asgi.py              # ASGI config
│   │
│   ├── predictor/                # Predictor app
│   │   ├── __init__.py
│   │   ├── views.py             # API endpoints
│   │   ├── urls.py              # App URLs
│   │   ├── models.py
│   │   └── ml/                  # ML components
│   │       ├── preprocess.py    # Text preprocessing
│   │       ├── model.pkl        # Trained model
│   │       └── vectorizer.pkl   # TF-IDF vectorizer
│   │
│   └── manage.py                # Django management
│
├── frontend/
│   ├── index.html               # Main HTML
│   ├── style.css                # Styling
│   └── script.js                # Frontend logic
│
├── ml_model/
│   ├── eda.ipynb                # Exploratory Data Analysis
│   ├── train_model.ipynb        # Model training
│   ├── model.pkl                # Saved model
│   ├── vectorizer.pkl           # Saved vectorizer
│   └── requirements.txt         # ML dependencies
│
├── README.md                    # This file
└── .gitignore                   # Git ignore rules
```

## 🛠️ Technologies Used

### Backend
- **Python 3.8+**
- **Django 4.2+**
- **Django REST Framework**
- **django-cors-headers**

### Machine Learning
- **scikit-learn**: ML algorithms and evaluation
- **NLTK**: Natural Language Processing
- **pandas**: Data manipulation
- **numpy**: Numerical operations
- **joblib**: Model serialization

### Frontend
- **HTML5**
- **CSS3** (Modern design with animations)
- **Vanilla JavaScript** (Fetch API)

### Data Visualization (EDA)
- **matplotlib**
- **seaborn**
- **wordcloud**

## 🚀 Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Git

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd "EMAIL SPAM DETECTION"
```

### Step 2: Set Up Backend

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install django djangorestframework django-cors-headers scikit-learn nltk pandas numpy joblib
```

### Step 3: Download NLTK Data

```python
python
>>> import nltk
>>> nltk.download('stopwords')
>>> nltk.download('wordnet')
>>> nltk.download('omw-1.4')
>>> exit()
```

### Step 4: Train the Model

```bash
cd ../ml_model

# Install ML dependencies
pip install pandas numpy scikit-learn nltk matplotlib seaborn wordcloud jupyter

# Download dataset from Kaggle
# https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset
# Save as spam.csv in ml_model/ directory

# Open and run notebooks
jupyter notebook
# Run eda.ipynb first, then train_model.ipynb
```

### Step 5: Copy Model Files

After training, copy the generated model files:

```bash
# Copy model and vectorizer to backend
cp model.pkl vectorizer.pkl ../backend/predictor/ml/
```

### Step 6: Run Backend Server

```bash
cd ../backend

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

The API will be available at `http://localhost:8000`

### Step 7: Open Frontend

Simply open `frontend/index.html` in a web browser, or use a local server:

```bash
cd ../frontend

# Using Python's built-in server
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

## 💡 Usage

### Using the Web Interface

1. Open the frontend in your browser
2. Paste an email text in the textarea
3. Click "Check Email" button
4. View the classification result with confidence score

### Using the API Directly

#### Health Check

```bash
curl http://localhost:8000/api/health/
```

Response:
```json
{
    "status": "healthy",
    "models_loaded": true,
    "message": "Email Spam Detection API is running!"
}
```

#### Predict Email

```bash
curl -X POST http://localhost:8000/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{"email_text": "Congratulations! You won $1,000,000!"}'
```

Response:
```json
{
    "status": "success",
    "prediction": "spam",
    "confidence": 0.9542,
    "email_length": 42,
    "cleaned_length": 28
}
```

## 📊 API Documentation

### Base URL

```
http://localhost:8000/api
```

### Endpoints

#### 1. Health Check

**Endpoint:** `GET /health/`

**Response:**
```json
{
    "status": "healthy",
    "models_loaded": true,
    "message": "Email Spam Detection API is running!"
}
```

#### 2. Predict Email

**Endpoint:** `POST /predict/`

**Request Body:**
```json
{
    "email_text": "Your email content here"
}
```

**Success Response (200):**
```json
{
    "status": "success",
    "prediction": "spam",
    "confidence": 0.9234,
    "email_length": 150,
    "cleaned_length": 98
}
```

**Error Response (400/500):**
```json
{
    "status": "error",
    "message": "Error description"
}
```

## 🤖 Model Details

### Preprocessing Pipeline

1. **Lowercase conversion**
2. **URL removal**
3. **HTML tag removal**
4. **Email address removal**
5. **Punctuation removal**
6. **Digit removal**
7. **Stopword removal** (using NLTK)
8. **Lemmatization** (using WordNet Lemmatizer)

### Feature Extraction

- **Method**: TF-IDF (Term Frequency-Inverse Document Frequency)
- **Max Features**: 3000
- **N-gram Range**: (1, 2) - Unigrams and bigrams
- **Min Document Frequency**: 3
- **Max Document Frequency**: 0.8

### Models Trained

- **Naive Bayes** (MultinomialNB)
- **Logistic Regression**
- **Random Forest**
- **Support Vector Machine (SVM)**

### Model Performance

The best model is selected based on F1-Score. Typical performance:

- **Accuracy**: ~95-98%
- **Precision**: ~93-97%
- **Recall**: ~94-96%
- **F1-Score**: ~94-97%

## 🌐 Deployment

### Backend Deployment (Render)

1. Create a `render.yaml` file
2. Push to GitHub
3. Connect to Render
4. Deploy

### Frontend Deployment (Vercel)

1. Push frontend to GitHub
2. Connect to Vercel
3. Deploy
4. Update API URL in `script.js`

### Environment Variables

For production, set:
```
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=your-domain.com
```

## 📸 Screenshots

### Main Interface
![Main Interface](screenshots/main-interface.png)

### Spam Detection Result
![Spam Result](screenshots/spam-result.png)

### Legitimate Email Result
![Ham Result](screenshots/ham-result.png)

## 🔄 Data Flow

```
User Input (Frontend)
    ↓
JavaScript sends POST request
    ↓
Django API receives request
    ↓
Text Preprocessing (preprocess.py)
    ↓
TF-IDF Vectorization (vectorizer.pkl)
    ↓
ML Model Prediction (model.pkl)
    ↓
Confidence Score Calculation
    ↓
JSON Response to Frontend
    ↓
Display Result to User
```

## 🎯 For Viva/Presentation

### Key Points to Explain:

1. **Problem Statement**: Spam emails are a security and productivity concern
2. **Solution Approach**: ML-based classification using NLP
3. **TF-IDF Explanation**: Converts text to numerical features
4. **Model Selection**: Why Naive Bayes/Logistic Regression works well
5. **API Architecture**: RESTful design with Django
6. **Frontend Integration**: Modern, responsive UI
7. **Deployment Strategy**: Cloud-based deployment options

### Demo Flow:

1. Show EDA visualizations
2. Explain model training process
3. Test API with Postman/curl
4. Demo frontend interface
5. Show real-time predictions
6. Explain confidence scores

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is created for educational purposes as an engineering degree project.

## 👨‍💻 Author

**MOINAK**  
Engineering Degree Project  
December 2025

## 📞 Contact

For questions or support, please contact [your-email@example.com]

## 🙏 Acknowledgments

- Dataset: UCI SMS Spam Collection
- Libraries: scikit-learn, Django, NLTK
- Inspiration: Real-world email security challenges

---

**⭐ If you find this project helpful, please give it a star!**
