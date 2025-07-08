// background.js - Enhanced with API integration

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Listen for tab updates (when user navigates to new pages)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only process when page is completely loaded
  if (changeInfo.status === 'complete' && tab.url) {
    // Skip chrome:// and extension pages
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      return;
    }
    
    console.log('Page visited:', tab.url);
    
    // Store the page visit data both locally and on server
    storePageVisit(tab);
  }
});

// Enhanced function to store page visit data
async function storePageVisit(tab) {
  try {
    // Create visit object
    const visit = {
      id: Date.now(),
      url: tab.url,
      title: tab.title,
      timestamp: new Date().toISOString(),
      domain: new URL(tab.url).hostname
    };
    
    // Store locally first (for offline functionality)
    await storeLocalVisit(visit);
    
    // Try to send to server
    await sendToServer(visit);
    
  } catch (error) {
    console.error('Error storing page visit:', error);
  }
}

// Store visit locally (backup/offline functionality)
async function storeLocalVisit(visit) {
  try {
    const result = await chrome.storage.local.get(['pageVisits']);
    const existingVisits = result.pageVisits || [];
    
    existingVisits.push(visit);
    if (existingVisits.length > 100) {
      existingVisits.shift(); // Keep only last 100 locally
    }
    
    await chrome.storage.local.set({ pageVisits: existingVisits });
    console.log('Stored locally:', visit.title);
    
  } catch (error) {
    console.error('Error storing locally:', error);
  }
}

// Send visit data to server
async function sendToServer(visit) {
  try {
    const response = await fetch(`${API_BASE_URL}/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(visit)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Sent to server:', visit.title);
      
      // Mark as synced
      await markAsSynced(visit.id);
      
    } else {
      console.error('❌ Server error:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('❌ Network error sending to server:', error);
    // Data is still stored locally, so we can retry later
  }
}

// Mark visit as synced with server
async function markAsSynced(visitId) {
  try {
    const result = await chrome.storage.local.get(['syncedVisits']);
    const syncedVisits = result.syncedVisits || [];
    
    if (!syncedVisits.includes(visitId)) {
      syncedVisits.push(visitId);
      await chrome.storage.local.set({ syncedVisits });
    }
    
  } catch (error) {
    console.error('Error marking as synced:', error);
  }
}

// Enhanced message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getPageVisits') {
    // Try to get from server first, fallback to local
    getVisitsFromServer()
      .then(serverVisits => {
        sendResponse({ 
          visits: serverVisits,
          source: 'server'
        });
      })
      .catch(async () => {
        // Fallback to local storage
        const result = await chrome.storage.local.get(['pageVisits']);
        sendResponse({ 
          visits: result.pageVisits || [],
          source: 'local'
        });
      });
    
    return true; // Keep message channel open
  }
  
  if (request.action === 'getStats') {
    // Get stats from server
    getStatsFromServer()
      .then(stats => {
        sendResponse({ stats, source: 'server' });
      })
      .catch(async () => {
        // Fallback to local calculation
        const result = await chrome.storage.local.get(['pageVisits']);
        const visits = result.pageVisits || [];
        const localStats = calculateLocalStats(visits);
        sendResponse({ stats: localStats, source: 'local' });
      });
    
    return true;
  }
  
  if (request.action === 'clearData') {
    // Clear both server and local data
    clearAllData()
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true;
  }
  
  if (request.action === 'pageContentExtracted') {
    // Enhanced content extracted from content script
    handleExtractedContent(request.data);
    sendResponse({ success: true });
  }
});

// Get visits from server
async function getVisitsFromServer() {
  const response = await fetch(`${API_BASE_URL}/visits`);
  if (!response.ok) {
    throw new Error('Failed to fetch from server');
  }
  const result = await response.json();
  return result.data || [];
}

// Get stats from server
async function getStatsFromServer() {
  const response = await fetch(`${API_BASE_URL}/stats`);
  if (!response.ok) {
    throw new Error('Failed to fetch stats from server');
  }
  const result = await response.json();
  return result.data;
}

// Clear all data (both server and local)
async function clearAllData() {
  try {
    // Clear server data
    const response = await fetch(`${API_BASE_URL}/visits`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to clear server data');
    }
    
    // Clear local data
    await chrome.storage.local.clear();
    
    console.log('✅ All data cleared');
    
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
}

// Handle enhanced content extracted by content script
async function handleExtractedContent(pageData) {
  try {
    // Send enhanced data to server
    const response = await fetch(`${API_BASE_URL}/visits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pageData)
    });
    
    if (response.ok) {
      console.log('✅ Enhanced content sent to server:', pageData.title);
    } else {
      console.error('❌ Error sending enhanced content:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Network error sending enhanced content:', error);
  }
}

// Calculate local stats (fallback when server unavailable)
function calculateLocalStats(visits) {
  const today = new Date().toDateString();
  const todayVisits = visits.filter(visit => {
    const visitDate = new Date(visit.timestamp).toDateString();
    return visitDate === today;
  });
  
  const uniqueDomains = new Set(visits.map(visit => visit.domain));
  const learningContent = visits.filter(visit => visit.isLearningContent);
  
  return {
    totalVisits: visits.length,
    todayVisits: todayVisits.length,
    uniqueDomains: uniqueDomains.size,
    learningContent: learningContent.length,
    lastVisit: visits.length > 0 ? visits[visits.length - 1] : null
  };
}

// Sync pending visits on startup
chrome.runtime.onStartup.addListener(syncPendingVisits);
chrome.runtime.onInstalled.addListener(syncPendingVisits);

// Sync any visits that weren't sent to server
async function syncPendingVisits() {
  try {
    const result = await chrome.storage.local.get(['pageVisits', 'syncedVisits']);
    const allVisits = result.pageVisits || [];
    const syncedVisits = result.syncedVisits || [];
    
    const pendingVisits = allVisits.filter(visit => !syncedVisits.includes(visit.id));
    
    console.log(`🔄 Syncing ${pendingVisits.length} pending visits`);
    
    for (const visit of pendingVisits) {
      await sendToServer(visit);
      // Small delay to avoid overwhelming server
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
  } catch (error) {
    console.error('Error syncing pending visits:', error);
  }
}

// Extension installed
chrome.runtime.onInstalled.addListener(() => {
  console.log('🧠 AI Memory Coach extension installed/updated!');
  console.log('🔗 Connected to API:', API_BASE_URL);
});