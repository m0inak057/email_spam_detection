#!/usr/bin/env python
"""
Quick test script to verify the spam detection system is working.
Run this after starting the Django server.
"""
import requests
import json

API_URL = "http://127.0.0.1:8000/api"

def test_root():
    """Test root endpoint."""
    print("1. Testing root endpoint...")
    try:
        response = requests.get("http://127.0.0.1:8000/")
        print(f"   ✅ Status: {response.status_code}")
        print(f"   Response: {response.json()}\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")

def test_health():
    """Test health check endpoint."""
    print("2. Testing health check endpoint...")
    try:
        response = requests.get(f"{API_URL}/health/")
        data = response.json()
        print(f"   ✅ Status: {response.status_code}")
        print(f"   Models Loaded: {data.get('models_loaded', False)}")
        print(f"   Response: {data}\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")

def test_spam_prediction():
    """Test spam email prediction."""
    print("3. Testing spam email prediction...")
    spam_email = "WINNER! You have won $1,000,000! Click here NOW to claim your prize!!!"
    
    try:
        response = requests.post(
            f"{API_URL}/predict/",
            json={"email_text": spam_email},
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        print(f"   ✅ Status: {response.status_code}")
        print(f"   Prediction: {data.get('prediction', 'N/A')}")
        print(f"   Confidence: {data.get('confidence', 0):.2%}")
        print(f"   Full Response: {data}\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")

def test_ham_prediction():
    """Test legitimate email prediction."""
    print("4. Testing legitimate email prediction...")
    ham_email = "Hi John, can we schedule a meeting tomorrow at 3pm to discuss the project?"
    
    try:
        response = requests.post(
            f"{API_URL}/predict/",
            json={"email_text": ham_email},
            headers={"Content-Type": "application/json"}
        )
        data = response.json()
        print(f"   ✅ Status: {response.status_code}")
        print(f"   Prediction: {data.get('prediction', 'N/A')}")
        print(f"   Confidence: {data.get('confidence', 0):.2%}")
        print(f"   Full Response: {data}\n")
    except Exception as e:
        print(f"   ❌ Error: {e}\n")

def main():
    print("="*60)
    print("Email Spam Detection API - Test Suite")
    print("="*60)
    print("\nMake sure Django server is running on port 8000!\n")
    
    test_root()
    test_health()
    test_spam_prediction()
    test_ham_prediction()
    
    print("="*60)
    print("✅ Testing Complete!")
    print("="*60)

if __name__ == "__main__":
    main()
