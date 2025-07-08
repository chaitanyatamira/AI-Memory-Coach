// server.js - Main server file for AI Memory Coach

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import AI service (multi-provider)
const aiService = require('./services/multiAiService');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS for browser extension
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// In-memory storage for now (we'll replace with database later)
let pageVisits = [];
let users = [];

// Routes

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Get all page visits
app.get('/api/visits', (req, res) => {
  try {
    res.json({
      success: true,
      data: pageVisits,
      total: pageVisits.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visits'
    });
  }
});

// Add a new page visit
app.post('/api/visits', (req, res) => {
  try {
    const { url, title, timestamp, domain, textContent, metaDescription, isLearningContent } = req.body;
    
    // Validate required fields
    if (!url || !title) {
      return res.status(400).json({
        success: false,
        error: 'URL and title are required'
      });
    }
    
    // Create new visit object
    const visit = {
      id: Date.now(), // Simple ID for now
      url,
      title,
      timestamp: timestamp || new Date().toISOString(),
      domain,
      textContent: textContent || '',
      metaDescription: metaDescription || '',
      isLearningContent: isLearningContent || false,
      createdAt: new Date().toISOString()
    };
    
    // Add to our in-memory storage
    pageVisits.push(visit);
    
    // Keep only last 1000 visits to prevent memory issues
    if (pageVisits.length > 1000) {
      pageVisits = pageVisits.slice(-1000);
    }
    
    console.log(`New visit recorded: ${title} (${domain})`);
    
    res.json({
      success: true,
      data: visit,
      message: 'Visit recorded successfully'
    });
    
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record visit'
    });
  }
});

// Get visits by date range
app.get('/api/visits/range', (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let filteredVisits = pageVisits;
    
    if (startDate) {
      filteredVisits = filteredVisits.filter(visit => 
        new Date(visit.timestamp) >= new Date(startDate)
      );
    }
    
    if (endDate) {
      filteredVisits = filteredVisits.filter(visit => 
        new Date(visit.timestamp) <= new Date(endDate)
      );
    }
    
    res.json({
      success: true,
      data: filteredVisits,
      total: filteredVisits.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visits by date range'
    });
  }
});

// Get learning content only
app.get('/api/visits/learning', (req, res) => {
  try {
    const learningVisits = pageVisits.filter(visit => visit.isLearningContent);
    
    res.json({
      success: true,
      data: learningVisits,
      total: learningVisits.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch learning content'
    });
  }
});

// Get statistics
app.get('/api/stats', (req, res) => {
  try {
    const today = new Date().toDateString();
    const todayVisits = pageVisits.filter(visit => {
      const visitDate = new Date(visit.timestamp).toDateString();
      return visitDate === today;
    });
    
    const uniqueDomains = new Set(pageVisits.map(visit => visit.domain));
    const learningContent = pageVisits.filter(visit => visit.isLearningContent);
    
    res.json({
      success: true,
      data: {
        totalVisits: pageVisits.length,
        todayVisits: todayVisits.length,
        uniqueDomains: uniqueDomains.size,
        learningContent: learningContent.length,
        lastVisit: pageVisits.length > 0 ? pageVisits[pageVisits.length - 1] : null
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Delete all visits (for testing)
app.delete('/api/visits', (req, res) => {
  try {
    pageVisits = [];
    
    res.json({
      success: true,
      message: 'All visits cleared'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear visits'
    });
  }
});

// AI-powered endpoints

// Check AI service status
app.get('/api/ai/status', (req, res) => {
  const providerInfo = aiService.getProviderInfo();
  
  res.json({
    success: true,
    data: {
      enabled: aiService.isEnabled(),
      provider: providerInfo.name,
      cost: providerInfo.cost,
      freeLimit: providerInfo.freeLimit,
      signupUrl: providerInfo.signupUrl,
      message: aiService.isEnabled() 
        ? `${providerInfo.name} is ready (${providerInfo.cost})` 
        : `AI service is disabled - get free API key: ${providerInfo.signupUrl}`
    }
  });
});

// Summarize a specific page visit
app.post('/api/ai/summarize-page', async (req, res) => {
  try {
    const { visitId } = req.body;
    
    if (!visitId) {
      return res.status(400).json({
        success: false,
        error: 'Visit ID is required'
      });
    }
    
    // Find the visit
    const visit = pageVisits.find(v => v.id == visitId);
    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }
    
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available. Please configure OpenAI API key.'
      });
    }
    
    const summary = await aiService.summarizePage(visit);
    
    // Store the summary with the visit (in a real app, you'd save to database)
    visit.aiSummary = summary;
    visit.summarizedAt = new Date().toISOString();
    
    res.json({
      success: true,
      data: {
        visitId: visit.id,
        summary,
        title: visit.title,
        url: visit.url
      }
    });
    
  } catch (error) {
    console.error('Error summarizing page:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to summarize page'
    });
  }
});

// Generate daily summary
app.post('/api/ai/daily-summary', async (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: 'Date is required (YYYY-MM-DD format)'
      });
    }
    
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available. Please configure OpenAI API key.'
      });
    }
    
    // Get visits for the specified date
    const targetDate = new Date(date).toDateString();
    const dayVisits = pageVisits.filter(visit => {
      const visitDate = new Date(visit.timestamp).toDateString();
      return visitDate === targetDate;
    });
    
    const summary = await aiService.generateDailySummary(dayVisits, date);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Error generating daily summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate daily summary'
    });
  }
});

// Get daily summary for today
app.get('/api/ai/daily-summary/today', async (req, res) => {
  try {
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available. Please configure OpenAI API key.'
      });
    }
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const todayVisits = pageVisits.filter(visit => {
      const visitDate = new Date(visit.timestamp).toDateString();
      const targetDate = new Date(today).toDateString();
      return visitDate === targetDate;
    });
    
    const summary = await aiService.generateDailySummary(todayVisits, today);
    
    res.json({
      success: true,
      data: summary
    });
    
  } catch (error) {
    console.error('Error generating today\'s summary:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate today\'s summary'
    });
  }
});

// Extract key topics from content
app.post('/api/ai/extract-topics', async (req, res) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      });
    }
    
    if (!aiService.isEnabled()) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not available. Please configure OpenAI API key.'
      });
    }
    
    const topics = await aiService.extractKeyTopics(content);
    
    res.json({
      success: true,
      data: {
        topics,
        count: topics.length
      }
    });
    
  } catch (error) {
    console.error('Error extracting topics:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract topics'
    });
  }
});

// Get all visits with AI summaries
app.get('/api/visits/with-summaries', (req, res) => {
  try {
    const visitsWithSummaries = pageVisits.filter(visit => visit.aiSummary);
    
    res.json({
      success: true,
      data: visitsWithSummaries,
      total: visitsWithSummaries.length
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visits with summaries'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 AI Memory Coach API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 API endpoints: http://localhost:${PORT}/api/visits`);
});
