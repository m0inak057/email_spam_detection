// Configuration
// In development we call the local Django server.
// In production (e.g. Vercel), we call the Render backend.
const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
// TODO: replace this with your actual Render base URL, e.g.
// 'https://your-service-name.onrender.com'
const RENDER_BASE_URL = 'https://email-spam-detection-rdtq.onrender.com';

const API_BASE = isLocalhost ? 'http://localhost:8000' : RENDER_BASE_URL;
const API_URL = `${API_BASE}/api`;
const PREDICT_ENDPOINT = `${API_URL}/predict/`;
const BATCH_ENDPOINT = `${API_URL}/predict-batch/`;
const HEALTH_ENDPOINT = `${API_URL}/health/`;

// Global variable to store current result data for export
let currentResultData = null;

// DOM Elements
const emailInput = document.getElementById('emailInput');
const checkBtn = document.getElementById('checkBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const charCount = document.getElementById('charCount');
const resultSection = document.getElementById('resultSection');
const errorSection = document.getElementById('errorSection');
const apiStatus = document.getElementById('apiStatus');

// Result Elements
const resultBadge = document.getElementById('resultBadge');
const badgeIcon = document.getElementById('badgeIcon');
const badgeText = document.getElementById('badgeText');
const confidenceValue = document.getElementById('confidenceValue');
const confidenceFill = document.getElementById('confidenceFill');
const emailLength = document.getElementById('emailLength');
const cleanedLength = document.getElementById('cleanedLength');
const resultExplanation = document.getElementById('resultExplanation');
const errorMessage = document.getElementById('errorMessage');

// New Feature Elements
const riskIndicator = document.getElementById('riskIndicator');
const riskLabel = document.getElementById('riskLabel');
const riskIcon = document.getElementById('riskIcon');
const urlCount = document.getElementById('urlCount');
const capsPercentage = document.getElementById('capsPercentage');
const exclamationCount = document.getElementById('exclamationCount');
const moneyTermsCount = document.getElementById('moneyTermsCount');
const keywordsContainer = document.getElementById('keywordsContainer');
const recommendationsList = document.getElementById('recommendationsList');

// History Dashboard Elements
const totalScansEl = document.getElementById('totalScans');
const spamCaughtEl = document.getElementById('spamCaught');
const legitimateEmailsEl = document.getElementById('legitimateEmails');
const successRateEl = document.getElementById('successRate');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// History Storage
let scanHistory = JSON.parse(localStorage.getItem('scanHistory')) || [];

// Batch processing
let batchResults = null;
let csvData = null;

// Sample emails for testing
const sampleEmails = [
    "Congratulations! You have won $1,000,000! Click here to claim your prize NOW!!! Visit http://spam-site.com immediately!",
    "Hi John, can we reschedule our meeting to 3pm tomorrow? Let me know if that works for you.",
    "FREE! Win big money playing casino games. Text WIN to 12345 now! Don't miss this amazing opportunity!!!",
    "Your Amazon order #123-456789 has been shipped and will arrive in 2-3 business days. Track your package here.",
    "URGENT: Your account will be suspended unless you verify your password immediately! Click here to avoid account closure!",
];

// Event Listeners
emailInput.addEventListener('input', () => {
    updateCharCount();
    updateLivePreview();
});
checkBtn.addEventListener('click', checkEmail);
clearBtn.addEventListener('click', clearInput);
sampleBtn.addEventListener('click', loadSampleEmail);
clearHistoryBtn.addEventListener('click', clearHistory);

// Initialize
checkApiStatus();
updateCharCount();
updateDashboard();

// Functions
function updateCharCount() {
    const count = emailInput.value.length;
    charCount.textContent = count;
    
    // Enable/disable check button based on input
    if (count > 0) {
        checkBtn.disabled = false;
    } else {
        checkBtn.disabled = true;
    }
}

function updateLivePreview() {
    const text = emailInput.value;
    const previewPanel = document.getElementById('livePreviewPanel');
    const previewContent = document.getElementById('previewContent');
    const wordCountEl = document.getElementById('wordCount');
    const sentenceCountEl = document.getElementById('sentenceCount');
    const urlCountPreviewEl = document.getElementById('urlCountPreview');
    const capsPreviewEl = document.getElementById('capsPreview');
    
    if (text.length === 0) {
        previewPanel.style.display = 'none';
        return;
    }
    
    previewPanel.style.display = 'block';
    
    // Update preview content
    const preview = text.length > 200 ? text.substring(0, 200) + '...' : text;
    previewContent.textContent = preview;
    
    // Calculate statistics
    const words = text.trim().split(/\s+/).filter(w => w.length > 0);
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const urlPattern = /https?:\/\/[^\s]+/g;
    const urls = text.match(urlPattern) || [];
    const capsCount = (text.match(/[A-Z]/g) || []).length;
    const capsPercentage = text.length > 0 ? ((capsCount / text.length) * 100).toFixed(1) : 0;
    
    wordCountEl.textContent = words.length;
    sentenceCountEl.textContent = sentences.length;
    urlCountPreviewEl.textContent = urls.length;
    capsPreviewEl.textContent = `${capsPercentage}%`;
}

function clearInput() {
    emailInput.value = '';
    updateCharCount();
    updateLivePreview();
    hideResults();
}

function loadSampleEmail() {
    const randomEmail = sampleEmails[Math.floor(Math.random() * sampleEmails.length)];
    emailInput.value = randomEmail;
    updateCharCount();
    updateLivePreview();
}

function hideResults() {
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
}

async function checkApiStatus() {
    try {
        const response = await fetch(HEALTH_ENDPOINT);
        const data = await response.json();
        
        if (data.status === 'healthy' && data.models_loaded) {
            apiStatus.textContent = 'Online ✓';
            apiStatus.className = 'status-indicator online';
        } else {
            apiStatus.textContent = 'Models Not Loaded';
            apiStatus.className = 'status-indicator offline';
        }
    } catch (error) {
        apiStatus.textContent = 'Offline ✗';
        apiStatus.className = 'status-indicator offline';
        console.error('API health check failed:', error);
    }
}

async function checkEmail() {
    const emailText = emailInput.value.trim();
    
    if (!emailText) {
        showError('Please enter email text to check.');
        return;
    }
    
    // Show loading state
    checkBtn.classList.add('loading');
    checkBtn.disabled = true;
    hideResults();
    
    try {
        const response = await fetch(PREDICT_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email_text: emailText
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            displayResult(data);
        } else {
            showError(data.message || 'An error occurred while checking the email.');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to connect to the API. Please make sure the backend server is running on http://localhost:8000');
    } finally {
        // Remove loading state
        checkBtn.classList.remove('loading');
        checkBtn.disabled = false;
    }
}

function displayResult(data) {
    // Store result data globally for export
    currentResultData = {
        ...data,
        emailText: emailInput.value,
        timestamp: new Date().toISOString()
    };
    
    // Hide error section
    errorSection.style.display = 'none';
    
    // Show result section
    resultSection.style.display = 'block';
    
    // Determine if spam or ham
    const isSpam = data.prediction.toLowerCase() === 'spam';
    
    // Update badge
    resultBadge.className = `result-badge ${isSpam ? 'spam' : 'ham'}`;
    badgeIcon.textContent = isSpam ? '⚠️' : '✅';
    badgeText.textContent = isSpam ? 'SPAM DETECTED' : 'LEGITIMATE EMAIL';
    
    // Update confidence
    const confidence = (data.confidence * 100).toFixed(2);
    confidenceValue.textContent = `${confidence}%`;
    confidenceFill.style.width = `${confidence}%`;
    
    // Update enhanced confidence visualization
    updateEnhancedConfidence(parseFloat(confidence));
    
    // Update details
    emailLength.textContent = `${data.email_length} characters`;
    cleanedLength.textContent = `${data.cleaned_length} characters`;
    
    // Update explanation
    const explanation = getExplanation(isSpam, confidence);
    resultExplanation.innerHTML = explanation;
    
    // Update Risk Level Indicator
    updateRiskIndicator(data.risk_level);
    
    // Update Spam Indicators
    updateSpamIndicators(data.spam_indicators);
    
    // Update Suspicious Keywords
    updateSuspiciousKeywords(data.spam_indicators.suspicious_keywords);
    
    // Update Safety Recommendations
    updateSafetyRecommendations(data.safety_recommendations, data.risk_level);
    
    // Update Word Importance Visualization
    if (data.word_importance && data.word_importance.length > 0) {
        updateWordImportance(data.word_importance);
    }
    
    // Update Pattern Analysis
    if (data.patterns) {
        updatePatterns(data.patterns);
    }
    
    // Update Model Comparison
    if (data.model_comparison) {
        updateModelComparison(data.model_comparison);
    }
    
    // Save to history
    saveToHistory({
        prediction: data.prediction,
        confidence: data.confidence,
        riskLevel: data.risk_level,
        emailText: emailInput.value,
        timestamp: new Date().toISOString()
    });
    
    // Scroll to result
    resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function updateRiskIndicator(riskLevel) {
    const riskIndicator = document.getElementById('riskIndicator');
    const riskLabel = document.getElementById('riskLabel');
    const riskIcon = document.getElementById('riskIcon');
    
    // Remove all risk classes
    riskIndicator.className = 'risk-indicator';
    
    // Map risk levels to display values
    const riskMap = {
        'Low': { class: 'low', icon: '✅', text: 'Low Risk' },
        'Medium': { class: 'medium', icon: '⚠️', text: 'Medium Risk' },
        'High': { class: 'high', icon: '🔴', text: 'High Risk' },
        'Critical': { class: 'critical', icon: '🚨', text: 'Critical Risk' }
    };
    
    const riskInfo = riskMap[riskLevel] || riskMap['Low'];
    
    riskIndicator.classList.add(riskInfo.class);
    riskIcon.textContent = riskInfo.icon;
    riskLabel.textContent = riskInfo.text;
}

function updateSpamIndicators(indicators) {
    // Update URL count
    document.getElementById('urlCount').textContent = indicators.url_count || 0;
    
    // Update capitalization percentage
    const capsPercentage = indicators.caps_percentage || 0;
    document.getElementById('capsPercentage').textContent = `${capsPercentage.toFixed(1)}%`;
    
    // Update exclamation count
    document.getElementById('exclamationCount').textContent = indicators.exclamation_count || 0;
    
    // Update money terms count
    const moneyTermsCount = indicators.money_terms ? indicators.money_terms.length : 0;
    document.getElementById('moneyTermsCount').textContent = moneyTermsCount;
}

function updateSuspiciousKeywords(keywords) {
    const keywordsContainer = document.getElementById('keywordsContainer');
    
    // Clear existing keywords
    keywordsContainer.innerHTML = '';
    
    if (!keywords || keywords.length === 0) {
        keywordsContainer.innerHTML = '<span class="no-keywords">No suspicious keywords detected</span>';
        return;
    }
    
    // Create badge for each keyword
    keywords.forEach(keyword => {
        const badge = document.createElement('span');
        badge.className = 'keyword-badge';
        badge.textContent = keyword.toUpperCase();
        keywordsContainer.appendChild(badge);
    });
}

function updateSafetyRecommendations(recommendations, riskLevel) {
    const recommendationsList = document.getElementById('recommendationsList');
    
    // Clear existing recommendations
    recommendationsList.innerHTML = '';
    
    if (!recommendations || recommendations.length === 0) {
        recommendationsList.innerHTML = '<div class="recommendation-item">No specific recommendations at this time.</div>';
        return;
    }
    
    // Map risk level to CSS class
    const riskClass = riskLevel.toLowerCase();
    
    // Create list item for each recommendation
    recommendations.forEach(recommendation => {
        const item = document.createElement('div');
        item.className = `recommendation-item ${riskClass}`;
        item.textContent = recommendation;
        recommendationsList.appendChild(item);
    });
}

function updateWordImportance(wordImportance) {
    const wordCloud = document.getElementById('wordCloud');
    const wordImportanceList = document.getElementById('wordImportanceList');
    
    // Clear existing content
    wordCloud.innerHTML = '';
    wordImportanceList.innerHTML = '';
    
    if (!wordImportance || wordImportance.length === 0) {
        wordCloud.innerHTML = '<div class="no-words">No word importance data available</div>';
        return;
    }
    
    // Find max absolute importance for scaling
    const maxImportance = Math.max(...wordImportance.map(w => Math.abs(w.importance)));
    
    // Create word cloud (top 10 words)
    wordImportance.slice(0, 10).forEach(wordData => {
        const bubble = document.createElement('div');
        bubble.className = `word-bubble ${wordData.type}`;
        bubble.textContent = wordData.word;
        bubble.setAttribute('data-score', `Score: ${wordData.importance.toFixed(3)}`);
        
        // Scale font size based on importance
        const fontSize = 14 + (Math.abs(wordData.importance) / maxImportance) * 16;
        bubble.style.fontSize = `${fontSize}px`;
        
        wordCloud.appendChild(bubble);
    });
    
    // Create detailed word list
    wordImportance.forEach(wordData => {
        const item = document.createElement('div');
        item.className = `word-item ${wordData.type}`;
        
        const absImportance = Math.abs(wordData.importance);
        const percentage = (absImportance / maxImportance) * 100;
        
        item.innerHTML = `
            <span class="word-item-text">${wordData.word}</span>
            <div class="word-item-score">
                <div class="importance-bar">
                    <div class="importance-fill ${wordData.type}" style="width: ${percentage}%"></div>
                </div>
                <span class="importance-value">${absImportance.toFixed(3)}</span>
            </div>
        `;
        
        wordImportanceList.appendChild(item);
    });
}

function updateEnhancedConfidence(confidence) {
    const confidenceFillEnhanced = document.getElementById('confidenceFillEnhanced');
    const confidencePercentage = document.getElementById('confidencePercentage');
    const confidenceLabel = document.getElementById('confidenceLabel');
    
    // Remove existing classes
    confidenceFillEnhanced.classList.remove('low', 'medium', 'high', 'very-high');
    confidenceLabel.classList.remove('low', 'medium', 'high', 'very-high');
    
    // Update width and percentage
    setTimeout(() => {
        confidenceFillEnhanced.style.width = `${confidence}%`;
        confidencePercentage.textContent = `${confidence.toFixed(1)}%`;
    }, 100);
    
    // Determine confidence level and color
    let level, label;
    if (confidence >= 95) {
        level = 'very-high';
        label = '🌟 Extremely High Confidence';
    } else if (confidence >= 85) {
        level = 'high';
        label = '✓ High Confidence';
    } else if (confidence >= 70) {
        level = 'medium';
        label = '⚡ Moderate Confidence';
    } else {
        level = 'low';
        label = '⚠ Low Confidence';
    }
    
    confidenceFillEnhanced.classList.add(level);
    confidenceLabel.classList.add(level);
    confidenceLabel.textContent = label;
}

function updatePatterns(patterns) {
    // Update URLs
    document.getElementById('patternsUrls').textContent = patterns.urls?.length || 0;
    const urlsList = document.getElementById('urlsList');
    urlsList.innerHTML = '';
    if (patterns.urls && patterns.urls.length > 0) {
        patterns.urls.forEach(url => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.textContent = url;
            urlsList.appendChild(item);
        });
    } else {
        urlsList.innerHTML = '<div style=\"color: var(--text-muted); font-style: italic; padding: 5px;\">None detected</div>';
    }
    
    // Update Email Addresses
    document.getElementById('patternsEmails').textContent = patterns.email_addresses?.length || 0;
    const emailsList = document.getElementById('emailsList');
    emailsList.innerHTML = '';
    if (patterns.email_addresses && patterns.email_addresses.length > 0) {
        patterns.email_addresses.forEach(email => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.textContent = email;
            emailsList.appendChild(item);
        });
    } else {
        emailsList.innerHTML = '<div style=\"color: var(--text-muted); font-style: italic; padding: 5px;\">None detected</div>';
    }
    
    // Update Phone Numbers
    document.getElementById('patternsPhones').textContent = patterns.phone_numbers?.length || 0;
    const phonesList = document.getElementById('phonesList');
    phonesList.innerHTML = '';
    if (patterns.phone_numbers && patterns.phone_numbers.length > 0) {
        patterns.phone_numbers.forEach(phone => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.textContent = phone;
            phonesList.appendChild(item);
        });
    } else {
        phonesList.innerHTML = '<div style=\"color: var(--text-muted); font-style: italic; padding: 5px;\">None detected</div>';
    }
    
    // Update Dollar Amounts
    document.getElementById('patternsDollars').textContent = patterns.dollar_amounts?.length || 0;
    const dollarsList = document.getElementById('dollarsList');
    dollarsList.innerHTML = '';
    if (patterns.dollar_amounts && patterns.dollar_amounts.length > 0) {
        patterns.dollar_amounts.forEach(amount => {
            const item = document.createElement('div');
            item.className = 'pattern-item';
            item.textContent = amount;
            dollarsList.appendChild(item);
        });
    } else {
        dollarsList.innerHTML = '<div style=\"color: var(--text-muted); font-style: italic; padding: 5px;\">None detected</div>';
    }
}

function updateModelComparison(modelComparison) {
    const section = document.getElementById('modelComparisonSection');
    const agreementValue = document.getElementById('modelAgreement');
    const agreementDescription = document.getElementById('agreementDescription');
    const modelsGrid = document.getElementById('modelsGrid');
    
    if (!modelComparison || !modelComparison.models || modelComparison.models.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    // Show section
    section.style.display = 'block';
    
    // Update agreement
    const agreement = modelComparison.agreement || 0;
    agreementValue.textContent = `${agreement}%`;
    
    // Update agreement description
    if (agreement === 100) {
        agreementDescription.textContent = '✅ All models agree on the prediction';
        agreementDescription.style.color = '#00ff41';
    } else if (agreement >= 75) {
        agreementDescription.textContent = '👍 Strong model consensus';
        agreementDescription.style.color = '#00ff88';
    } else if (agreement >= 50) {
        agreementDescription.textContent = '⚠️ Moderate agreement between models';
        agreementDescription.style.color = '#ffaa00';
    } else {
        agreementDescription.textContent = '❌ Models disagree significantly';
        agreementDescription.style.color = '#ff0040';
    }
    
    // Clear and populate models grid
    modelsGrid.innerHTML = '';
    
    modelComparison.models.forEach(modelData => {
        const card = document.createElement('div');
        card.className = 'model-card';
        
        const predictionClass = modelData.prediction === 'spam' ? 'spam' : 'ham';
        const predictionLabel = modelData.prediction === 'spam' ? '🚫 SPAM' : '✅ HAM';
        
        card.innerHTML = `
            <div class="model-name">${escapeHtml(modelData.model_name)}</div>
            <div class="model-prediction">
                <span class="model-prediction-label">Prediction:</span>
                <span class="model-prediction-badge ${predictionClass}">${predictionLabel}</span>
            </div>
            <div class="model-confidence">
                <div class="model-confidence-label">Confidence: ${modelData.confidence}%</div>
                <div class="model-confidence-bar">
                    <div class="model-confidence-fill" style="width: ${modelData.confidence}%"></div>
                </div>
            </div>
        `;
        
        modelsGrid.appendChild(card);
    });
}

function getExplanation(isSpam, confidence) {
    if (isSpam) {
        if (confidence > 90) {
            return `
                <h4>🚨 High Confidence Spam Detection</h4>
                <p>This email has been classified as <strong>SPAM</strong> with very high confidence (${confidence}%). 
                The message likely contains promotional language, urgency indicators, suspicious links, 
                or other common spam patterns. It's recommended to <strong>delete this email</strong> and not interact with it.</p>
            `;
        } else {
            return `
                <h4>⚠️ Potential Spam Detected</h4>
                <p>This email has been classified as <strong>SPAM</strong> with moderate confidence (${confidence}%). 
                While the model suggests this might be spam, please use your judgment. 
                Check for suspicious links, urgent language, or requests for personal information.</p>
            `;
        }
    } else {
        if (confidence > 90) {
            return `
                <h4>✅ Legitimate Email (High Confidence)</h4>
                <p>This email has been classified as <strong>LEGITIMATE</strong> with very high confidence (${confidence}%). 
                The message appears to be genuine communication without spam indicators. 
                However, always verify sender identity and be cautious with links.</p>
            `;
        } else {
            return `
                <h4>✓ Likely Legitimate Email</h4>
                <p>This email has been classified as <strong>LEGITIMATE</strong> with moderate confidence (${confidence}%). 
                The message appears safe, but please verify the sender and content before taking any action, 
                especially if it contains links or requests for information.</p>
            `;
        }
    }
}

function showError(message) {
    resultSection.style.display = 'none';
    errorSection.style.display = 'block';
    errorMessage.textContent = message;
    errorSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Check API status every 30 seconds
setInterval(checkApiStatus, 30000);

// Add keyboard shortcut (Ctrl/Cmd + Enter to check)
emailInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (!checkBtn.disabled) {
            checkEmail();
        }
    }
});

// Add auto-save to localStorage (optional)
emailInput.addEventListener('input', () => {
    localStorage.setItem('lastEmail', emailInput.value);
});

// Restore last email on page load (optional)
window.addEventListener('load', () => {
    const lastEmail = localStorage.getItem('lastEmail');
    if (lastEmail && !emailInput.value) {
        // Optionally restore: emailInput.value = lastEmail;
        // updateCharCount();
    }
});

console.log('✅ Email Spam Detector initialized!');
console.log('API Endpoint:', PREDICT_ENDPOINT);

// History Dashboard Functions
function saveToHistory(scanData) {
    // Add to beginning of array
    scanHistory.unshift({
        id: Date.now(),
        ...scanData
    });
    
    // Keep only last 50 scans
    if (scanHistory.length > 50) {
        scanHistory = scanHistory.slice(0, 50);
    }
    
    // Save to localStorage
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    
    // Update dashboard
    updateDashboard();
}

function deleteHistoryItem(id) {
    scanHistory = scanHistory.filter(item => item.id !== id);
    localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
    updateDashboard();
}

function clearHistory() {
    if (confirm('Are you sure you want to clear all scan history?')) {
        scanHistory = [];
        localStorage.setItem('scanHistory', JSON.stringify(scanHistory));
        updateDashboard();
    }
}

function updateDashboard() {
    // Calculate statistics
    const totalScans = scanHistory.length;
    const spamCount = scanHistory.filter(item => item.prediction.toLowerCase() === 'spam').length;
    const hamCount = scanHistory.filter(item => item.prediction.toLowerCase() === 'ham').length;
    
    // Calculate average confidence
    let avgConfidence = 0;
    if (totalScans > 0) {
        const totalConfidence = scanHistory.reduce((sum, item) => sum + item.confidence, 0);
        avgConfidence = (totalConfidence / totalScans * 100).toFixed(1);
    }
    
    // Update stats
    totalScansEl.textContent = totalScans;
    spamCaughtEl.textContent = spamCount;
    legitimateEmailsEl.textContent = hamCount;
    successRateEl.textContent = `${avgConfidence}%`;
    
    // Update history list
    updateHistoryList();
}

function updateHistoryList() {
    if (scanHistory.length === 0) {
        historyList.innerHTML = '<div class="no-history">No scan history yet. Start by checking an email!</div>';
        return;
    }
    
    historyList.innerHTML = scanHistory.map(item => {
        const isSpam = item.prediction.toLowerCase() === 'spam';
        const timestamp = new Date(item.timestamp);
        const timeAgo = getTimeAgo(timestamp);
        const preview = item.emailText.substring(0, 150) + (item.emailText.length > 150 ? '...' : '');
        const confidence = (item.confidence * 100).toFixed(1);
        
        return `
            <div class="history-item">
                <button class="delete-history-item" onclick="deleteHistoryItem(${item.id})" title="Delete this scan">
                    ×
                </button>
                <div class="history-item-header">
                    <span class="history-badge ${isSpam ? 'spam' : 'ham'}">
                        ${isSpam ? '⚠️ SPAM' : '✅ LEGITIMATE'}
                    </span>
                    <span class="history-timestamp">${timeAgo}</span>
                </div>
                <div class="history-preview">${escapeHtml(preview)}</div>
                <div class="history-details">
                    <div class="history-detail">
                        <span>Confidence:</span>
                        <strong>${confidence}%</strong>
                    </div>
                    <div class="history-detail">
                        <span>Risk:</span>
                        <strong>${item.riskLevel}</strong>
                    </div>
                    <div class="history-detail">
                        <span>Length:</span>
                        <strong>${item.emailText.length} chars</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getTimeAgo(timestamp) {
    const now = new Date();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    
    return timestamp.toLocaleDateString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make deleteHistoryItem available globally
window.deleteHistoryItem = deleteHistoryItem;

// Batch CSV Processing Functions
const modeTabs = document.querySelectorAll('.mode-tab');
const singleEmailMode = document.getElementById('singleEmailMode');
const batchCsvMode = document.getElementById('batchCsvMode');
const fileUploadArea = document.getElementById('fileUploadArea');
const csvFileInput = document.getElementById('csvFileInput');
const fileName = document.getElementById('fileName');
const processCsvBtn = document.getElementById('processCsvBtn');
const clearCsvBtn = document.getElementById('clearCsvBtn');
const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
const batchResultsSection = document.getElementById('batchResultsSection');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const exportJsonBtn = document.getElementById('exportJsonBtn');

// Mode switching
modeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        
        // Update tabs
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        // Update modes
        if (mode === 'single') {
            singleEmailMode.classList.add('active');
            singleEmailMode.style.display = 'block';
            batchCsvMode.classList.remove('active');
            batchCsvMode.style.display = 'none';
            resultSection.style.display = 'none';
            batchResultsSection.style.display = 'none';
        } else {
            batchCsvMode.classList.add('active');
            batchCsvMode.style.display = 'block';
            singleEmailMode.classList.remove('active');
            singleEmailMode.style.display = 'none';
            resultSection.style.display = 'none';
            batchResultsSection.style.display = 'none';
        }
    });
});

// File upload area click
fileUploadArea.addEventListener('click', () => {
    csvFileInput.click();
});

// File upload drag and drop
fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('drag-over');
});

fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('drag-over');
});

fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
        handleFileSelect(file);
    }
});

// File input change
csvFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

// Process CSV button
processCsvBtn.addEventListener('click', processCsvFile);

// Clear CSV button
clearCsvBtn.addEventListener('click', clearCsvFile);

// Download template button
downloadTemplateBtn.addEventListener('click', downloadCsvTemplate);

// Export buttons
exportCsvBtn?.addEventListener('click', exportResultsAsCsv);
exportJsonBtn?.addEventListener('click', exportResultsAsJson);

function handleFileSelect(file) {
    fileName.textContent = file.name;
    processCsvBtn.disabled = false;
    
    // Read file
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        csvData = parseCSV(text);
        console.log(`Loaded ${csvData.length} emails from CSV`);
    };
    reader.readAsText(file);
}

function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    // Find email column (can be 'email', 'text', 'message', 'content')
    const emailColIndex = headers.findIndex(h => 
        h.includes('email') || h.includes('text') || h.includes('message') || h.includes('content')
    );
    
    if (emailColIndex === -1) {
        alert('CSV must have a column named "email", "text", "message", or "content"');
        return [];
    }
    
    const emails = [];
    for (let i = 1; i < lines.length; i++) {
        const cells = lines[i].split(',');
        const emailText = cells[emailColIndex]?.trim();
        if (emailText) {
            emails.push({
                id: i,
                text: emailText.replace(/^"|"$/g, '') // Remove quotes if present
            });
        }
    }
    
    return emails.slice(0, 100); // Limit to 100 emails
}

async function processCsvFile() {
    if (!csvData || csvData.length === 0) {
        alert('Please select a valid CSV file first');
        return;
    }
    
    // Show progress
    const batchProgress = document.getElementById('batchProgress');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const progressBarFill = document.getElementById('progressBarFill');
    
    batchProgress.style.display = 'block';
    processCsvBtn.classList.add('loading');
    processCsvBtn.disabled = true;
    
    try {
        const response = await fetch(BATCH_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ emails: csvData })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            batchResults = data;
            displayBatchResults(data);
            
            // Update progress
            progressText.textContent = `${data.summary.processed}/${data.summary.total}`;
            progressPercent.textContent = '100%';
            progressBarFill.style.width = '100%';
            
            setTimeout(() => {
                batchProgress.style.display = 'none';
            }, 2000);
        } else {
            alert('Error processing batch: ' + (data.message || 'Unknown error'));
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to process batch. Please check your connection and try again.');
    } finally {
        processCsvBtn.classList.remove('loading');
        processCsvBtn.disabled = false;
    }
}

function displayBatchResults(data) {
    // Hide other sections
    resultSection.style.display = 'none';
    errorSection.style.display = 'none';
    
    // Show batch results
    batchResultsSection.style.display = 'block';
    
    // Update summary
    document.getElementById('batchTotal').textContent = data.summary.total;
    document.getElementById('batchSpam').textContent = data.summary.spam_count;
    document.getElementById('batchHam').textContent = data.summary.ham_count;
    document.getElementById('batchConfidence').textContent = `${(data.summary.avg_confidence * 100).toFixed(1)}%`;
    
    // Update table
    const tableBody = document.getElementById('batchTableBody');
    tableBody.innerHTML = '';
    
    data.results.forEach((result, index) => {
        if (result.status === 'success') {
            const row = document.createElement('tr');
            const emailText = csvData.find(e => e.id === result.id)?.text || '';
            const preview = emailText.substring(0, 50) + (emailText.length > 50 ? '...' : '');
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td class="email-preview-cell" title="${escapeHtml(emailText)}">${escapeHtml(preview)}</td>
                <td><span class="table-prediction-badge ${result.prediction}">${result.prediction.toUpperCase()}</span></td>
                <td>${(result.confidence * 100).toFixed(1)}%</td>
                <td><span class="table-risk-badge ${result.risk_level.toLowerCase()}">${result.risk_level}</span></td>
                <td>${result.url_count}</td>
                <td>${result.suspicious_keywords_count}</td>
            `;
            tableBody.appendChild(row);
        }
    });
    
    // Scroll to results
    batchResultsSection.scrollIntoView({ behavior: 'smooth' });
}

function clearCsvFile() {
    csvFileInput.value = '';
    fileName.textContent = '';
    csvData = null;
    processCsvBtn.disabled = true;
    document.getElementById('batchProgress').style.display = 'none';
    batchResultsSection.style.display = 'none';
}

function downloadCsvTemplate() {
    const template = 'email\n"Enter your email text here"\n"Another email text"\n';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email_batch_template.csv';
    a.click();
    URL.revokeObjectURL(url);
}

function exportResultsAsCsv() {
    if (!batchResults) return;
    
    let csv = 'ID,Email Preview,Prediction,Confidence,Risk Level,URLs,Suspicious Keywords\n';
    
    batchResults.results.forEach((result, index) => {
        if (result.status === 'success') {
            const emailText = csvData.find(e => e.id === result.id)?.text || '';
            const preview = emailText.substring(0, 100).replace(/"/g, '""');
            csv += `${index + 1},"${preview}",${result.prediction},${(result.confidence * 100).toFixed(1)}%,${result.risk_level},${result.url_count},${result.suspicious_keywords_count}\n`;
        }
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spam_detection_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportResultsAsJson() {
    if (!batchResults) return;
    
    const json = JSON.stringify(batchResults, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spam_detection_results_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// Export Individual Result Functions
// ============================================

function exportResultAsPdf() {
    if (!currentResultData) {
        alert('No result data available to export');
        return;
    }
    
    // Create a printable HTML document
    const printWindow = window.open('', '', 'width=800,height=600');
    const doc = printWindow.document;
    
    const timestamp = new Date(currentResultData.timestamp).toLocaleString();
    const predictionClass = currentResultData.prediction === 'spam' ? 'SPAM 🚫' : 'LEGITIMATE ✅';
    const predictionColor = currentResultData.prediction === 'spam' ? '#ff0040' : '#00ff41';
    
    doc.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Spam Detection Report</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 40px; 
                    background: white;
                    color: #333;
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    border-bottom: 3px solid #000;
                    padding-bottom: 20px;
                }
                .header h1 { 
                    font-size: 28px; 
                    color: #000;
                    margin-bottom: 10px;
                }
                .timestamp { 
                    color: #666; 
                    font-size: 14px;
                }
                .prediction-box {
                    background: #f0f0f0;
                    padding: 20px;
                    border-radius: 8px;
                    margin: 20px 0;
                    border-left: 5px solid ${predictionColor};
                }
                .prediction-label {
                    font-size: 18px;
                    font-weight: bold;
                    color: ${predictionColor};
                    margin-bottom: 10px;
                }
                .confidence {
                    font-size: 24px;
                    font-weight: bold;
                    color: #000;
                }
                .section {
                    margin: 25px 0;
                    page-break-inside: avoid;
                }
                .section h2 {
                    font-size: 18px;
                    color: #000;
                    margin-bottom: 15px;
                    border-bottom: 2px solid #ddd;
                    padding-bottom: 5px;
                }
                .details-grid {
                    display: grid;
                    grid-template-columns: 200px 1fr;
                    gap: 10px;
                    margin: 15px 0;
                }
                .detail-label {
                    font-weight: bold;
                    color: #555;
                }
                .detail-value {
                    color: #333;
                }
                .indicator-item {
                    background: #f9f9f9;
                    padding: 12px;
                    margin: 8px 0;
                    border-radius: 5px;
                    border-left: 3px solid #666;
                }
                .recommendation {
                    background: #fff8dc;
                    padding: 12px;
                    margin: 8px 0;
                    border-radius: 5px;
                    border-left: 3px solid #ffa500;
                }
                .keyword {
                    display: inline-block;
                    background: #ffe0e0;
                    padding: 5px 10px;
                    margin: 4px;
                    border-radius: 4px;
                    font-weight: bold;
                    color: #cc0000;
                }
                .footer {
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 2px solid #ddd;
                    text-align: center;
                    color: #666;
                    font-size: 12px;
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>📧 Email Spam Detection Report</h1>
                <p class="timestamp">Generated on: ${timestamp}</p>
            </div>
            
            <div class="prediction-box">
                <div class="prediction-label">Classification: ${predictionClass}</div>
                <div class="confidence">Confidence: ${(currentResultData.confidence * 100).toFixed(2)}%</div>
                <div style="margin-top: 10px; color: #666;">
                    Risk Level: <strong style="color: ${predictionColor};">${currentResultData.risk_level || 'N/A'}</strong>
                </div>
            </div>
            
            <div class="section">
                <h2>📊 Email Details</h2>
                <div class="details-grid">
                    <div class="detail-label">Original Length:</div>
                    <div class="detail-value">${currentResultData.email_length} characters</div>
                    <div class="detail-label">Processed Length:</div>
                    <div class="detail-value">${currentResultData.cleaned_length} characters</div>
                </div>
            </div>
            
            ${currentResultData.spam_indicators ? `
            <div class="section">
                <h2>🔍 Spam Indicators</h2>
                <div class="indicator-item">
                    <strong>URLs Detected:</strong> ${currentResultData.spam_indicators.url_count || 0}
                </div>
                <div class="indicator-item">
                    <strong>Capitalization:</strong> ${currentResultData.spam_indicators.caps_percentage?.toFixed(1) || 0}%
                </div>
                <div class="indicator-item">
                    <strong>Exclamation Marks:</strong> ${currentResultData.spam_indicators.exclamation_count || 0}
                </div>
                <div class="indicator-item">
                    <strong>Money Terms:</strong> ${currentResultData.spam_indicators.money_terms?.length || 0}
                </div>
                <div class="indicator-item">
                    <strong>Urgency Words:</strong> ${currentResultData.spam_indicators.urgency_words?.length || 0}
                </div>
            </div>
            ` : ''}
            
            ${currentResultData.spam_indicators?.suspicious_keywords && currentResultData.spam_indicators.suspicious_keywords.length > 0 ? `
            <div class="section">
                <h2>🚨 Suspicious Keywords</h2>
                <div>
                    ${currentResultData.spam_indicators.suspicious_keywords.map(kw => 
                        `<span class="keyword">${kw}</span>`
                    ).join('')}
                </div>
            </div>
            ` : ''}
            
            ${currentResultData.safety_recommendations && currentResultData.safety_recommendations.length > 0 ? `
            <div class="section">
                <h2>🛡️ Safety Recommendations</h2>
                ${currentResultData.safety_recommendations.map(rec => 
                    `<div class="recommendation">${rec}</div>`
                ).join('')}
            </div>
            ` : ''}
            
            ${currentResultData.model_comparison ? `
            <div class="section">
                <h2>🤖 Model Comparison</h2>
                <p><strong>Model Agreement:</strong> ${currentResultData.model_comparison.agreement}%</p>
                <div style="margin-top: 15px;">
                    ${currentResultData.model_comparison.models.map(m => `
                        <div class="indicator-item">
                            <strong>${m.model_name}:</strong> ${m.prediction.toUpperCase()} (${m.confidence}% confidence)
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            
            <div class="footer">
                <p>Email Spam Detection System | Engineering Project</p>
                <p>This report was automatically generated by our spam detection AI</p>
            </div>
            
            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="
                    padding: 12px 30px;
                    background: #000;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">Print / Save as PDF</button>
                <button onclick="window.close()" style="
                    padding: 12px 30px;
                    background: #666;
                    color: #fff;
                    border: none;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                    margin-left: 10px;
                ">Close</button>
            </div>
        </body>
        </html>
    `);
    
    doc.close();
}

function exportResultAsJson() {
    if (!currentResultData) {
        alert('No result data available to export');
        return;
    }
    
    // Create a formatted JSON with relevant data
    const exportData = {
        timestamp: currentResultData.timestamp,
        email_analyzed: currentResultData.emailText,
        prediction: currentResultData.prediction,
        confidence: currentResultData.confidence,
        risk_level: currentResultData.risk_level,
        spam_indicators: currentResultData.spam_indicators,
        safety_recommendations: currentResultData.safety_recommendations,
        word_importance: currentResultData.word_importance?.slice(0, 10), // Top 10 words
        patterns: currentResultData.patterns,
        model_comparison: currentResultData.model_comparison,
        email_length: currentResultData.email_length,
        cleaned_length: currentResultData.cleaned_length
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spam_detection_result_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Show success message
    const btn = document.getElementById('exportJsonBtn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<span class="export-icon">✅</span><span>Exported!</span>';
    setTimeout(() => {
        btn.innerHTML = originalText;
    }, 2000);
}

function copyShareableLink() {
    if (!currentResultData) {
        alert('No result data available to share');
        return;
    }
    
    // Create a shareable link with base64 encoded data (for demo purposes)
    const shareData = {
        p: currentResultData.prediction,
        c: (currentResultData.confidence * 100).toFixed(2),
        r: currentResultData.risk_level
    };
    
    const encoded = btoa(JSON.stringify(shareData));
    const shareUrl = `${window.location.origin}${window.location.pathname}?result=${encoded}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
        // Show success message
        const btn = document.getElementById('copyLinkBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="export-icon">✅</span><span>Link Copied!</span>';
        setTimeout(() => {
            btn.innerHTML = originalText;
        }, 2000);
    }).catch(err => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        alert('Link copied to clipboard!');
    });
}

// ============================================
// Theme Toggle Functionality
// ============================================

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    // Apply theme
    if (newTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('themeIcon').textContent = '🌙';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeIcon').textContent = '🌞';
    }
    
    // Save preference
    localStorage.setItem('theme', newTheme);
}

// Load saved theme on page load
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        document.getElementById('themeIcon').textContent = '🌙';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('themeIcon').textContent = '🌞';
    }
}

// Initialize theme when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    loadTheme();
    loadTemplates();
});

// ============================================
// Email Templates Library
// ============================================

const emailTemplates = [
    {
        id: 1,
        title: "Lottery Winner",
        type: "spam",
        text: "CONGRATULATIONS!!! You have been selected as the WINNER of our $5,000,000 lottery! CLAIM your prize NOW by clicking this link: http://fake-lottery-scam.com. This offer expires in 24 HOURS! Act IMMEDIATELY! Call 1-800-FAKE-NUM to verify."
    },
    {
        id: 2,
        title: "Meeting Reminder",
        type: "ham",
        text: "Hi Team,\n\nJust a reminder about our quarterly review meeting scheduled for tomorrow at 2:00 PM in Conference Room B. Please bring your Q4 reports.\n\nAgenda:\n- Q4 Performance Review\n- 2024 Goals Discussion\n- Budget Planning\n\nSee you there!\nBest regards,\nProject Manager"
    },
    {
        id: 3,
        title: "Nigerian Prince Scam",
        type: "spam",
        text: "Dear Friend, I am Prince Ahmed from Nigeria. I have $25 MILLION dollars that I need to transfer out of my country. I will give you 20% if you help me. Please send your bank account details and $5,000 processing fee to: [email protected]. URGENT! This is 100% LEGAL and SAFE!"
    },
    {
        id: 4,
        title: "Password Reset",
        type: "ham",
        text: "Hi there,\n\nWe received a request to reset your password. If this was you, click the link below:\n\nhttps://yourcompany.com/reset-password?token=abc123\n\nThis link expires in 1 hour. If you didn't request this, please ignore this email.\n\nThanks,\nSecurity Team"
    },
    {
        id: 5,
        title: "Crypto Investment",
        type: "spam",
        text: "🚀 AMAZING OPPORTUNITY! 🚀\nInvest in BitCoin TODAY and get 500% RETURNS in just 7 days!!! Our AI trading bot GUARANTEES profits! Limited spots available! Don't miss out!\n\n💰 Minimum investment: $500\n💰 Expected return: $2,500\n\nClick here NOW: http://crypto-scam-site.com\nOffer ends TONIGHT! ⏰"
    },
    {
        id: 6,
        title: "Order Confirmation",
        type: "ham",
        text: "Thank you for your order!\n\nOrder #12345\nDate: December 13, 2025\n\nItems:\n- Wireless Mouse x1 - $29.99\n- USB-C Cable x2 - $19.98\n\nSubtotal: $49.97\nShipping: $5.00\nTotal: $54.97\n\nEstimated delivery: Dec 18-20, 2025\nTracking number will be sent shortly.\n\nCustomer Service"
    },
    {
        id: 7,
        title: "Weight Loss Miracle",
        type: "spam",
        text: "LOSE 30 POUNDS IN 1 WEEK!!! 😱\n\nDoctors HATE this ONE WEIRD TRICK! No exercise! No diet! Just take our MAGIC pill!!!\n\n✅ 100% Natural\n✅ FDA Approved (lie)\n✅ Money Back Guarantee\n\nORDER NOW for 50% OFF!!!\nOnly $19.99 (normally $200)\n\nFREE shipping! Click here: http://diet-scam.com\nLimited time offer! BUY NOW!"
    },
    {
        id: 8,
        title: "Newsletter Subscription",
        type: "ham",
        text: "Welcome to TechNews Weekly!\n\nThank you for subscribing to our newsletter. You'll receive the latest technology news, reviews, and insights every Monday morning.\n\nIn this week's edition:\n- AI breakthroughs in 2025\n- Top 10 programming languages\n- Cloud computing trends\n\nIf you wish to unsubscribe, click here.\n\nHappy reading!\nTechNews Team"
    },
    {
        id: 9,
        title: "Phishing Alert",
        type: "spam",
        text: "URGENT SECURITY ALERT!\n\nYour PayPal account has been SUSPENDED due to suspicious activity!\n\nYou must verify your identity within 24 hours or your account will be PERMANENTLY CLOSED!\n\nClick here IMMEDIATELY: http://fake-paypal.com/verify\n\nEnter your:\n- Full name\n- Credit card number\n- CVV\n- Social Security Number\n\nDO NOT ignore this email!"
    },
    {
        id: 10,
        title: "Job Application Reply",
        type: "ham",
        text: "Dear Applicant,\n\nThank you for applying to the Software Engineer position at TechCorp.\n\nWe have reviewed your resume and would like to invite you for an initial phone screening interview.\n\nAvailable time slots:\n- Monday, Dec 16 at 10:00 AM\n- Tuesday, Dec 17 at 2:00 PM\n- Wednesday, Dec 18 at 11:00 AM\n\nPlease reply with your preferred time.\n\nBest regards,\nHR Department"
    },
    {
        id: 11,
        title: "Tax Refund Scam",
        type: "spam",
        text: "IRS NOTIFICATION:\n\nYou are eligible for a $3,847.00 tax refund!\n\nTo claim your refund, click here and enter:\n- SSN\n- Bank account number\n- Routing number\n\nProcess your refund NOW before it expires!\nhttp://fake-irs-refund.com\n\nOfficial IRS Department\n(This is a scam - IRS never emails about refunds)"
    },
    {
        id: 12,
        title: "Work from Home",
        type: "spam",
        text: "💼 WORK FROM HOME OPPORTUNITY! 💼\n\nEarn $10,000/month working ONLY 2 hours per day from your couch!\n\nNO experience needed!\nNO interview!\nNO boss!\n\nJust send $99 registration fee to get started!\n\n⭐ Unlimited earning potential\n⭐ Be your own boss\n⭐ Financial freedom\n\nJoin 10,000+ successful members!\nEmail: [email protected]"
    }
];

function loadTemplates() {
    const templatesGrid = document.getElementById('templatesGrid');
    if (!templatesGrid) return;
    
    templatesGrid.innerHTML = '';
    
    emailTemplates.forEach(template => {
        const card = document.createElement('div');
        card.className = `template-card ${template.type}`;
        card.onclick = () => loadTemplate(template.id);
        
        const preview = template.text.length > 100 
            ? template.text.substring(0, 100) + '...' 
            : template.text;
        
        card.innerHTML = `
            <div class="template-title">
                <span>${template.title}</span>
                <span class="template-type ${template.type}">${template.type.toUpperCase()}</span>
            </div>
            <div class="template-preview">${escapeHtml(preview)}</div>
        `;
        
        templatesGrid.appendChild(card);
    });
}

function toggleTemplates() {
    const dropdown = document.getElementById('templatesDropdown');
    if (dropdown.style.display === 'none' || !dropdown.style.display) {
        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

function loadTemplate(templateId) {
    const template = emailTemplates.find(t => t.id === templateId);
    if (template) {
        const emailInput = document.getElementById('emailInput');
        emailInput.value = template.text;
        
        // Update character count
        updateCharCount();
        
        // Update live preview
        updateLivePreview();
        
        // Close dropdown
        document.getElementById('templatesDropdown').style.display = 'none';
        
        // Scroll to textarea
        emailInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        emailInput.focus();
    }
}


