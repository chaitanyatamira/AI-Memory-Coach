// popup.js - Enhanced with server integration

document.addEventListener('DOMContentLoaded', async () => {
    await loadData();
    
    // Set up button event listeners
    document.getElementById('clearBtn').addEventListener('click', clearAllData);
    document.getElementById('viewAllBtn').addEventListener('click', viewAllData);
    
    // Set up AI button listeners
    document.getElementById('dailySummaryBtn').addEventListener('click', getDailySummary);
    document.getElementById('summarizeCurrentBtn').addEventListener('click', summarizeCurrentPage);
});

// Load and display data (now from server)
async function loadData() {
    try {
        // Request data from background script (which tries server first)
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({action: 'getPageVisits'}, resolve);
        });
        
        const visits = response.visits || [];
        const dataSource = response.source || 'unknown';
        
        // Update statistics
        await updateStats();
        
        // Check AI status
        await checkAIStatus();
        
        // Display recent visits
        displayRecentVisits(visits);
        
        // Show data source indicator
        showDataSource(dataSource);
        
        // Show content, hide loading
        document.getElementById('loading').style.display = 'none';
        document.getElementById('content').style.display = 'block';
        
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('loading').innerHTML = `
            <div style="color: #ff6b6b;">
                ❌ Error loading data<br>
                <small>Check if server is running</small>
            </div>
        `;
    }
}

// Update statistics (enhanced with server data)
async function updateStats() {
    try {
        // Get stats from background script
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({action: 'getStats'}, resolve);
        });
        
        const stats = response.stats;
        
        if (stats) {
            document.getElementById('todayCount').textContent = stats.todayVisits || 0;
            document.getElementById('totalCount').textContent = stats.totalVisits || 0;
            document.getElementById('domainCount').textContent = stats.uniqueDomains || 0;
        }
        
    } catch (error) {
        console.error('Error updating stats:', error);
        // Fallback to local calculation if needed
        document.getElementById('todayCount').textContent = '?';
        document.getElementById('totalCount').textContent = '?';
        document.getElementById('domainCount').textContent = '?';
    }
}

// Display recent visits
function displayRecentVisits(visits) {
    const recentVisitsContainer = document.getElementById('recentVisits');
    
    if (visits.length === 0) {
        recentVisitsContainer.innerHTML = `
            <div class="empty-state">
                No visits recorded yet.<br>
                <small>Start browsing to see your learning!</small>
            </div>
        `;
        return;
    }
    
    // Get last 5 visits
    const recentVisits = visits.slice(-5).reverse();
    
    recentVisitsContainer.innerHTML = recentVisits.map(visit => {
        const timeAgo = getTimeAgo(new Date(visit.timestamp));
        const isLearning = visit.isLearningContent ? '🧠' : '📄';
        
        return `
            <div class="visit-item">
                <div class="visit-title">
                    ${isLearning} ${visit.title || 'Untitled'}
                </div>
                <div class="visit-domain">${visit.domain} • ${timeAgo}</div>
            </div>
        `;
    }).join('');
}

// Show data source indicator
function showDataSource(source) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: ${source === 'server' ? '#4CAF50' : '#ff9800'};
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        opacity: 0.8;
    `;
    
    indicator.textContent = source === 'server' ? '🌐 Online' : '📱 Offline';
    indicator.title = source === 'server' ? 'Connected to server' : 'Using local data';
    
    document.body.appendChild(indicator);
    
    // Remove after 3 seconds
    setTimeout(() => {
        if (indicator.parentNode) {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.parentNode.removeChild(indicator);
            }, 300);
        }
    }, 3000);
}

// Calculate time ago
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
}

// Clear all data (enhanced)
async function clearAllData() {
    if (confirm('Are you sure you want to clear all data? This will delete both local and server data and cannot be undone.')) {
        try {
            // Show loading state
            document.getElementById('clearBtn').textContent = 'Clearing...';
            document.getElementById('clearBtn').disabled = true;
            
            // Clear data through background script
            await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage({action: 'clearData'}, (response) => {
                    if (response.success) {
                        resolve();
                    } else {
                        reject(new Error(response.error || 'Failed to clear data'));
                    }
                });
            });
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: #4CAF50;
                color: white;
                padding: 10px 20px;
                border-radius: 5px;
                z-index: 1000;
            `;
            successMsg.textContent = '✅ All data cleared successfully!';
            document.body.appendChild(successMsg);
            
            // Reload the popup after success
            setTimeout(() => {
                window.location.reload();
            }, 1500);
            
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data: ' + error.message);
            
            // Reset button
            document.getElementById('clearBtn').textContent = 'Clear Data';
            document.getElementById('clearBtn').disabled = false;
        }
    }
}

// View all data (enhanced)
function viewAllData() {
    // For now, show status and what's coming
    const message = `
🚀 Full Dashboard Coming Soon!

Current Status:
✅ Extension tracking pages
✅ Data syncing to server
✅ API endpoints working

Next Phase:
📊 React dashboard
🤖 AI summaries
📝 Quiz generation
📈 Learning analytics

Stay tuned!
    `;
    
    alert(message);
}

// Add refresh button functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '🔄';
    refreshBtn.className = 'btn';
    refreshBtn.style.cssText = `
        position: absolute;
        top: 5px;
        left: 5px;
        width: 30px;
        padding: 5px;
        font-size: 12px;
    `;
    refreshBtn.title = 'Refresh data';
    refreshBtn.addEventListener('click', () => {
        window.location.reload();
    });
    
    document.body.appendChild(refreshBtn);
});

// AI Functions

// Check AI service status
async function checkAIStatus() {
    try {
        const response = await fetch('http://localhost:3000/api/ai/status');
        const data = await response.json();
        
        const statusElement = document.getElementById('aiStatus');
        const aiSection = document.getElementById('aiSection');
        
        if (data.success && data.data.enabled) {
            statusElement.textContent = '✅ Ready';
            statusElement.style.color = '#4CAF50';
            aiSection.style.display = 'block';
        } else {
            statusElement.textContent = '❌ Disabled';
            statusElement.style.color = '#ff6b6b';
            aiSection.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking AI status:', error);
        document.getElementById('aiStatus').textContent = '❓ Unknown';
        document.getElementById('aiSection').style.display = 'none';
    }
}

// Get daily summary
async function getDailySummary() {
    const button = document.getElementById('dailySummaryBtn');
    const originalText = button.textContent;
    
    try {
        button.textContent = '⏳ Generating...';
        button.disabled = true;
        
        const response = await fetch('http://localhost:3000/api/ai/daily-summary/today', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAISummary('Today\'s Learning Summary', data.data.summary, data.data);
        } else {
            throw new Error(data.error || 'Failed to generate summary');
        }
        
    } catch (error) {
        console.error('Error getting daily summary:', error);
        showError('Failed to generate daily summary: ' + error.message);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Summarize current page
async function summarizeCurrentPage() {
    const button = document.getElementById('summarizeCurrentBtn');
    const originalText = button.textContent;
    
    try {
        button.textContent = '⏳ Analyzing...';
        button.disabled = true;
        
        // Get current tab info
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Get the most recent visit for this URL
        const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({action: 'getPageVisits'}, resolve);
        });
        
        const visits = response.visits || [];
        const currentVisit = visits.find(visit => visit.url === tab.url);
        
        if (!currentVisit) {
            throw new Error('Current page not found in visits. Please visit the page first.');
        }
        
        // Request summarization
        const summaryResponse = await fetch('http://localhost:3000/api/ai/summarize-page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                visitId: currentVisit.id
            })
        });
        
        const summaryData = await summaryResponse.json();
        
        if (summaryData.success) {
            showAISummary('Page Summary', summaryData.data.summary, {
                title: summaryData.data.title,
                url: summaryData.data.url
            });
        } else {
            throw new Error(summaryData.error || 'Failed to summarize page');
        }
        
    } catch (error) {
        console.error('Error summarizing current page:', error);
        showError('Failed to summarize page: ' + error.message);
    } finally {
        button.textContent = originalText;
        button.disabled = false;
    }
}

// Show AI summary in a modal
function showAISummary(title, summary, metadata = {}) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        box-sizing: border-box;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 500px;
        max-height: 80%;
        overflow-y: auto;
        position: relative;
    `;
    
    content.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h2 style="margin: 0; font-size: 18px;">${title}</h2>
            <button id="closeModal" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
        </div>
        
        ${metadata.title ? `<div style="margin-bottom: 10px; opacity: 0.8; font-size: 14px;"><strong>Page:</strong> ${metadata.title}</div>` : ''}
        ${metadata.url ? `<div style="margin-bottom: 15px; opacity: 0.8; font-size: 12px; word-break: break-all;">${metadata.url}</div>` : ''}
        
        <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; line-height: 1.5;">
            ${summary.replace(/\n/g, '<br>')}
        </div>
        
        ${metadata.totalVisits ? `
            <div style="margin-top: 15px; font-size: 12px; opacity: 0.8;">
                📊 Based on ${metadata.totalVisits} visits today
                ${metadata.learningVisits ? ` (${metadata.learningVisits} learning content)` : ''}
            </div>
        ` : ''}
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeModal = () => {
        document.body.removeChild(modal);
    };
    
    document.getElementById('closeModal').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close on Escape key
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff6b6b;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 1000;
        max-width: 300px;
        text-align: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    errorDiv.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 5px;">❌ Error</div>
        <div style="font-size: 14px;">${message}</div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.style.opacity = '0';
            errorDiv.style.transition = 'opacity 0.3s';
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    document.body.removeChild(errorDiv);
                }
            }, 300);
        }
    }, 5000);
}