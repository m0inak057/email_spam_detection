"""
Script to train and save all 4 models for model comparison feature.
This script trains Naive Bayes, Logistic Regression, Random Forest, and SVM models.
"""
import pandas as pd
import joblib
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
import sys

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from backend.predictor.ml.preprocess import clean_text

print("🚀 Starting model training for all 4 models...")

# Load cleaned dataset
DATA_PATH = os.path.join(os.path.dirname(__file__), 'spam_cleaned.csv')
if not os.path.exists(DATA_PATH):
    print(f"❌ Dataset not found at {DATA_PATH}")
    print("Please run the EDA notebook first to generate spam_cleaned.csv")
    exit(1)

print(f"📂 Loading dataset from {DATA_PATH}...")
df = pd.read_csv(DATA_PATH)
print(f"✅ Dataset loaded: {len(df)} emails")

# Prepare data
print("\n🧹 Cleaning email text...")
df['cleaned_message'] = df['message'].apply(clean_text)

# Create labels (0 for ham, 1 for spam)
df['label_encoded'] = df['label'].map({'ham': 'ham', 'spam': 'spam'})

# Split data
X = df['cleaned_message']
y = df['label_encoded']
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print(f"📊 Training set: {len(X_train)} emails")
print(f"📊 Test set: {len(X_test)} emails")

# Create and fit vectorizer
print("\n🔤 Creating TF-IDF vectorizer...")
vectorizer = TfidfVectorizer(max_features=3000)
X_train_vectorized = vectorizer.fit_transform(X_train)
X_test_vectorized = vectorizer.transform(X_test)

# Save vectorizer (only once)
vectorizer_path = os.path.join(os.path.dirname(__file__), '..', 'backend', 'predictor', 'ml', 'vectorizer.pkl')
joblib.dump(vectorizer, vectorizer_path)
print(f"✅ Vectorizer saved to {vectorizer_path}")

# Define all 4 models
models = {
    'Naive Bayes': MultinomialNB(),
    'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
    'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
    'SVM': SVC(kernel='linear', probability=True, random_state=42)
}

# Train and save each model
print("\n🤖 Training all models...\n")
ml_dir = os.path.join(os.path.dirname(__file__), '..', 'backend', 'predictor', 'ml')

for model_name, model in models.items():
    print(f"Training {model_name}...")
    
    # Train model
    model.fit(X_train_vectorized, y_train)
    
    # Calculate accuracy
    accuracy = model.score(X_test_vectorized, y_test)
    print(f"   ✅ Accuracy: {accuracy * 100:.2f}%")
    
    # Save model
    model_filename = {
        'Naive Bayes': 'model_nb.pkl',
        'Logistic Regression': 'model_lr.pkl',
        'Random Forest': 'model_rf.pkl',
        'SVM': 'model_svm.pkl'
    }[model_name]
    
    model_path = os.path.join(ml_dir, model_filename)
    joblib.dump(model, model_path)
    print(f"   💾 Saved to {model_filename}\n")

# Also save the best model as default model.pkl (SVM usually performs best)
best_model = models['SVM']
default_model_path = os.path.join(ml_dir, 'model.pkl')
joblib.dump(best_model, default_model_path)
print(f"🏆 Best model (SVM) also saved as model.pkl for default predictions")

print("\n✨ All models trained and saved successfully!")
print(f"📁 Models location: {ml_dir}")
print("\n📋 Model files created:")
print("   - model_nb.pkl (Naive Bayes)")
print("   - model_lr.pkl (Logistic Regression)")
print("   - model_rf.pkl (Random Forest)")
print("   - model_svm.pkl (SVM)")
print("   - model.pkl (Default - SVM)")
print("   - vectorizer.pkl")
print("\n🎉 Model comparison feature is now ready!")
