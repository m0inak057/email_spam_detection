# Quick Start Guide - Email Spam Detection System

## 🚀 Getting Started in 5 Minutes

Follow these steps to get your spam detection system up and running!

### Step 1: Install Backend Dependencies (2 minutes)

```bash
cd backend
pip install -r requirements.txt
```

### Step 2: Download NLTK Data (1 minute)

```bash
python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('omw-1.4')"
```

### Step 3: Get the Dataset (Manual)

1. Go to: https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset
2. Download `spam.csv`
3. Place it in the `ml_model/` directory

### Step 4: Train the Model (5 minutes)

```bash
cd ../ml_model
pip install -r requirements.txt
jupyter notebook
```

- Open `eda.ipynb` and run all cells
- Open `train_model.ipynb` and run all cells
- This will generate `model.pkl` and `vectorizer.pkl`

### Step 5: Copy Model Files to Backend

```bash
# Windows
copy model.pkl ..\backend\predictor\ml\
copy vectorizer.pkl ..\backend\predictor\ml\

# Mac/Linux
cp model.pkl ../backend/predictor/ml/
cp vectorizer.pkl ../backend/predictor/ml/
```

### Step 6: Run Django Backend

```bash
cd ../backend
python manage.py migrate
python manage.py runserver
```

✅ Backend is now running at `http://localhost:8000`

### Step 7: Open Frontend

Open `frontend/index.html` in your browser, or:

```bash
cd ../frontend
python -m http.server 5500
```

Then open `http://localhost:5500` in your browser.

## ✨ You're Done!

Your spam detection system is now running!

## 🧪 Quick Test

### Test with cURL:

```bash
curl -X POST http://localhost:8000/api/predict/ \
  -H "Content-Type: application/json" \
  -d "{\"email_text\": \"Congratulations! You won $1000000!\"}"
```

### Test with Frontend:

1. Click "Try Sample" button
2. Click "Check Email"
3. See the result!

## ❓ Troubleshooting

### "Models not loaded" error?
- Make sure you copied `model.pkl` and `vectorizer.pkl` to `backend/predictor/ml/`
- Restart the Django server

### Port already in use?
- Change port: `python manage.py runserver 8080`
- Update API_URL in `frontend/script.js`

### CORS errors?
- Make sure `django-cors-headers` is installed
- Check `CORS_ALLOWED_ORIGINS` in `settings.py`

## 📚 Next Steps

- Customize the frontend design
- Add more features (email logging, authentication)
- Deploy to production (Render, Vercel)
- Add more ML models for comparison

## 🎓 For Viva Preparation

### Key Questions to Prepare:

1. **What is TF-IDF?**
   - Term Frequency-Inverse Document Frequency
   - Converts text to numerical features
   - Weighs words by importance

2. **Why Naive Bayes for spam detection?**
   - Works well with text classification
   - Handles high-dimensional data
   - Fast training and prediction

3. **How does preprocessing help?**
   - Removes noise (URLs, punctuation)
   - Normalizes text (lowercase, lemmatization)
   - Improves model accuracy

4. **What is the API architecture?**
   - RESTful API with Django
   - POST endpoint for predictions
   - JSON request/response format

5. **How do you handle overfitting?**
   - Train-test split (80-20)
   - Cross-validation
   - Regularization in models

### Demo Script:

1. "I'll start by showing the EDA notebook..."
2. "Here's how the model is trained..."
3. "Let me test the API with Postman..."
4. "Now I'll demonstrate the frontend..."
5. "You can see the confidence score here..."

## 📞 Need Help?

Check the main README.md for detailed documentation.

---

**Happy Building! 🎉**
