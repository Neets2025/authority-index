// Main server.js file
const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Import modular components
const apiHandlers = require('./modules/api-handlers');
const contentFetcher = require('./modules/content-fetcher');
const analysisEngine = require('./modules/analysis-engine');
const competitorAnalyzer = require('./modules/competitor-analyzer');

// Create Express app
const app = express();

// Your API keys from .env file
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const DATAFORSEO_LOGIN = process.env.DATAFORSEO_LOGIN;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Define the port
const PORT = process.env.PORT || 3000;

// Initialize modules with API keys
contentFetcher.init(DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD);
competitorAnalyzer.init(GOOGLE_PLACES_API_KEY, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD);

// ===== Routes =====

// Home route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working correctly' });
});

// API endpoint for analyzing a website
app.post('/api/analyze', apiHandlers.analyzeWebsite);

// API endpoint for auto-competitor analysis
app.post('/api/competitors/auto-analyze', apiHandlers.autoAnalyzeCompetitors);

// API endpoint for specific competitor analysis
app.post('/api/competitors/analyze-specific', apiHandlers.analyzeSpecificCompetitors);

// Start the server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║           LABSOLUTELY.ai Server Started           ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `);
  console.log(`Server running on port ${PORT}`);
  
  // Log API configuration status
  if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your-google-places-api-key') {
    console.log('⚠️  WARNING: Google Places API key is not configured - Google Places features will be disabled');
  } else {
    console.log('✅ Google Places API key is configured');
  }
  
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log('⚠️  WARNING: DataForSEO credentials are not configured - falling back to direct content fetching');
  } else {
    console.log('✅ DataForSEO credentials are configured');
  }
  
  console.log(`
  Available endpoints:
  - GET  /api/test                         - Test API status
  - POST /api/analyze                      - Analyze website content
  - POST /api/competitors/auto-analyze     - Auto-detect and analyze competitors
  - POST /api/competitors/analyze-specific - Analyze specific competitors
  `);
});

module.exports = app;
