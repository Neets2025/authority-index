/**
 * API Handlers Module
 * Contains handlers for API endpoints
 * Enhanced with OpenAI integration for improved content analysis
 */

const contentFetcher = require('./content-fetcher');
const analysisEngine = require('./analysis-engine');
const competitorAnalyzer = require('./competitor-analyzer');
const axios = require('axios');

// API Key for OpenAI
let OPENAI_API_KEY;

/**
 * Initialize the module with OpenAI API key
 * @param {string} apiKey - OpenAI API key
 */
function init(apiKey) {
  OPENAI_API_KEY = apiKey;
}

/**
 * Analyze content using OpenAI for enhanced expertise and trust signals
 * @param {string} content - Website content
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty (optional)
 * @returns {Promise<Object|null>} - AI-enhanced analysis or null if unavailable
 */
async function analyzeContentWithAI(content, industry, specialty = '') {
  try {
    if (!OPENAI_API_KEY) {
      console.log('OpenAI API key not configured');
      return null;
    }
    
    // Trim content to avoid excessive token usage
    const contentSample = content.substring(0, 2500).trim();
    
    if (contentSample.length < 100) {
      console.log('Content too short for meaningful AI analysis');
      return null;
    }
    
    const systemPrompt = `You are an expert analyst of professional websites in the ${industry} industry${specialty ? ` with specialty in ${specialty}` : ''}.
Your task is to analyze website content and identify signals of expertise, authority, and trustworthiness.
Provide a thorough, objective assessment using industry standards.`;

    const userPrompt = `Analyze this website content for an ${industry} business${specialty ? ` specializing in ${specialty}` : ''}.
Identify signals of expertise, authority, and trustworthiness.

Content sample:
${contentSample}

Evaluate the following:
1. Expertise signals: Credentials, qualifications, specialized knowledge
2. Authority indicators: Industry leadership, unique methodologies, original research
3. Trust elements: Transparency, client-focused language, balanced claims
4. Content quality: Depth, accuracy, and usefulness of information
5. Clarity: How well the business explains what they do and for whom

Format your response as a JSON object with these exact properties and no others:
{
  "expertiseScore": [0-100 numerical score],
  "authorityScore": [0-100 numerical score],
  "trustScore": [0-100 numerical score],
  "contentQualityScore": [0-100 numerical score],
  "strengths": [array of 2-3 expertise strengths identified],
  "weaknesses": [array of 2-3 expertise gaps or weaknesses],
  "keyCredentials": [array of credentials or qualifications mentioned],
  "uniqueInsights": [array of unique perspectives or methodologies],
  "trustSignals": [array of trust elements identified],
  "contentGaps": [array of missing content elements that would improve expertise perception]
}

Only return valid JSON that can be parsed. Do not include any explanations or text outside the JSON.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiResponse = response.data.choices[0].message.content;
      
      try {
        // Parse the JSON response
        const analysisData = JSON.parse(aiResponse);
        
        // Log token usage for cost monitoring
        if (response.data.usage) {
          console.log(`OpenAI token usage: ${response.data.usage.total_tokens} tokens`);
        }
        
        return analysisData;
      } catch (parseError) {
        console.error('Error parsing OpenAI response:', parseError.message);
        console.log('Raw response:', aiResponse);
        return null;
      }
    }
    
    console.log('No valid response from OpenAI');
    return null;
  } catch (error) {
    console.error('Error analyzing content with OpenAI:', error.message);
    return null;
  }
}

/**
 * Generate personalized recommendations using OpenAI
 * @param {Object} userData - User's website data
 * @param {Array} competitors - Analyzed competitors
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty (optional)
 * @returns {Promise<Array|null>} - Personalized recommendations or null if unavailable
 */
async function generateRecommendationsWithAI(userData, competitors, industry, specialty = '') {
  try {
    if (!OPENAI_API_KEY) {
      console.log('OpenAI API key not configured');
      return null;
    }
    
    // Find top competitor (the boss)
    const topCompetitor = competitors.find(c => c.isBoss) || competitors[0];
    
    const systemPrompt = `You are an expert digital marketing strategist specializing in ${industry} businesses${specialty ? ` with expertise in ${specialty}` : ''}.
Your task is to generate specific, actionable recommendations to improve a business's online authority and credibility.
Base your recommendations on the competitive analysis data provided. Be concrete and specific.`;

    const userPrompt = `Generate 3 specific, actionable recommendations to improve online authority and credibility for a ${industry} business${specialty ? ` specializing in ${specialty}` : ''}.

BUSINESS DATA:
- Expertise Score: ${userData.expertiseScore || 'Not available'}
- Digital Authority/Visibility Score: ${userData.authorityScore || userData.digitalAuthority || 'Not available'}
- Communication/Consistency Score: ${userData.consistencyScore || 'Not available'}

TOP COMPETITOR:
Name: ${topCompetitor?.name || 'Unknown competitor'}
Their strengths: ${topCompetitor?.strengths?.join(', ') || 'Not specified'}

Format your response as a JSON array of 3 recommendation objects with these properties:
[
  {
    "category": "One of: EXPERTISE VALIDATION, COMMUNICATION INTEGRITY, or AUDIENCE TRUST",
    "description": "Specific description including what the top competitor is doing well and what the business needs to improve",
    "impact": "Specific business impact statement with quantification where possible",
    "actionItems": ["Specific action 1", "Specific action 2", "Specific action 3"]
  }
]

Make recommendations industry-specific, mentioning typical trust signals, expertise markers, and communication standards for ${industry} businesses.
Each recommendation must be detailed, specific, and immediately actionable.
Only return valid JSON that can be parsed. Do not include any explanations or text outside the JSON array.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const aiResponse = response.data.choices[0].message.content;
      
      try {
        // Parse the JSON response
        const recommendations = JSON.parse(aiResponse);
        
        // Log token usage for cost monitoring
        if (response.data.usage) {
          console.log(`OpenAI token usage: ${response.data.usage.total_tokens} tokens`);
        }
        
        return recommendations;
      } catch (parseError) {
        console.error('Error parsing OpenAI recommendations:', parseError.message);
        console.log('Raw response:', aiResponse);
        return null;
      }
    }
    
    console.log('No valid recommendation response from OpenAI');
    return null;
  } catch (error) {
    console.error('Error generating recommendations with OpenAI:', error.message);
    return null;
  }
}

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
    
    // Analyze the content using existing analysis engine
    const analysis = analysisEngine.analyzeAuthorityIndex(pageContent, industry, specialty);
    
    // Enhance analysis with OpenAI if available
    let aiAnalysis = null;
    try {
      if (OPENAI_API_KEY) {
        console.log('Enhancing analysis with OpenAI...');
        aiAnalysis = await analyzeContentWithAI(pageContent, industry, specialty);
        
        if (aiAnalysis) {
          // Merge AI insights with existing analysis
          analysis.aiEnhanced = true;
          
          // Use AI scores to enhance or validate existing scores
          if (aiAnalysis.expertiseScore) {
            // Blend the scores - give more weight to AI for expertise validation
            analysis.expertiseSignals = Math.round((analysis.expertiseSignals * 0.4) + (aiAnalysis.expertiseScore * 0.6));
          }
          
          if (aiAnalysis.authorityScore) {
            // Blend the scores - give more weight to AI for authority assessment
            analysis.digitalAuthority = Math.round((analysis.digitalAuthority * 0.4) + (aiAnalysis.authorityScore * 0.6));
          }
          
          if (aiAnalysis.trustScore) {
            // Add trust score from AI
            analysis.trustScore = aiAnalysis.trustScore;
          }
          
          // Add AI-specific insights
          analysis.aiInsights = {
            strengths: aiAnalysis.strengths || [],
            weaknesses: aiAnalysis.weaknesses || [],
            keyCredentials: aiAnalysis.keyCredentials || [],
            uniqueInsights: aiAnalysis.uniqueInsights || [],
            trustSignals: aiAnalysis.trustSignals || [],
            contentGaps: aiAnalysis.contentGaps || []
          };
        }
      }
    } catch (aiError) {
      console.error('Error in AI analysis enhancement:', aiError.message);
      // Continue with standard analysis if AI enhancement fails
    }
    
    // Try to find competitors automatically
    let competitors = [];
    let dataForSeoError = null;
    
    try {
      // Try to fetch competitors from DataForSEO
      competitors = await contentFetcher.fetchCompetitorsFromDataForSEO(url, industry, 3);
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
    
    // Generate AI-powered recommendations if available
    let recommendations = [];
    try {
      if (OPENAI_API_KEY) {
        console.log('Generating AI-powered recommendations...');
        const aiRecommendations = await generateRecommendationsWithAI(
          {
            expertiseScore: analysis.expertiseSignals,
            authorityScore: analysis.digitalAuthority,
            digitalAuthority: analysis.digitalAuthority,
            consistencyScore: analysis.consistencyMarkers,
            industry,
            specialty
          },
          competitors,
          industry,
          specialty
        );
        
        if (aiRecommendations && Array.isArray(aiRecommendations)) {
          recommendations = aiRecommendations;
        }
      }
    } catch (recError) {
      console.error('Error generating AI recommendations:', recError.message);
      // Continue without AI recommendations if they fail
    }
    
    // Add competitors to the analysis
    analysis.competitors = competitors;
    analysis.competitorInsights = competitorInsights;
    analysis.recommendations = recommendations;
    
    // Calculate overall credibility score (for the dashboard)
    analysis.credibilityScore = Math.round(
      (analysis.expertiseSignals * 0.4) + 
      (analysis.digitalAuthority * 0.3) + 
      (analysis.consistencyMarkers * 0.3)
    );
    
    // Map scores to labels for the dashboard
    analysis.scoreLabels = {
      overall: mapScoreToLabel(analysis.credibilityScore),
      expertise: mapScoreToLabel(analysis.expertiseSignals),
      communication: mapScoreToLabel(analysis.consistencyMarkers),
      audienceTrust: mapScoreToLabel(analysis.digitalAuthority)
    };
    
    // Send the analysis results
    return res.json({ 
      analysis,
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.2.0',
        dataSource: dataForSeoError ? 'direct-fetch' : 'dataforseo',
        aiEnhanced: !!aiAnalysis
      }
    });
    
  } catch (error) {
    console.error('Error in analysis:', error);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}

/**
 * Helper function to map numeric scores to labels
 * @param {number} score - Numeric score (0-100)
 * @returns {string} - Score label
 */
function mapScoreToLabel(score) {
  if (score >= 80) return 'HIGH';
  if (score >= 60) return 'MEDIUM';
  if (score >= 40) return 'LOW';
  return 'POOR';
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
      competitors = await contentFetcher.fetchCompetitorsFromDataForSEO(url, industry, 3);
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
      specialty,
      expertiseScore: 60,
      authorityScore: 55,
      consistencyScore: 65
    };
    
    // Generate competitive insights
    const insights = competitorAnalyzer.generateCompetitiveInsights(userData, enhancedCompetitors, industry);
    
    // Try to generate AI-powered recommendations
    let recommendations = [];
    try {
      if (OPENAI_API_KEY) {
        console.log('Generating AI-powered competitor recommendations...');
        const aiRecommendations = await generateRecommendationsWithAI(
          userData,
          enhancedCompetitors,
          industry,
          specialty
        );
        
        if (aiRecommendations && Array.isArray(aiRecommendations)) {
          recommendations = aiRecommendations;
        }
      }
    } catch (recError) {
      console.error('Error generating AI competitor recommendations:', recError.message);
      // Continue without AI recommendations if they fail
    }
    
    // Create analysis result
    const competitiveAnalysis = {
      competitors: enhancedCompetitors,
      industry,
      specialty,
      dataForSeoStatus: dataForSeoError ? `Error: ${dataForSeoError}` : 'Success',
      insights,
      recommendations,
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
    
    // Try to generate AI-powered recommendations
    let recommendations = [];
    try {
      if (OPENAI_API_KEY) {
        console.log('Generating AI-powered specific competitor recommendations...');
        const aiRecommendations = await generateRecommendationsWithAI(
          userData,
          enhancedCompetitors,
          industry,
          specialty
        );
        
        if (aiRecommendations && Array.isArray(aiRecommendations)) {
          recommendations = aiRecommendations;
        }
      }
    } catch (recError) {
      console.error('Error generating AI specific competitor recommendations:', recError.message);
      // Continue without AI recommendations if they fail
    }
    
    // Create analysis
    const competitiveAnalysis = {
      competitors: enhancedCompetitors,
      industry,
      specialty,
      insights,
      recommendations,
      userData
    };
    
    return res.json({ analysis: competitiveAnalysis });
    
  } catch (error) {
    console.error('Error in competitor analysis:', error);
    return res.status(500).json({ error: 'Competitor analysis failed. Please try again.' });
  }
}

module.exports = {
  init,
  analyzeWebsite,
  autoAnalyzeCompetitors,
  analyzeSpecificCompetitors,
  analyzeContentWithAI,
  generateRecommendationsWithAI
};
