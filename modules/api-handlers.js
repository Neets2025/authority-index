/**
 * API Handlers Module
 * Contains handlers for API endpoints
 */

const contentFetcher = require('./content-fetcher');
const analysisEngine = require('./analysis-engine');
const competitorAnalyzer = require('./competitor-analyzer');

/**
 * API endpoint handler for analyzing a website
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function analyzeWebsite(req, res) {
  try {
    const { url, industry, specialty } = req.body;
    
    if (!url || !industry) {
      return res.status(400).json({ error: 'URL and industry are required' });
    }
    
    // Validate URL format
    try {
      new URL(url); // This will throw if the URL is invalid
    } catch (e) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Fetch the page content
    console.log(`Analyzing ${url} for ${industry} industry${specialty ? ', ' + specialty + ' specialty' : ''}...`);
    let pageContent;
    try {
      pageContent = await contentFetcher.getWebsiteContent(url);
      
      if (!pageContent || pageContent.length < 100) {
        return res.status(400).json({ error: 'Could not extract sufficient content from the URL' });
      }
    } catch (error) {
      return res.status(400).json({ error: `Could not fetch page content: ${error.message}` });
    }
    
    // Analyze the content
    const analysis = analysisEngine.analyzeAuthorityIndex(pageContent, industry, specialty);
    
    // Try to find competitors automatically
    let competitors = [];
    let dataForSeoError = null;
    
    try {
      // Try to fetch competitors from DataForSEO
      competitors = await contentFetcher.fetchCompetitorsFromDataForSEO(url, 3);
      console.log(`Found ${competitors.length} competitors via DataForSEO`);
    } catch (error) {
      dataForSeoError = error.message;
      console.error('Error fetching competitors from DataForSEO:', error.message);
    }
    
    // If no competitors found or error occurred, generate simulated competitors
    if (competitors.length === 0) {
      console.log('Generating simulated competitors...');
      
      // Create user data for simulation based on analysis results
      const userData = {
        expertiseScore: analysis.expertiseSignals,
        authorityScore: analysis.digitalAuthority,
        url: url,
        industry: industry,
        specialty: specialty
      };
      
      // Generate simulated competitors
      competitors = competitorAnalyzer.generateSimulatedCompetitors(industry, specialty, userData, 3);
    }
    
    // Generate competitor insights
    const competitorInsights = competitorAnalyzer.generateCompetitiveInsights({
      url,
      industry,
      specialty,
      expertiseScore: analysis.expertiseSignals,
      authorityScore: analysis.digitalAuthority
    }, competitors, industry);
    
    // Add competitors to the analysis
    analysis.competitors = competitors;
    analysis.competitorInsights = competitorInsights;
    
    // Send the analysis results
    return res.json({ 
      analysis,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.1.0',
        dataSource: dataForSeoError ? 'direct-fetch' : 'dataforseo'
      }
    });
    
  } catch (error) {
    console.error('Error in analysis:', error);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}

/**
 * API endpoint handler for auto-analyzing competitors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function autoAnalyzeCompetitors(req, res) {
  try {
    const { url, industry, specialty } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'Website URL is required' });
    }
    
    if (!industry) {
      return res.status(400).json({ error: 'Industry is required' });
    }
    
    console.log(`Auto-analyzing competitors for ${url} in ${industry} industry...`);
    
    // Parse the URL to get domain
    let domain;
    try {
      const parsedUrl = new URL(url);
      domain = parsedUrl.hostname.replace('www.', '');
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    // Try to fetch competitors from DataForSEO
    let competitors = [];
    let dataForSeoError = null;
    
    try {
      competitors = await contentFetcher.fetchCompetitorsFromDataForSEO(url, 5);
      console.log(`Found ${competitors.length} competitors via DataForSEO`);
    } catch (error) {
      dataForSeoError = error.message;
      console.error('Error fetching competitors from DataForSEO:', error.message);
    }
    
    // If no competitors found from DataForSEO or error occurred, generate simulated competitors
    if (competitors.length === 0) {
      console.log('Generating simulated competitors...');
      
      // Create dummy user data for simulation
      const userData = {
        expertiseScore: 60,
        authorityScore: 55,
        url: url,
        industry: industry,
        specialty: specialty
      };
      
      // Generate simulated competitors
      const simulatedCompetitors = competitorAnalyzer.generateSimulatedCompetitors(industry, specialty, userData, 5);
      competitors = simulatedCompetitors;
      
      // Mark these as simulated
      competitors.forEach(comp => {
        comp.isSimulated = true;
      });
    }
    
    // Process each competitor to enhance with additional data
    const enhancedCompetitors = await competitorAnalyzer.processCompetitors(competitors, industry, specialty);
    
    // Create dummy user data
    const userData = {
      url,
      industry,
      specialty
    };
    
    // Generate competitive insights
    const insights = competitorAnalyzer.generateCompetitiveInsights(userData, enhancedCompetitors, industry);
    
    // Create analysis result
    const competitiveAnalysis = {
      competitors: enhancedCompetitors,
      industry,
      specialty,
      dataForSeoStatus: dataForSeoError ? `Error: ${dataForSeoError}` : 'Success',
      insights,
      autoGenerated: true
    };
    
    return res.json({ analysis: competitiveAnalysis });
    
  } catch (error) {
    console.error('Error in auto-competitor analysis:', error);
    return res.status(500).json({ error: 'Competitor analysis failed. Please try again.' });
  }
}

/**
 * API endpoint handler for analyzing specific competitors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function analyzeSpecificCompetitors(req, res) {
  try {
    const { competitors, industry, specialty, userData } = req.body;
    
    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return res.status(400).json({ error: 'Valid competitors array is required' });
    }
    
    if (!industry) {
      return res.status(400).json({ error: 'Industry is required' });
    }
    
    // Process each competitor to enhance with additional data
    const enhancedCompetitors = await competitorAnalyzer.processCompetitors(competitors, industry, specialty);
    
    // Generate additional competitors if we have fewer than 3
    if (enhancedCompetitors.length < 3) {
      const simulatedCompetitors = competitorAnalyzer.generateSimulatedCompetitors(
        industry, 
        specialty, 
        userData || { expertiseScore: 60, authorityScore: 50 }, 
        3 - enhancedCompetitors.length
      );
      
      // Store simulated competitors separately
      enhancedCompetitors.push(...simulatedCompetitors);
    }
    
    // Generate competitive insights
    const insights = competitorAnalyzer.generateCompetitiveInsights(userData, enhancedCompetitors, industry);
    
    // Create analysis
    const competitiveAnalysis = {
      competitors: enhancedCompetitors,
      industry,
      specialty,
      insights,
      userData
    };
    
    return res.json({ analysis: competitiveAnalysis });
    
  } catch (error) {
    console.error('Error in competitor analysis:', error);
    return res.status(500).json({ error: 'Competitor analysis failed. Please try again.' });
  }
}

module.exports = {
  analyzeWebsite,
  autoAnalyzeCompetitors,
  analyzeSpecificCompetitors
};
