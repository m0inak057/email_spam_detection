# Testing Guide - Email Spam Detection System

## 🧪 Testing Your Spam Detection System

This guide covers comprehensive testing of your email spam detection system.

## 1. Unit Testing (Backend)

### Test Preprocessing Function

Create `backend/predictor/tests.py`:

```python
from django.test import TestCase
from predictor.ml.preprocess import clean_text

class PreprocessingTestCase(TestCase):
    def test_lowercase_conversion(self):
        result = clean_text("HELLO WORLD")
        self.assertEqual(result.lower(), result)
    
    def test_url_removal(self):
        text = "Visit http://spam.com now!"
        result = clean_text(text)
        self.assertNotIn("http", result)
    
    def test_punctuation_removal(self):
        text = "Hello, World!!!"
        result = clean_text(text)
        self.assertNotIn(",", result)
        self.assertNotIn("!", result)
```

Run tests:
```bash
cd backend
python manage.py test
```

## 2. API Testing

### Using cURL

#### Health Check:
```bash
curl http://localhost:8000/api/health/
```

Expected response:
```json
{
    "status": "healthy",
    "models_loaded": true,
    "message": "Email Spam Detection API is running!"
}
```

#### Spam Email Test:
```bash
curl -X POST http://localhost:8000/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{"email_text": "WINNER! You have won $1,000,000! Click here NOW!!!"}'
```

Expected response:
```json
{
    "status": "success",
    "prediction": "spam",
    "confidence": 0.95,
    "email_length": 60,
    "cleaned_length": 45
}
```

#### Ham Email Test:
```bash
curl -X POST http://localhost:8000/api/predict/ \
  -H "Content-Type: application/json" \
  -d '{"email_text": "Hi John, can we meet tomorrow at 3pm for coffee?"}'
```

Expected response:
```json
{
    "status": "success",
    "prediction": "ham",
    "confidence": 0.92,
    "email_length": 52,
    "cleaned_length": 38
}
```

### Using Postman

1. **Setup:**
   - Method: POST
   - URL: `http://localhost:8000/api/predict/`
   - Headers: `Content-Type: application/json`

2. **Test Cases:**

   **Test Case 1: Obvious Spam**
   ```json
   {
       "email_text": "FREE! Win big money. Click here NOW! Limited offer!!!"
   }
   ```

   **Test Case 2: Legitimate Email**
   ```json
   {
       "email_text": "Meeting scheduled for tomorrow at 10am in conference room."
   }
   ```

   **Test Case 3: Edge Case - Empty String**
   ```json
   {
       "email_text": ""
   }
   ```
   Expected: 400 error

   **Test Case 4: Long Email**
   ```json
   {
       "email_text": "Your very long email text here... (500+ characters)"
   }
   ```

## 3. Frontend Testing

### Manual Testing Checklist

- [ ] Page loads correctly
- [ ] Character counter updates on input
- [ ] Check button is disabled when textarea is empty
- [ ] Check button is enabled when there's text
- [ ] Loading spinner appears during API call
- [ ] Result section displays after successful prediction
- [ ] Confidence bar animates correctly
- [ ] Error section displays on API failure
- [ ] Clear button works
- [ ] Sample button loads example email
- [ ] API status indicator works
- [ ] Responsive design on mobile

### Browser Testing

Test in multiple browsers:
- Chrome/Edge
- Firefox
- Safari (Mac)
- Mobile browsers

## 4. Integration Testing

### End-to-End Test Script

Create `test_e2e.py`:

```python
import requests
import time

API_URL = "http://localhost:8000/api"

def test_health_check():
    print("Testing health check...")
    response = requests.get(f"{API_URL}/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    print("✅ Health check passed")

def test_spam_prediction():
    print("Testing spam prediction...")
    data = {
        "email_text": "WINNER! You won $1,000,000! Click NOW!!!"
    }
    response = requests.post(f"{API_URL}/predict/", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["prediction"] == "spam"
    print(f"✅ Spam prediction passed (confidence: {result['confidence']})")

def test_ham_prediction():
    print("Testing ham prediction...")
    data = {
        "email_text": "Hi, can we schedule a meeting tomorrow?"
    }
    response = requests.post(f"{API_URL}/predict/", json=data)
    assert response.status_code == 200
    result = response.json()
    assert result["status"] == "success"
    assert result["prediction"] == "ham"
    print(f"✅ Ham prediction passed (confidence: {result['confidence']})")

def test_error_handling():
    print("Testing error handling...")
    data = {"email_text": ""}
    response = requests.post(f"{API_URL}/predict/", json=data)
    assert response.status_code == 400
    print("✅ Error handling passed")

if __name__ == "__main__":
    print("Starting E2E tests...")
    test_health_check()
    test_spam_prediction()
    test_ham_prediction()
    test_error_handling()
    print("\n🎉 All tests passed!")
```

Run:
```bash
python test_e2e.py
```

## 5. Model Performance Testing

### Test Dataset Evaluation

In Jupyter notebook:

```python
import pandas as pd
from sklearn.metrics import classification_report, confusion_matrix
import joblib

# Load test data
X_test = ...  # Your test features
y_test = ...  # Your test labels

# Load model
model = joblib.load('model.pkl')
vectorizer = joblib.load('vectorizer.pkl')

# Make predictions
y_pred = model.predict(X_test)

# Evaluate
print(classification_report(y_test, y_pred))
print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))
```

### Test with Real Examples

```python
test_emails = [
    ("Get rich quick! Make $5000/day from home!", "spam"),
    ("Your order has been shipped", "ham"),
    ("FREE VIAGRA! Buy now!", "spam"),
    ("Meeting minutes from yesterday's call", "ham"),
    ("URGENT: Verify your account NOW!", "spam"),
    ("Thanks for your help today", "ham"),
]

correct = 0
for email, expected in test_emails:
    # Preprocess and predict
    prediction = predict(email)
    if prediction == expected:
        correct += 1
        print(f"✅ {email[:30]}... -> {prediction}")
    else:
        print(f"❌ {email[:30]}... -> {prediction} (expected {expected})")

accuracy = correct / len(test_emails) * 100
print(f"\nAccuracy on test cases: {accuracy}%")
```

## 6. Performance Testing

### Test Response Time

```python
import requests
import time

def test_response_time(num_requests=10):
    url = "http://localhost:8000/api/predict/"
    email = "Test email for performance testing"
    
    times = []
    for i in range(num_requests):
        start = time.time()
        response = requests.post(url, json={"email_text": email})
        end = time.time()
        times.append(end - start)
    
    avg_time = sum(times) / len(times)
    print(f"Average response time: {avg_time:.3f} seconds")
    print(f"Min: {min(times):.3f}s, Max: {max(times):.3f}s")

test_response_time()
```

## 7. Security Testing

### Test SQL Injection (should be safe with Django ORM)
```json
{
    "email_text": "'; DROP TABLE users; --"
}
```

### Test XSS (should be escaped in frontend)
```json
{
    "email_text": "<script>alert('XSS')</script>"
}
```

### Test Large Payload
```json
{
    "email_text": "A" * 1000000
}
```

## 8. Load Testing (Optional)

Use Apache Bench:
```bash
ab -n 100 -c 10 -p test.json -T application/json http://localhost:8000/api/predict/
```

## Test Results Checklist

- [ ] All unit tests pass
- [ ] API returns correct predictions
- [ ] Error handling works
- [ ] Frontend displays results correctly
- [ ] Model accuracy > 90%
- [ ] Response time < 1 second
- [ ] No security vulnerabilities
- [ ] Works across browsers

## Common Issues & Solutions

### Issue: Models not loading
**Solution:** Check file paths, ensure model.pkl and vectorizer.pkl exist

### Issue: CORS errors
**Solution:** Verify django-cors-headers is installed and configured

### Issue: Slow predictions
**Solution:** Check if models are loaded once (not on each request)

### Issue: Inconsistent predictions
**Solution:** Verify preprocessing is identical in training and prediction

---

**📝 Note:** Keep track of all test results for your project documentation and viva presentation.
