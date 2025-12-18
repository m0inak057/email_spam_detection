"""
Views for spam prediction API.
"""
import json
import os
import re
import joblib
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .ml.preprocess import clean_text

# Load model and vectorizer once at startup (best practice)
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'ml', 'model.pkl')
VECTORIZER_PATH = os.path.join(os.path.dirname(__file__), 'ml', 'vectorizer.pkl')

# Paths for all 4 models
ML_DIR = os.path.join(os.path.dirname(__file__), 'ml')
MODEL_PATHS = {
    'Naive Bayes': os.path.join(ML_DIR, 'model_nb.pkl'),
    'Logistic Regression': os.path.join(ML_DIR, 'model_lr.pkl'),
    'Random Forest': os.path.join(ML_DIR, 'model_rf.pkl'),
    'SVM': os.path.join(ML_DIR, 'model_svm.pkl')
}

# Global variables to store loaded models
model = None
vectorizer = None
all_models = {}

def load_models():
    """Load ML model and vectorizer if they exist."""
    global model, vectorizer, all_models
    
    if os.path.exists(MODEL_PATH) and os.path.exists(VECTORIZER_PATH):
        try:
            model = joblib.load(MODEL_PATH)
            vectorizer = joblib.load(VECTORIZER_PATH)
            print("✅ Models loaded successfully!")
            
            # Try to load all 4 models for comparison
            for model_name, model_path in MODEL_PATHS.items():
                if os.path.exists(model_path):
                    try:
                        all_models[model_name] = joblib.load(model_path)
                        print(f"✅ {model_name} loaded!")
                    except Exception as e:
                        print(f"⚠️ Could not load {model_name}: {e}")
            
            return True
        except Exception as e:
            print(f"❌ Error loading models: {e}")
            return False
    else:
        print("⚠️ Model files not found. Please train the model first.")
        return False

# Load models at startup
load_models()


def analyze_spam_indicators(text):
    """
    Analyze email text for spam indicators.
    Returns dictionary with various spam signals.
    """
    indicators = {
        'suspicious_keywords': [],
        'url_count': 0,
        'caps_percentage': 0.0,
        'exclamation_count': 0,
        'money_terms': [],
        'urgency_words': []
    }
    
    # Define spam keyword lists
    spam_keywords = [
        'free', 'win', 'winner', 'cash', 'prize', 'claim', 'urgent', 'limited',
        'offer', 'deal', 'discount', 'save', 'money', 'credit', 'loan', 'debt',
        'guarantee', 'bonus', 'gift', 'congratulations', 'selected', 'apply now',
        'click here', 'act now', 'order now', 'buy now', 'subscribe', 'unsubscribe'
    ]
    
    money_keywords = [
        '$', '€', '£', 'usd', 'dollar', 'price', 'cost', 'pay', 'payment',
        'money', 'cash', 'credit', 'account', 'bank', 'invest', 'profit'
    ]
    
    urgency_keywords = [
        'urgent', 'immediate', 'now', 'hurry', 'limited time', 'expires',
        'act now', 'don\'t miss', 'last chance', 'today only', 'asap'
    ]
    
    text_lower = text.lower()
    
    # Detect suspicious keywords
    for keyword in spam_keywords:
        if keyword in text_lower:
            indicators['suspicious_keywords'].append(keyword.upper())
    
    # Count URLs
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    indicators['url_count'] = len(re.findall(url_pattern, text))
    
    # Calculate capitalization percentage
    if len(text) > 0:
        caps_count = sum(1 for c in text if c.isupper())
        indicators['caps_percentage'] = round((caps_count / len(text)) * 100, 2)
    
    # Count exclamation marks
    indicators['exclamation_count'] = text.count('!')
    
    # Detect money-related terms
    for term in money_keywords:
        if term in text_lower:
            indicators['money_terms'].append(term.upper())
    
    # Detect urgency words
    for word in urgency_keywords:
        if word in text_lower:
            indicators['urgency_words'].append(word.upper())
    
    # Limit lists to top 10 items for readability
    indicators['suspicious_keywords'] = indicators['suspicious_keywords'][:10]
    indicators['money_terms'] = list(set(indicators['money_terms']))[:10]
    indicators['urgency_words'] = list(set(indicators['urgency_words']))[:10]
    
    return indicators


def calculate_risk_level(prediction, confidence, indicators):
    """
    Calculate risk level based on prediction, confidence, and spam indicators.
    Returns: "Low", "Medium", "High", or "Critical"
    """
    # Base risk on prediction
    if prediction == "ham":
        # For legitimate emails, risk is generally low
        if confidence > 0.9:
            return "Low"
        elif confidence > 0.7:
            return "Medium"
        else:
            return "Medium"  # Lower confidence on ham = medium risk
    
    else:  # spam
        # Calculate indicator score
        indicator_score = 0
        indicator_score += min(len(indicators['suspicious_keywords']), 5)  # Max 5 points
        indicator_score += min(indicators['url_count'], 3)  # Max 3 points
        indicator_score += 1 if indicators['caps_percentage'] > 30 else 0
        indicator_score += min(indicators['exclamation_count'] // 3, 2)  # Max 2 points
        indicator_score += min(len(indicators['money_terms']), 3)  # Max 3 points
        indicator_score += min(len(indicators['urgency_words']), 2)  # Max 2 points
        # Max total: 15 points
        
        # Determine risk level
        if confidence > 0.95 and indicator_score >= 8:
            return "Critical"
        elif confidence > 0.85 or indicator_score >= 6:
            return "High"
        elif confidence > 0.7 or indicator_score >= 3:
            return "Medium"
        else:
            return "Low"


def generate_safety_recommendations(prediction, risk_level):
    """
    Generate contextual safety recommendations based on prediction and risk level.
    """
    recommendations = []
    
    if prediction == "spam":
        if risk_level == "Critical":
            recommendations = [
                "🚨 DO NOT click any links or download attachments",
                "🗑️ Delete this email immediately",
                "⚠️ Do not respond or provide any personal information",
                "🔒 Report this email as spam to your email provider",
                "👤 Verify sender's email address - it may be spoofed"
            ]
        elif risk_level == "High":
            recommendations = [
                "⚠️ This email shows strong spam characteristics",
                "🔗 Avoid clicking any links in this email",
                "📧 Verify the sender through an independent channel",
                "🗑️ Consider deleting or moving to spam folder",
                "🔍 Check for spelling errors and suspicious formatting"
            ]
        elif risk_level == "Medium":
            recommendations = [
                "⚠️ Exercise caution with this email",
                "🔍 Verify the sender's identity before taking action",
                "🔗 Hover over links to check destinations before clicking",
                "📞 Contact the sender through official channels if unsure",
                "❌ Don't provide sensitive information via email"
            ]
        else:  # Low
            recommendations = [
                "ℹ️ This email has some spam-like characteristics",
                "🔍 Review the content carefully before responding",
                "✅ Verify sender identity if requesting sensitive actions",
                "💡 When in doubt, contact sender through official channels"
            ]
    else:  # ham
        if risk_level == "Low":
            recommendations = [
                "✅ This email appears to be legitimate",
                "💡 Always verify unexpected requests, even from known senders",
                "🔒 Keep your personal information secure",
                "🔍 Stay vigilant for phishing attempts"
            ]
        else:  # Medium
            recommendations = [
                "ℹ️ This email seems legitimate but shows some unusual patterns",
                "🔍 Verify the sender if the email requests sensitive actions",
                "💡 Contact the sender directly if anything seems suspicious",
                "⚠️ Be cautious with links and attachments"
            ]
    
    return recommendations


def get_word_importance(email_text, cleaned_text, prediction):
    """
    Analyze word-level contribution to spam/ham classification.
    Returns list of words with their importance scores.
    """
    try:
        if vectorizer is None or model is None:
            return []
        
        # Get feature names from vectorizer
        feature_names = vectorizer.get_feature_names_out()
        
        # Transform the cleaned text
        text_vector = vectorizer.transform([cleaned_text])
        
        # Get model coefficients (for linear models like Logistic Regression)
        word_scores = []
        
        if hasattr(model, 'coef_'):
            # For linear models (Logistic Regression, SVM)
            coefficients = model.coef_[0]
            
            # Get non-zero features in the current email
            non_zero_features = text_vector.toarray()[0].nonzero()[0]
            
            for idx in non_zero_features:
                word = feature_names[idx]
                # Higher positive coefficient = more spam-like
                # Higher negative coefficient = more ham-like
                importance = float(coefficients[idx])
                word_scores.append({
                    'word': word,
                    'importance': importance,
                    'type': 'spam' if importance > 0 else 'ham'
                })
        
        elif hasattr(model, 'feature_log_prob_'):
            # For Naive Bayes
            # Get log probabilities for spam (class 1) and ham (class 0)
            spam_log_prob = model.feature_log_prob_[1]
            ham_log_prob = model.feature_log_prob_[0]
            
            # Get non-zero features in the current email
            non_zero_features = text_vector.toarray()[0].nonzero()[0]
            
            for idx in non_zero_features:
                word = feature_names[idx]
                # Difference in log probabilities
                importance = float(spam_log_prob[idx] - ham_log_prob[idx])
                word_scores.append({
                    'word': word,
                    'importance': importance,
                    'type': 'spam' if importance > 0 else 'ham'
                })
        
        # Sort by absolute importance and return top 20
        word_scores.sort(key=lambda x: abs(x['importance']), reverse=True)
        return word_scores[:20]
        
    except Exception as e:
        print(f"Error calculating word importance: {e}")
        return []


def extract_patterns(text):
    """
    Extract various patterns from email text (URLs, emails, phone numbers, etc.)
    Returns dictionary with detected patterns.
    """
    patterns = {
        'urls': [],
        'email_addresses': [],
        'phone_numbers': [],
        'ip_addresses': [],
        'dollar_amounts': [],
        'percentages': []
    }
    
    # URL pattern
    url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
    patterns['urls'] = re.findall(url_pattern, text)
    
    # Email address pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    patterns['email_addresses'] = re.findall(email_pattern, text)
    
    # Phone number patterns (various formats)
    phone_pattern = r'(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    patterns['phone_numbers'] = re.findall(phone_pattern, text)
    
    # IP address pattern
    ip_pattern = r'\b(?:\d{1,3}\.){3}\d{1,3}\b'
    patterns['ip_addresses'] = re.findall(ip_pattern, text)
    
    # Dollar amounts
    dollar_pattern = r'\$\s*\d+(?:,\d{3})*(?:\.\d{2})?'
    patterns['dollar_amounts'] = re.findall(dollar_pattern, text)
    
    # Percentages
    percentage_pattern = r'\d+(?:\.\d+)?%'
    patterns['percentages'] = re.findall(percentage_pattern, text)
    
    # Limit each list to 10 items
    for key in patterns:
        patterns[key] = patterns[key][:10]
    
    return patterns


def get_all_model_predictions(email_text, cleaned_text):
    """
    Get predictions from all available models for comparison.
    Returns list of model predictions with confidence scores.
    """
    if not vectorizer or not all_models:
        return None
    
    # Vectorize the input
    email_vectorized = vectorizer.transform([cleaned_text])
    
    model_results = []
    predictions_list = []
    
    # Get prediction from each model
    for model_name, trained_model in all_models.items():
        try:
            # Get prediction and probability
            prediction = trained_model.predict(email_vectorized)[0]
            
            # Get confidence (probability of predicted class)
            if hasattr(trained_model, 'predict_proba'):
                proba = trained_model.predict_proba(email_vectorized)[0]
                confidence = float(max(proba))
            elif hasattr(trained_model, 'decision_function'):
                # For SVM without probability
                decision = trained_model.decision_function(email_vectorized)[0]
                confidence = float(min(max(decision, 0), 1))
            else:
                confidence = 0.5  # Default if no probability available
            
            model_results.append({
                'model_name': model_name,
                'prediction': prediction,
                'confidence': round(confidence * 100, 2)
            })
            
            predictions_list.append(prediction)
            
        except Exception as e:
            print(f"Error with {model_name}: {e}")
            continue
    
    # Calculate agreement (percentage of models that agree)
    if predictions_list:
        # Count most common prediction
        spam_count = predictions_list.count('spam')
        ham_count = predictions_list.count('ham')
        total_models = len(predictions_list)
        
        agreement_percentage = round((max(spam_count, ham_count) / total_models) * 100, 1)
    else:
        agreement_percentage = 0.0
    
    return {
        'models': model_results,
        'agreement': agreement_percentage,
        'total_models': len(model_results)
    }


@csrf_exempt
@require_http_methods(["POST"])
def predict_email(request):
    """
    API endpoint to predict if an email is spam or not.
    
    Request JSON:
    {
        "email_text": "Your email content here..."
    }
    
    Response JSON:
    {
        "prediction": "spam" or "ham",
        "confidence": 0.95,
        "status": "success"
    }
    """
    try:
        # Check if models are loaded
        if model is None or vectorizer is None:
            return JsonResponse({
                'status': 'error',
                'message': 'Models not loaded. Please train the model first.'
            }, status=503)
        
        # Parse request body
        data = json.loads(request.body)
        email_text = data.get('email_text', '')
        
        if not email_text:
            return JsonResponse({
                'status': 'error',
                'message': 'Email text is required'
            }, status=400)
        
        # Step 1: Clean and preprocess the text
        cleaned_text = clean_text(email_text)
        
        # Step 2: Convert to TF-IDF vector
        text_vector = vectorizer.transform([cleaned_text])
        
        # Step 3: Make prediction
        prediction = model.predict(text_vector)[0]
        
        # Step 4: Get confidence score (probability)
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(text_vector)[0]
            confidence = float(max(probabilities))
        else:
            # For models without predict_proba, use decision_function
            if hasattr(model, 'decision_function'):
                decision = model.decision_function(text_vector)[0]
                confidence = float(1 / (1 + abs(decision)))  # Simple conversion
            else:
                confidence = 0.0
        
        # Step 5: Format prediction label
        prediction_label = "spam" if prediction == 1 else "ham"
        
        # Step 6: Analyze spam indicators
        spam_indicators = analyze_spam_indicators(email_text)
        
        # Step 7: Calculate risk level
        risk_level = calculate_risk_level(prediction_label, confidence, spam_indicators)
        
        # Step 8: Generate safety recommendations
        safety_recommendations = generate_safety_recommendations(prediction_label, risk_level)
        
        # Step 9: Get word importance scores
        word_importance = get_word_importance(email_text, cleaned_text, prediction)
        
        # Step 10: Extract patterns
        patterns = extract_patterns(email_text)
        
        # Step 11: Get predictions from all models (if available)
        model_comparison = get_all_model_predictions(email_text, cleaned_text)
        
        # Step 12: Return enhanced response
        response_data = {
            'status': 'success',
            'prediction': prediction_label,
            'confidence': round(confidence, 4),
            'email_length': len(email_text),
            'cleaned_length': len(cleaned_text),
            'spam_indicators': spam_indicators,
            'risk_level': risk_level,
            'safety_recommendations': safety_recommendations,
            'word_importance': word_importance,
            'patterns': patterns
        }
        
        # Add model comparison if available
        if model_comparison:
            response_data['model_comparison'] = model_comparison
        
        return JsonResponse(response_data)
        
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON format'
        }, status=400)
    
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Prediction error: {str(e)}'
        }, status=500)


@require_http_methods(["GET"])
def health_check(request):
    """
    Health check endpoint to verify if the API is running.
    """
    models_loaded = model is not None and vectorizer is not None
    
    return JsonResponse({
        'status': 'healthy',
        'models_loaded': models_loaded,
        'message': 'Email Spam Detection API is running!'
    })


@csrf_exempt
@require_http_methods(["POST"])
def predict_batch(request):
    """
    API endpoint to predict multiple emails at once.
    
    Request JSON:
    {
        "emails": [
            {"id": 1, "text": "Email content 1"},
            {"id": 2, "text": "Email content 2"},
            ...
        ]
    }
    
    Response JSON:
    {
        "status": "success",
        "results": [
            {
                "id": 1,
                "prediction": "spam",
                "confidence": 0.95,
                "risk_level": "High"
            },
            ...
        ],
        "summary": {
            "total": 10,
            "spam_count": 3,
            "ham_count": 7,
            "avg_confidence": 0.89
        }
    }
    """
    try:
        # Check if models are loaded
        if model is None or vectorizer is None:
            return JsonResponse({
                'status': 'error',
                'message': 'Models not loaded. Please train the model first.'
            }, status=503)
        
        # Parse request body
        data = json.loads(request.body)
        emails = data.get('emails', [])
        
        if not emails:
            return JsonResponse({
                'status': 'error',
                'message': 'No emails provided for batch processing'
            }, status=400)
        
        if len(emails) > 100:
            return JsonResponse({
                'status': 'error',
                'message': 'Maximum 100 emails allowed per batch'
            }, status=400)
        
        results = []
        total_confidence = 0
        spam_count = 0
        ham_count = 0
        
        for email_data in emails:
            email_id = email_data.get('id', '')
            email_text = email_data.get('text', '')
            
            if not email_text:
                results.append({
                    'id': email_id,
                    'status': 'error',
                    'message': 'Empty email text'
                })
                continue
            
            try:
                # Clean and preprocess
                cleaned_text = clean_text(email_text)
                
                # Transform to vector
                text_vector = vectorizer.transform([cleaned_text])
                
                # Predict
                prediction = model.predict(text_vector)[0]
                
                # Get confidence
                if hasattr(model, 'predict_proba'):
                    probabilities = model.predict_proba(text_vector)[0]
                    confidence = float(max(probabilities))
                else:
                    confidence = 0.5
                
                # Format prediction
                prediction_label = "spam" if prediction == 1 else "ham"
                
                # Analyze indicators
                spam_indicators = analyze_spam_indicators(email_text)
                
                # Calculate risk level
                risk_level = calculate_risk_level(prediction_label, confidence, spam_indicators)
                
                # Count spam/ham
                if prediction_label == "spam":
                    spam_count += 1
                else:
                    ham_count += 1
                
                total_confidence += confidence
                
                results.append({
                    'id': email_id,
                    'status': 'success',
                    'prediction': prediction_label,
                    'confidence': round(confidence, 4),
                    'risk_level': risk_level,
                    'email_length': len(email_text),
                    'url_count': spam_indicators['url_count'],
                    'suspicious_keywords_count': len(spam_indicators['suspicious_keywords'])
                })
                
            except Exception as e:
                results.append({
                    'id': email_id,
                    'status': 'error',
                    'message': str(e)
                })
        
        # Calculate summary statistics
        successful_predictions = [r for r in results if r.get('status') == 'success']
        avg_confidence = total_confidence / len(successful_predictions) if successful_predictions else 0
        
        return JsonResponse({
            'status': 'success',
            'results': results,
            'summary': {
                'total': len(emails),
                'processed': len(successful_predictions),
                'failed': len(emails) - len(successful_predictions),
                'spam_count': spam_count,
                'ham_count': ham_count,
                'avg_confidence': round(avg_confidence, 4)
            }
        })
        
    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'Invalid JSON format'
        }, status=400)
    
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'Batch prediction error: {str(e)}'
        }, status=500)
