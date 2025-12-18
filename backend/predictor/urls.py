"""
URL configuration for predictor app.
"""
from django.urls import path
from .views import predict_email, health_check, predict_batch

urlpatterns = [
    path('predict/', predict_email, name='predict'),
    path('predict-batch/', predict_batch, name='predict_batch'),
    path('health/', health_check, name='health_check'),
]
