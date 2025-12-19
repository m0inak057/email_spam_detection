"""
Text preprocessing module for email spam detection.

This module contains functions to clean and preprocess email text
before feeding it to the ML model.
"""

import re
import string
from typing import List

try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer

    # We try to load NLTK resources, but gracefully degrade if
    # the corpora are not available (e.g., in production where
    # nltk.download has not been run).
    try:
        STOP_WORDS = set(stopwords.words('english'))
    except LookupError:
        STOP_WORDS = set()

    try:
        lemmatizer = WordNetLemmatizer()
    except LookupError:
        lemmatizer = None
except ImportError:
    STOP_WORDS = set()
    lemmatizer = None
    print("⚠️ NLTK not available. Install with: pip install nltk")


def remove_urls(text: str) -> str:
    """Remove URLs from text."""
    url_pattern = re.compile(r'https?://\S+|www\.\S+')
    return url_pattern.sub('', text)


def remove_html_tags(text: str) -> str:
    """Remove HTML tags from text."""
    html_pattern = re.compile(r'<.*?>')
    return html_pattern.sub('', text)


def remove_emails(text: str) -> str:
    """Remove email addresses from text."""
    email_pattern = re.compile(r'\S+@\S+')
    return email_pattern.sub('', text)


def remove_punctuation(text: str) -> str:
    """Remove punctuation from text."""
    return text.translate(str.maketrans('', '', string.punctuation))


def remove_digits(text: str) -> str:
    """Remove digits from text."""
    return re.sub(r'\d+', '', text)


def remove_extra_whitespace(text: str) -> str:
    """Remove extra whitespace from text."""
    return ' '.join(text.split())


def remove_stopwords(text: str) -> str:
    """Remove stopwords from text."""
    if not STOP_WORDS:
        return text
    
    words = text.split()
    filtered_words = [word for word in words if word.lower() not in STOP_WORDS]
    return ' '.join(filtered_words)


def lemmatize_text(text: str) -> str:
    """Lemmatize words in text."""
    if lemmatizer is None:
        return text
    
    words = text.split()
    lemmatized_words = [lemmatizer.lemmatize(word) for word in words]
    return ' '.join(lemmatized_words)


def clean_text(text: str, 
               remove_stop_words: bool = True,
               lemmatize: bool = True,
               remove_nums: bool = True) -> str:
    """
    Complete text cleaning pipeline for email spam detection.
    
    Args:
        text: Raw email text
        remove_stop_words: Whether to remove stopwords
        lemmatize: Whether to apply lemmatization
        remove_nums: Whether to remove numbers
    
    Returns:
        Cleaned text ready for vectorization
    
    Pipeline:
        1. Convert to lowercase
        2. Remove URLs
        3. Remove HTML tags
        4. Remove email addresses
        5. Remove punctuation
        6. Remove digits (optional)
        7. Remove extra whitespace
        8. Remove stopwords (optional)
        9. Lemmatize (optional)
    """
    if not text or not isinstance(text, str):
        return ""
    
    # Step 1: Convert to lowercase
    text = text.lower()
    
    # Step 2: Remove URLs
    text = remove_urls(text)
    
    # Step 3: Remove HTML tags
    text = remove_html_tags(text)
    
    # Step 4: Remove email addresses
    text = remove_emails(text)
    
    # Step 5: Remove punctuation
    text = remove_punctuation(text)
    
    # Step 6: Remove digits (optional)
    if remove_nums:
        text = remove_digits(text)
    
    # Step 7: Remove extra whitespace
    text = remove_extra_whitespace(text)
    
    # Step 8: Remove stopwords (optional)
    if remove_stop_words and STOP_WORDS:
        text = remove_stopwords(text)
    
    # Step 9: Lemmatize (optional)
    if lemmatize and lemmatizer is not None:
        text = lemmatize_text(text)
    
    return text


def batch_clean_texts(texts: List[str], **kwargs) -> List[str]:
    """
    Clean multiple texts in batch.
    
    Args:
        texts: List of raw email texts
        **kwargs: Arguments to pass to clean_text()
    
    Returns:
        List of cleaned texts
    """
    return [clean_text(text, **kwargs) for text in texts]


# Example usage
if __name__ == "__main__":
    sample_email = """
    Congratulations! You have won $1,000,000! 
    Click here: http://spam-site.com to claim your prize NOW!!!
    Contact us at spam@fake.com
    """
    
    cleaned = clean_text(sample_email)
    print("Original:", sample_email)
    print("\nCleaned:", cleaned)
