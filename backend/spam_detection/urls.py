"""
URL configuration for spam_detection project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

@require_http_methods(["GET"])
def root_view(request):
    """Root endpoint with API information."""
    return JsonResponse({
        'message': 'Email Spam Detection API',
        'version': '1.0',
        'endpoints': {
            'health_check': '/api/health/',
            'predict': '/api/predict/ (POST)',
            'admin': '/admin/'
        },
        'status': 'running'
    })

urlpatterns = [
    path('', root_view, name='root'),
    path('admin/', admin.site.urls),
    path('api/', include('predictor.urls')),
]
