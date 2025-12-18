# ✅ Project Setup Checklist

Use this checklist to ensure everything is set up correctly.

## 📦 Installation Checklist

### Prerequisites
- [ ] Python 3.8 or higher installed
- [ ] pip installed and updated
- [ ] Git installed (optional, for version control)
- [ ] Web browser (Chrome, Firefox, Edge, or Safari)
- [ ] Text editor or IDE (VS Code, PyCharm, etc.)

### Backend Setup
- [ ] Navigate to `backend/` directory
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate virtual environment
  - Windows: `venv\Scripts\activate`
  - Mac/Linux: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Download NLTK data:
  ```python
  python -c "import nltk; nltk.download('stopwords'); nltk.download('wordnet'); nltk.download('omw-1.4')"
  ```
- [ ] Run migrations: `python manage.py migrate`
- [ ] Verify Django installation: `python manage.py --version`

### ML Model Setup
- [ ] Navigate to `ml_model/` directory
- [ ] Install ML dependencies: `pip install -r requirements.txt`
- [ ] Download dataset from Kaggle:
  - URL: https://www.kaggle.com/datasets/uciml/sms-spam-collection-dataset
  - Save as `spam.csv` in `ml_model/` directory
- [ ] Dataset file exists: `ml_model/spam.csv` ✓

### Training Process
- [ ] Start Jupyter: `jupyter notebook`
- [ ] Open and run `eda.ipynb` (all cells)
  - Check data loaded successfully
  - Review visualizations
  - Dataset cleaned and saved
- [ ] Open and run `train_model.ipynb` (all cells)
  - Verify model training completes
  - Check model performance metrics
  - Files created: `model.pkl` and `vectorizer.pkl`
- [ ] Copy model files to backend:
  - Copy `ml_model/model.pkl` → `backend/predictor/ml/model.pkl`
  - Copy `ml_model/vectorizer.pkl` → `backend/predictor/ml/vectorizer.pkl`

### Backend Verification
- [ ] Model files exist in `backend/predictor/ml/`:
  - [ ] `model.pkl`
  - [ ] `vectorizer.pkl`
- [ ] Start Django server: `python manage.py runserver`
- [ ] Server running at http://localhost:8000
- [ ] Test health endpoint: http://localhost:8000/api/health/
  - Expected: `{"status": "healthy", "models_loaded": true}`
- [ ] Test predict endpoint with cURL or Postman

### Frontend Setup
- [ ] Navigate to `frontend/` directory
- [ ] Open `index.html` in browser, OR
- [ ] Start local server: `python -m http.server 5500`
- [ ] Frontend accessible at http://localhost:5500

---

## 🧪 Testing Checklist

### API Testing
- [ ] Health check returns 200 OK
- [ ] Models loaded = true
- [ ] Predict endpoint accepts POST requests
- [ ] Spam email correctly classified
- [ ] Ham email correctly classified
- [ ] Empty input returns error
- [ ] Confidence score between 0 and 1

### Frontend Testing
- [ ] Page loads without errors
- [ ] Character counter updates
- [ ] Check button disabled when empty
- [ ] Check button enabled with text
- [ ] Loading spinner appears during prediction
- [ ] Result displays correctly
- [ ] Confidence bar animates
- [ ] Clear button works
- [ ] Sample button loads example
- [ ] API status indicator works
- [ ] Works on mobile devices

### Integration Testing
- [ ] Frontend connects to backend
- [ ] Predictions are accurate
- [ ] Error messages display properly
- [ ] No CORS errors in console

---

## 📚 Documentation Checklist

### Files Created
- [ ] README.md - Main documentation
- [ ] QUICKSTART.md - Quick setup guide
- [ ] TESTING.md - Testing procedures
- [ ] PROJECT_SUMMARY.md - Project overview
- [ ] .gitignore - Git ignore rules
- [ ] setup.sh - Linux/Mac setup script
- [ ] setup.bat - Windows setup script

### Code Documentation
- [ ] Python files have docstrings
- [ ] Functions are commented
- [ ] API endpoints documented
- [ ] Configuration explained

---

## 🎓 Presentation Preparation

### Demo Preparation
- [ ] Test system multiple times
- [ ] Prepare 3-5 sample emails (spam and ham)
- [ ] Screenshot key features
- [ ] Note down performance metrics
- [ ] Prepare architecture diagram

### Viva Questions Preparation
- [ ] Can explain TF-IDF
- [ ] Can explain Naive Bayes
- [ ] Can explain preprocessing steps
- [ ] Can explain API architecture
- [ ] Can explain Django models
- [ ] Can demonstrate live system
- [ ] Can explain error handling
- [ ] Can discuss improvements

### Materials to Prepare
- [ ] Project report document
- [ ] Presentation slides (PPT)
- [ ] Code walkthrough notes
- [ ] Performance metrics table
- [ ] System architecture diagram
- [ ] Sample predictions screenshots
- [ ] Confusion matrix image

---

## 🚀 Deployment Checklist (Optional)

### Backend Deployment (Render)
- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Configure environment variables
- [ ] Deploy backend
- [ ] Test deployed API

### Frontend Deployment (Vercel)
- [ ] Create Vercel account
- [ ] Import project
- [ ] Update API URL in script.js
- [ ] Deploy frontend
- [ ] Test deployed site

### Post-Deployment
- [ ] Both services running
- [ ] Frontend connects to backend
- [ ] CORS configured for production
- [ ] SSL certificates active

---

## ✅ Final Verification

### System Working?
- [ ] Backend server starts without errors
- [ ] Models load successfully
- [ ] API responds to requests
- [ ] Frontend loads properly
- [ ] Predictions are accurate
- [ ] Confidence scores make sense
- [ ] Error handling works
- [ ] System is responsive

### Ready for Submission?
- [ ] All code committed to Git
- [ ] Documentation complete
- [ ] Screenshots captured
- [ ] Project report written
- [ ] Presentation prepared
- [ ] System tested thoroughly

---

## 📋 Common Issues & Solutions

### Issue: "Models not loaded"
- [ ] Check if model.pkl and vectorizer.pkl exist in backend/predictor/ml/
- [ ] Restart Django server
- [ ] Check file permissions

### Issue: "CORS error in frontend"
- [ ] Verify django-cors-headers installed
- [ ] Check CORS_ALLOWED_ORIGINS in settings.py
- [ ] Restart Django server

### Issue: "Module not found"
- [ ] Activate virtual environment
- [ ] Install missing package: `pip install <package-name>`
- [ ] Check requirements.txt

### Issue: "Port already in use"
- [ ] Change port: `python manage.py runserver 8080`
- [ ] Kill existing process
- [ ] Update API_URL in frontend/script.js

### Issue: "Dataset not found"
- [ ] Download spam.csv from Kaggle
- [ ] Place in ml_model/ directory
- [ ] Check file name is exactly "spam.csv"

---

## 🎉 Success Indicators

You're ready when:
- ✅ All checkboxes above are checked
- ✅ System runs end-to-end without errors
- ✅ You can explain every component
- ✅ Demo works smoothly
- ✅ Documentation is complete

---

**Status:** _____ / _____ items completed

**Last Updated:** __________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
