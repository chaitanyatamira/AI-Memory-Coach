// content.js - Runs on every webpage to extract content

// Only run on actual web pages, not chrome:// pages
if (window.location.protocol !== 'chrome-extension:' && window.location.protocol !== 'chrome:') {
    
    // Wait for page to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', extractPageContent);
    } else {
        extractPageContent();
    }
}

function extractPageContent() {
    try {
        // Extract basic page information
        const pageData = {
            url: window.location.href,
            title: document.title,
            timestamp: new Date().toISOString(),
            domain: window.location.hostname,
            
            // Extract text content (we'll enhance this later)
            textContent: extractMainContent(),
            
            // Extract meta information
            metaDescription: getMetaDescription(),
            
            // Check if it's a learning-focused page
            isLearningContent: isLearningContent()
        };
        
        // Send to background script for processing
        chrome.runtime.sendMessage({
            action: 'pageContentExtracted',
            data: pageData
        });
        
        console.log('Content extracted for:', pageData.title);
        
    } catch (error) {
        console.error('Error extracting page content:', error);
    }
}

// Extract main content from the page
function extractMainContent() {
    // Try to find main content areas
    const selectors = [
        'main',
        'article',
        '.content',
        '.main-content',
        '.post-content',
        '.article-content',
        '#content',
        '.entry-content'
    ];
    
    let mainContent = '';
    
    for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) {
            mainContent = element.innerText;
            break;
        }
    }
    
    // If no main content found, get body text (filtered)
    if (!mainContent) {
        mainContent = document.body.innerText;
    }
    
    // Clean and limit content
    mainContent = mainContent
        .replace(/\s+/g, ' ') // Replace multiple spaces with single space
        .replace(/\n+/g, '\n') // Replace multiple newlines with single newline
        .trim();
    
    // Limit to first 2000 characters for now
    return mainContent.substring(0, 2000);
}

// Get meta description
function getMetaDescription() {
    const metaDesc = document.querySelector('meta[name="description"]');
    return metaDesc ? metaDesc.getAttribute('content') : '';
}

// Check if page contains learning content
function isLearningContent() {
    const learningIndicators = [
        'tutorial', 'guide', 'how-to', 'learn', 'course', 'lesson',
        'documentation', 'wiki', 'article', 'blog', 'education',
        'training', 'knowledge', 'explanation', 'reference'
    ];
    
    const pageText = (document.title + ' ' + window.location.href).toLowerCase();
    
    return learningIndicators.some(indicator => pageText.includes(indicator));
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        extractPageContent();
        sendResponse({ success: true });
    }
});

// Optional: Show a subtle indicator that the extension is working
function showIndicator() {
    // Create a small, non-intrusive indicator
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: #4CAF50;
        color: white;
        padding: 5px 10px;
        border-radius: 15px;
        font-size: 12px;
        z-index: 10000;
        opacity: 0.8;
        transition: opacity 0.3s;
    `;
    indicator.textContent = '🧠 Learning tracked';
    
    document.body.appendChild(indicator);
    
    // Remove after 2 seconds
    setTimeout(() => {
        indicator.style.opacity = '0';
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 300);
    }, 2000);
}

// Show indicator for learning content
if (isLearningContent()) {
    setTimeout(showIndicator, 1000);
}