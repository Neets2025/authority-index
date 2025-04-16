/**
 * Competitor Analysis Module
 * Handles competitor data gathering, simulation, and competitive insights
 * Enhanced version with improved competitor selection and visualization positioning
 * Updated for MVP v2 with new market position matrix and OpenAI integration
 */

const axios = require('axios');
const contentFetcher = require('./content-fetcher');
const analysisEngine = require('./analysis-engine');
const { simulationData } = require('./constants');

// API Keys
let GOOGLE_PLACES_API_KEY;
let DATAFORSEO_LOGIN;
let DATAFORSEO_PASSWORD;
let OPENAI_API_KEY;

/**
 * Initialize the module with API credentials
 * @param {Object} config - Configuration object with API keys
 */
function init(config) {
  GOOGLE_PLACES_API_KEY = config.googlePlacesApiKey;
  DATAFORSEO_LOGIN = config.dataForSeoLogin;
  DATAFORSEO_PASSWORD = config.dataForSeoPassword;
  OPENAI_API_KEY = config.openaiApiKey;
}

/**
 * Search for a business by name using Google Places API
 * @param {string} name - Business name
 * @param {string} location - Optional location context
 * @returns {Promise<Object|null>} - Business data or null if not found
 */
async function searchBusinessByName(name, location) {
  try {
    if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your-google-places-api-key') {
      console.log('Google Places API key not configured');
      return null;
    }
    
    const encodedName = encodeURIComponent(name);
    const encodedLocation = encodeURIComponent(location || '');
    const locationBias = location ? `&locationbias=point:0,0` : ''; // Simplified location bias
    
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodedName}&inputtype=textquery&fields=place_id,name,formatted_address${locationBias}&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (data.status !== 'OK') {
      console.log(`Error searching for business: ${data.status}`);
      return null;
    }
    
    if (data.candidates && data.candidates.length > 0) {
      return data.candidates[0];
    } else {
      console.log('No places found for:', name);
      return null;
    }
  } catch (error) {
    console.error('Error searching business:', error.message);
    return null;
  }
}

/**
 * Get business details from Google Places API
 * @param {string} placeId - Google Place ID
 * @returns {Promise<Object|null>} - Business details or null if not found
 */
async function getBusinessDetails(placeId) {
  try {
    if (!placeId) {
      console.error('Place ID is required');
      return null;
    }
    
    if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your-google-places-api-key') {
      console.log('Google Places API key not configured');
      return null;
    }
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews,website,formatted_address,formatted_phone_number&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await axios.get(url);
    const data = response.data;
    
    if (data.status !== 'OK') {
      console.log(`Error getting business details: ${data.status}`);
      return null;
    }
    
    if (data.result) {
      return data.result;
    } else {
      console.log('No details found for place ID:', placeId);
      return null;
    }
  } catch (error) {
    console.error('Error getting business details:', error.message);
    return null;
  }
}

/**
 * Get domain overview data from DataForSEO
 * @param {string} domain - Domain to analyze
 * @returns {Promise<Object|null>} - Domain overview data
 */
async function getDomainOverview(domain) {
  try {
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      console.log('DataForSEO credentials not configured');
      return null;
    }
    
    const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
    
    const payload = [{
      "target": domain,
      "location_name": "Australia",
      "language_name": "English"
    }];
    
    const response = await axios({
      method: 'POST',
      url: 'https://api.dataforseo.com/v3/domain_analytics/domain_overview',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(payload)
    });
    
    if (response.data && response.data.tasks && response.data.tasks.length > 0) {
      return response.data.tasks[0].result[0];
    }
    
    console.log('No domain overview data returned');
    return null;
  } catch (error) {
    console.error(`Error getting domain overview for ${domain}:`, error.message);
    return null;
  }
}

/**
 * Get backlink data from DataForSEO
 * @param {string} domain - Domain to analyze
 * @returns {Promise<Object|null>} - Backlink data
 */
async function getBacklinkData(domain) {
  try {
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      console.log('DataForSEO credentials not configured');
      return null;
    }
    
    const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
    
    const payload = [{
      "target": domain,
      "limit": 100
    }];
    
    const response = await axios({
      method: 'POST',
      url: 'https://api.dataforseo.com/v3/backlinks/overview',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(payload)
    });
    
    if (response.data && response.data.tasks && response.data.tasks.length > 0) {
      return response.data.tasks[0].result[0];
    }
    
    console.log('No backlink data returned');
    return null;
  } catch (error) {
    console.error(`Error getting backlink data for ${domain}:`, error.message);
    return null;
  }
}

/**
 * Analyze content using OpenAI
 * @param {string} content - Website content to analyze
 * @param {string} industry - Industry category
 * @param {string} specialty - Optional industry specialty
 * @returns {Promise<Object|null>} - AI analysis results
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
 * Helper function to generate scores with better distribution for simulated competitors
 * @returns {number} - Generated score between 30 and 95
 */
function generateScoreWithDistribution() {
  // Use a triangular distribution centered at different points
  // This creates more realistic score distributions
  const distributionTypes = [
    { center: 45, spread: 15 },  // Lower scores
    { center: 60, spread: 15 },  // Medium scores
    { center: 75, spread: 15 }   // Higher scores
  ];
  
  // Choose a random distribution type
  const distribution = distributionTypes[Math.floor(Math.random() * distributionTypes.length)];
  
  // Generate a triangular distribution around the center
  // This creates more clustering around typical values
  const u = Math.random();
  const v = Math.random();
  let triangular;
  
  if (u > v) {
    triangular = distribution.center + (distribution.spread * (u - 0.5));
  } else {
    triangular = distribution.center - (distribution.spread * (v - 0.5)); 
  }
  
  // Ensure the score is within 0-100 range
  return Math.max(30, Math.min(95, Math.round(triangular)));
}

/**
 * Generates simulated competitors when real data is unavailable
 * Enhanced to consider specialty and location
 * Updated for MVP v2 with new market position terminology
 * @param {string} industry - The industry category
 * @param {string} specialty - Optional specialty within the industry
 * @param {Object} userData - User's website data
 * @param {number} count - Number of competitors to generate
 * @returns {Array} - List of simulated competitors
 */
function generateSimulatedCompetitors(industry, specialty, userData, count) {
  const simulatedCompetitors = [];
  
  // Industry-specific business name prefixes and suffixes
  const prefixes = simulationData.industryPrefixes[industry] || simulationData.defaultPrefixes;
  let suffixes = simulationData.industrySuffixes[industry] || simulationData.defaultSuffixes;
  
  // Create specialty-specific name components if specialty is provided
  let specialtyTerms = [];
  if (specialty) {
    // Map specialties to specific terms
    const specialtyMap = {
      "Plastic Surgery": ["Plastic", "Cosmetic", "Aesthetic", "Reconstructive"],
      "Dental": ["Dental", "Orthodontic", "Periodontic"],
      "Medical": ["Medical", "Health", "Wellness"],
      "Construction": ["Home", "Building", "Renovation", "Custom"],
      "Environmental": ["Green", "Sustainable", "Eco", "Natural"],
      "Finance": ["Financial", "Wealth", "Investment", "Accounting"],
      "Legal": ["Law", "Legal", "Justice", "Attorney"],
      "Real Estate": ["Property", "Realty", "Estate", "Housing"]
      // Add more specialties as needed
    };
    
    specialtyTerms = specialtyMap[specialty] || [specialty];
  }
  
  // Get location data if available
  const userLocation = userData.location || contentFetcher.extractLocationFromDomain(userData.domain) || '';
  const locationTerms = userLocation ? userLocation.split(',').map(l => l.trim()) : [];
  const userState = locationTerms.length > 0 ? locationTerms[locationTerms.length - 1] : '';
  const userCity = locationTerms.length > 0 ? locationTerms[0] : '';
  
  // Helper function to fetch traffic data
  const getEstimatedTraffic = (industry, isTopCompetitor) => {
    const baseTraffic = {
      "Healthcare": { min: 500, max: 2000 },
      "Construction": { min: 300, max: 1500 },
      "Environmental": { min: 400, max: 1200 },
      "Technology": { min: 800, max: 3000 },
      "Finance": { min: 600, max: 2500 },
      "Legal": { min: 400, max: 2000 },
      "Real Estate": { min: 700, max: 2800 }
    };
    
    const indBase = baseTraffic[industry] || { min: 500, max: 2000 };
    const multiplier = isTopCompetitor ? 1.5 : 1;
    
    return Math.floor((Math.random() * (indBase.max - indBase.min) + indBase.min) * multiplier);
  };
  
  // Generate the competitors
  for (let i = 0; i < count; i++) {
    // Get random prefix and suffix
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // Incorporate specialty into the name for some competitors
    let companyName;
    if (specialty && specialtyTerms.length > 0 && Math.random() > 0.4) {
      const specialtyTerm = specialtyTerms[Math.floor(Math.random() * specialtyTerms.length)];
      companyName = `${prefix} ${specialtyTerm} ${suffix}`;
    } else {
      companyName = `${prefix} ${suffix}`;
    }
    
    // Add location to some competitor names
    let competitorLocation = '';
    if (locationTerms.length > 0) {
      if (Math.random() > 0.6) {
        // Use exact location sometimes
        competitorLocation = userLocation;
        
        // Add location to name for some businesses
        if (Math.random() > 0.7) {
          companyName = `${companyName} ${userCity}`;
        }
      } else {
        // Use same state but different local area
        const nearbyAreas = [
          "North", "South", "East", "West", "Central", 
          "Greater", "Inner", "Outer", "Metro"
        ];
        
        const areaPrefix = nearbyAreas[Math.floor(Math.random() * nearbyAreas.length)];
        const localArea = `${areaPrefix} ${userCity}`;
        competitorLocation = `${localArea}, ${userState}`;
        
        // Add location to name for some businesses
        if (Math.random() > 0.7) {
          companyName = `${companyName} ${localArea}`;
        }
      }
    }
    
    // Use improved score generation for better distribution
    const expertiseScore = generateScoreWithDistribution();
    const authorityScore = generateScoreWithDistribution();
    const consistencyScore = generateScoreWithDistribution();
    
    // For some competitors, make them clearly better to establish as "the boss"
    const isTopCompetitor = i === 0; // First competitor is the "boss"
    
    // Determine market position
    const position = determineMarketPosition(expertiseScore, authorityScore);
    
    // Traffic and social data (for DataForSEO simulation)
    const traffic = getEstimatedTraffic(industry, isTopCompetitor);
    const socialFollowers = isTopCompetitor ? 
                          Math.floor(Math.random() * 2000) + 1000 : 
                          Math.floor(Math.random() * 1000) + 100;
    
    // Calculate SEO strength
    const seoStrength = isTopCompetitor ? 75 + Math.random() * 25 : 40 + Math.random() * 40;
    
    // Generate URLs with specialty and location info
    let domainBase = companyName.toLowerCase()
                     .replace(/\s+/g, '')
                     .replace(/[^a-z0-9]/g, '');
    
    // Limit domain length
    if (domainBase.length > 20) {
      domainBase = domainBase.substring(0, 20);
    }
    
    const domain = `${domainBase}.com.au`;
    
    // Create the competitor object
    const competitor = {
      name: companyName,
      url: `https://www.${domain}`,
      domain: domain,
      expertiseScore,
      authorityScore,
      communicationScore: consistencyScore, // Renamed to match MVP v2
      position,
      isSimulated: true,
      isBoss: isTopCompetitor,
      // Add specialty and location data
      specialty: specialty || industry,
      location: competitorLocation,
      seoData: {
        traffic: traffic,
        socialFollowers: socialFollowers,
        seoStrength: seoStrength,
        keywords: Math.floor(traffic / 5) + Math.floor(Math.random() * 100),
        backlinks: Math.floor(traffic / 10) + Math.floor(Math.random() * 50)
      },
      googleData: {
        rating: 3.5 + (Math.random() * 1.5), // 3.5 to 5.0
        userRatingsTotal: Math.floor(Math.random() * 50) + 5 // 5 to 55
      }
    };
    
    // If this is the top competitor and should be better than the user
    if (isTopCompetitor) {
      // Ensure at least one score is better than the user's
      const userExpertise = userData.expertiseScore || 60;
      const userAuthority = userData.authorityScore || 50;
      
      if (competitor.expertiseScore <= userExpertise && competitor.authorityScore <= userAuthority) {
        if (Math.random() > 0.5) {
          // Make expertise better
          competitor.expertiseScore = Math.min(95, userExpertise + Math.floor(Math.random() * 15) + 5);
        } else {
          // Make authority better
          competitor.authorityScore = Math.min(95, userAuthority + Math.floor(Math.random() * 15) + 5);
        }
      }
      
      // Position in Verified Expert quadrant
      competitor.position = "VERIFIED EXPERT";
      
      // Improve Google data for boss competitor
      competitor.googleData.rating = Math.min(5.0, 4.2 + (Math.random() * 0.8));
      competitor.googleData.userRatingsTotal = Math.floor(Math.random() * 100) + 25; // 25 to 125
    }
    
    simulatedCompetitors.push(competitor);
  }
  
  return simulatedCompetitors;
}

/**
 * Enhances a competitor with additional data from Google Places, DataForSEO, and website analysis
 * Enhanced for MVP v2 with OpenAI content analysis option
 * @param {Object} competitor - Basic competitor data
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty
 * @returns {Promise<Object>} - Enhanced competitor data
 */
async function enhanceCompetitorData(competitor, industry, specialty) {
  try {
    let enhancedCompetitor = { ...competitor };
    
    // If we have a name but no Google data, try to find it
    if (competitor.name && !competitor.googleData && !competitor.placeId) {
      // Skip the Google API call if API key isn't configured
      if (GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY !== 'your-google-places-api-key') {
        // Add specialty to search for more relevant results
        const searchName = specialty ? `${competitor.name} ${specialty}` : competitor.name;
        
        // Search for the business
        const searchResult = await searchBusinessByName(searchName, competitor.location || '');
        
        if (searchResult && searchResult.place_id) {
          // Get detailed information
          const details = await getBusinessDetails(searchResult.place_id);
          
          if (details) {
            enhancedCompetitor.googleData = {
              placeId: searchResult.place_id,
              formattedAddress: details.formatted_address || searchResult.formatted_address,
              rating: details.rating || 0,
              userRatingsTotal: details.user_ratings_total || 0,
              website: details.website || '',
              phoneNumber: details.formatted_phone_number || ''
            };
            
            // If the competitor doesn't have review data, use the Google data
            if (!enhancedCompetitor.googleReviews && details.user_ratings_total) {
              enhancedCompetitor.googleReviews = details.user_ratings_total;
            }
            
            // Extract location if we don't have it yet
            if (!enhancedCompetitor.location && details.formatted_address) {
              enhancedCompetitor.location = details.formatted_address;
            }
          }
        }
      } else {
        console.log('Skipping Google Places API call - API key not configured');
      }
    }
    
    // Try to get DataForSEO data if we have a URL
    if (enhancedCompetitor.url && (!enhancedCompetitor.seoData || Object.keys(enhancedCompetitor.seoData).length === 0)) {
      try {
        // Extract domain from URL
        const domain = enhancedCompetitor.url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
        
        // Get domain overview data
        const domainData = await getDomainOverview(domain);
        if (domainData) {
          enhancedCompetitor.seoData = {
            ...(enhancedCompetitor.seoData || {}),
            traffic: domainData.organic_traffic_monthly || 0,
            keywords: domainData.organic_keywords_count || 0,
            backlinks: domainData.backlinks_count || 0,
            seoStrength: calculateSeoStrength(domainData)
          };
        }
        
        // Get backlink data
        const backlinkData = await getBacklinkData(domain);
        if (backlinkData) {
          enhancedCompetitor.seoData = {
            ...(enhancedCompetitor.seoData || {}),
            backlinks: backlinkData.total_backlinks || enhancedCompetitor.seoData.backlinks || 0,
            referringDomains: backlinkData.referring_domains || 0
          };
        }
      } catch (seoError) {
        console.error(`Error getting SEO data for ${enhancedCompetitor.url}:`, seoError.message);
      }
    }
    
    // Analyze content if we have a URL but no expertise/authority scores
    if (enhancedCompetitor.url && (!enhancedCompetitor.expertiseScore || !enhancedCompetitor.authorityScore)) {
      try {
        console.log(`Analyzing competitor website: ${enhancedCompetitor.url}`);
        
        // Fetch content using the content fetcher module
        const pageContent = await contentFetcher.getWebsiteContent(enhancedCompetitor.url);
        
        if (pageContent && pageContent.length > 100) {
          // Try AI analysis first if OpenAI is configured
          let aiAnalysis = null;
          if (OPENAI_API_KEY) {
            try {
              aiAnalysis = await analyzeContentWithAI(pageContent, industry, specialty);
            } catch (aiError) {
              console.error(`Error in AI analysis for competitor: ${aiError.message}`);
            }
          }
          
          if (aiAnalysis) {
            // Use AI analysis for scores
            enhancedCompetitor.expertiseScore = aiAnalysis.expertiseScore;
            enhancedCompetitor.authorityScore = aiAnalysis.authorityScore;
            enhancedCompetitor.communicationScore = Math.round((aiAnalysis.contentQualityScore + aiAnalysis.trustScore) / 2);
            enhancedCompetitor.strengths = aiAnalysis.strengths;
            enhancedCompetitor.weaknesses = aiAnalysis.weaknesses;
            enhancedCompetitor.hasAiAnalysis = true;
          } else {
            // Fallback to standard analysis
            const analysis = analysisEngine.analyzeAuthorityIndex(pageContent, industry, specialty);
            
            // Add the scores to the competitor
            enhancedCompetitor.expertiseScore = analysis.expertiseSignals;
            enhancedCompetitor.authorityScore = analysis.digitalAuthority;
            enhancedCompetitor.communicationScore = analysis.consistencyMarkers;
          }
          
          // Determine market position based on updated MVP v2 terminology
          enhancedCompetitor.position = determineMarketPosition(
            enhancedCompetitor.expertiseScore, 
            enhancedCompetitor.authorityScore
          );
          
          enhancedCompetitor.hasAnalysis = true;
        }
      } catch (analysisError) {
        console.error(`Error analyzing competitor website: ${analysisError.message}`);
        // If analysis fails, we'll generate plausible scores below
        enhancedCompetitor.hasAnalysis = false;
      }
    }
    
    // If we still don't have scores, generate plausible ones
    if (!enhancedCompetitor.expertiseScore || !enhancedCompetitor.authorityScore) {
      // Generate scores partly based on Google ratings if available
      if (enhancedCompetitor.googleData && enhancedCompetitor.googleData.rating) {
        const baseExpertiseScore = 50 + Math.round(Math.random() * 30);
        const baseAuthorityScore = 50 + Math.round((enhancedCompetitor.googleData.rating / 5) * 30);
        
        enhancedCompetitor.expertiseScore = baseExpertiseScore;
        enhancedCompetitor.authorityScore = baseAuthorityScore;
        enhancedCompetitor.communicationScore = 45 + Math.round(Math.random() * 25);
        enhancedCompetitor.isEstimated = true;
      } else {
        // Completely randomized but plausible scores
        enhancedCompetitor.expertiseScore = 40 + Math.round(Math.random() * 40);
        enhancedCompetitor.authorityScore = 40 + Math.round(Math.random() * 40);
        enhancedCompetitor.communicationScore = 40 + Math.round(Math.random() * 30);
        enhancedCompetitor.isEstimated = true;
      }
      
      // Set position based on generated scores
      enhancedCompetitor.position = determineMarketPosition(
        enhancedCompetitor.expertiseScore, 
        enhancedCompetitor.authorityScore
      );
    }
    
    // Calculate credibility score for consistency with user scoring
    enhancedCompetitor.credibilityScore = Math.round(
      (enhancedCompetitor.expertiseScore * 0.4) + 
      (enhancedCompetitor.authorityScore * 0.3) + 
      (enhancedCompetitor.communicationScore * 0.3)
    );
    
    // Map scores to labels
    enhancedCompetitor.scoreLabels = {
      overall: mapScoreToLabel(enhancedCompetitor.credibilityScore),
      expertise: mapScoreToLabel(enhancedCompetitor.expertiseScore),
      audienceTrust: mapScoreToLabel(enhancedCompetitor.authorityScore),
      communication: mapScoreToLabel(enhancedCompetitor.communicationScore)
    };
    
    return enhancedCompetitor;
  } catch (error) {
    console.error(`Error enhancing competitor data for ${competitor.name || 'unknown competitor'}:`, error.message);
    return competitor; // Return original competitor if enhancement fails
  }
}

/**
 * Helper function to calculate SEO strength from DataForSEO metrics
 * @param {Object} domainData - Domain data from DataForSEO
 * @returns {number} - SEO strength score (0-100)
 */
function calculateSeoStrength(domainData) {
  if (!domainData) return 50;
  
  let score = 50; // Base score
  
  // Traffic score (up to +20 points)
  const traffic = domainData.organic_traffic_monthly || 0;
  if (traffic > 10000) score += 20;
  else if (traffic > 5000) score += 15;
  else if (traffic > 1000) score += 10;
  else if (traffic > 500) score += 5;
  
  // Keywords score (up to +15 points)
  const keywords = domainData.organic_keywords_count || 0;
  if (keywords > 1000) score += 15;
  else if (keywords > 500) score += 10;
  else if (keywords > 100) score += 5;
  
  // Backlinks score (up to +15 points)
  const backlinks = domainData.backlinks_count || 0;
  if (backlinks > 10000) score += 15;
  else if (backlinks > 5000) score += 10;
  else if (backlinks > 1000) score += 5;
  
  return Math.min(100, score);
}

/**
 * Applies a curve to scores to increase differentiation
 * This function applies a mild sigmoid-like curve that:
 * - Pushes middle scores (40-70) further apart
 * - Keeps very high and very low scores relatively stable
 * @param {number} score - Original score (0-100)
 * @returns {number} - Curved score (0-100)
 */
function applyCurve(score) {
  // Normalize score to 0-1 range
  const normalized = score / 100;
  
  // Apply sigmoid-inspired curve to middle values
  // This is a custom curve that creates more separation in the middle range
  let curved;
  if (normalized < 0.4) {
    // Lower scores get pushed down slightly
    curved = normalized * 0.9;
  } else if (normalized > 0.7) {
    // Higher scores get pushed up slightly
    curved = 0.7 + ((normalized - 0.7) * 1.15);
  } else {
    // Middle scores get spread out more significantly
    curved = 0.3 + ((normalized - 0.4) * 1.3);
  }
  
  // Convert back to 0-100 range and ensure it's within bounds
  return Math.max(0, Math.min(100, Math.round(curved * 100)));
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
 * Determines market position based on expertise and authority scores with improved distribution
 * Uses percentile-based positioning and industry-specific thresholds
 * @param {number} expertiseScore - Expertise validation score
 * @param {number} authorityScore - Digital authority score
 * @param {Array} competitors - Array of competitor data for relative positioning
 * @param {string} industry - Industry category for specific thresholds
 * @returns {string} - Market position category
 */
function determineMarketPosition(expertiseScore, authorityScore, competitors = [], industry = '') {
  // Default thresholds if we don't have competitor data
  let expertiseThreshold = 70; // Increased from 60
  let authorityThreshold = 65; // Increased from 60
  
  // Industry-specific threshold adjustments
  // Some industries naturally score higher on certain metrics
  const industryAdjustments = {
    "Healthcare": { expertise: 5, authority: 0 },    // Medical credentials boost expertise scores
    "Finance": { expertise: 3, authority: 2 },       // Financial credentials matter
    "Legal": { expertise: 5, authority: 0 },         // Legal credentials boost expertise
    "Technology": { expertise: 0, authority: 5 },    // Tech tends to have higher online visibility
    "Construction": { expertise: 0, authority: -5 }, // Construction often has lower online visibility
    "Real Estate": { expertise: -2, authority: 3 },  // Real estate tends toward visibility
    "Environmental": { expertise: 2, authority: -3 } // Environmental services often more expertise-focused
  };
  
  // Apply industry adjustments if available
  if (industry && industryAdjustments[industry]) {
    expertiseThreshold += industryAdjustments[industry].expertise;
    authorityThreshold += industryAdjustments[industry].authority;
  }
  
  // If we have competitors, use percentile-based positioning
  if (competitors && competitors.length >= 3) {
    // Extract scores from competitors
    const expertiseScores = competitors.map(c => c.expertiseScore || 50);
    const authorityScores = competitors.map(c => c.authorityScore || 50);
    
    // Calculate 70th percentile for more meaningful thresholds
    expertiseScores.sort((a, b) => a - b);
    authorityScores.sort((a, b) => a - b);
    
    const expertiseIndex = Math.floor(expertiseScores.length * 0.7);
    const authorityIndex = Math.floor(authorityScores.length * 0.7);
    
    // Use the 70th percentile values as thresholds
    const expertisePercentile = expertiseScores[expertiseIndex];
    const authorityPercentile = authorityScores[authorityIndex];
    
    // Blend percentile with base thresholds for stability
    expertiseThreshold = Math.round((expertisePercentile * 0.7) + (expertiseThreshold * 0.3));
    authorityThreshold = Math.round((authorityPercentile * 0.7) + (authorityThreshold * 0.3));
    
    // Ensure minimum separation between thresholds for meaningful quadrants
    const minThresholdSeparation = 5;
    
    // If thresholds are too close, push them apart
    if (Math.abs(expertiseThreshold - authorityThreshold) < minThresholdSeparation) {
      // Increase the higher one and decrease the lower one
      if (expertiseThreshold > authorityThreshold) {
        expertiseThreshold += Math.ceil(minThresholdSeparation / 2);
        authorityThreshold -= Math.floor(minThresholdSeparation / 2);
      } else {
        authorityThreshold += Math.ceil(minThresholdSeparation / 2);
        expertiseThreshold -= Math.floor(minThresholdSeparation / 2);
      }
    }
  }
  
  // Apply a curve to scores to increase differentiation
  // This spreads scores out more effectively
  const curvedExpertise = applyCurve(expertiseScore);
  const curvedAuthority = applyCurve(authorityScore);
  
  // Determine position based on curved scores and calculated thresholds
  if (curvedExpertise >= expertiseThreshold && curvedAuthority >= authorityThreshold) {
    return "VERIFIED EXPERT";
  } else if (curvedExpertise >= expertiseThreshold && curvedAuthority < authorityThreshold) {
    return "HIDDEN EXPERT";
  } else if (curvedExpertise < expertiseThreshold && curvedAuthority >= authorityThreshold) {
    return "VISIBILITY WITHOUT SUBSTANCE";
  } else {
    return "LOW PROFILE";
  }
}

/**
 * Generates competitive insights based on analysis of competitors
 * Enhanced for MVP v2 with industry average comparison
 * @param {Object} userData - User's website data
 * @param {Array} competitors - List of competitor websites and their analysis
 * @param {string} industry - The industry category
 * @returns {Array} - List of competitive insights
 */
function generateCompetitiveInsights(userData, competitors, industry) {
  const insights = [];
  
  // Find top competitor by digital metrics (combined SEO and Google data)
  if (competitors && competitors.length > 0) {
    // Sort competitors by a combined score of Google ratings, SEO data, and authority
    const sortedCompetitors = [...competitors].sort((a, b) => {
      // Calculate a comprehensive score for each competitor
      const aGoogleScore = (a.googleData?.userRatingsTotal || 0) * (a.googleData?.rating || 3) / 5;
      const bGoogleScore = (b.googleData?.userRatingsTotal || 0) * (b.googleData?.rating || 3) / 5;
      
      const aSeoScore = (a.seoData?.traffic || 0) / 100 + (a.seoData?.keywords || 0) / 50 + (a.seoData?.backlinks || 0) / 20 + (a.seoData?.socialFollowers || 0) / 50;
      const bSeoScore = (b.seoData?.traffic || 0) / 100 + (b.seoData?.keywords || 0) / 50 + (b.seoData?.backlinks || 0) / 20 + (b.seoData?.socialFollowers || 0) / 50;
      
      const aAuthorityScore = a.authorityScore || 50;
      const bAuthorityScore = b.authorityScore || 50;
      
      const aTotal = aGoogleScore + aSeoScore + aAuthorityScore;
      const bTotal = bGoogleScore + bSeoScore + bAuthorityScore;
      
      return bTotal - aTotal; // Sort descending
    });
    
    const topCompetitor = sortedCompetitors[0];
    
    // Generate competitive insight
    if (topCompetitor) {
      // Determine what the top competitor excels at
      let competitorStrength = "";
      let strengthData = "";
      
      // Check which metric is highest
      if (topCompetitor.seoData && topCompetitor.seoData.traffic && topCompetitor.seoData.traffic > 1000) {
        competitorStrength = "SEO and website traffic";
        strengthData = `with approximately ${topCompetitor.seoData.traffic.toLocaleString()} monthly visitors`;
      } else if (topCompetitor.googleData && topCompetitor.googleData.userRatingsTotal > 15) {
        // Use industry-specific terminology for reviews
        if (industry === "Healthcare") {
          competitorStrength = "patient reviews and testimonials";
        } else if (industry === "Construction") {
          competitorStrength = "client reviews and portfolio showcases";
        } else if (industry === "Finance") {
          competitorStrength = "client testimonials and case studies";
        } else if (industry === "Legal") {
          competitorStrength = "client reviews and case outcomes";
        } else if (industry === "Real Estate") {
          competitorStrength = "client reviews and property listings";
        } else {
          competitorStrength = "customer reviews and testimonials";
        }
        
        strengthData = `with ${topCompetitor.googleData.userRatingsTotal} Google reviews (${topCompetitor.googleData.rating}/5 stars)`;
      } else if (topCompetitor.seoData && topCompetitor.seoData.socialFollowers && topCompetitor.seoData.socialFollowers > 500) {
        competitorStrength = "social media presence";
        strengthData = `with approximately ${topCompetitor.seoData.socialFollowers.toLocaleString()} social media followers`;
      } else if (topCompetitor.seoData && topCompetitor.seoData.backlinks && topCompetitor.seoData.backlinks > 50) {
        competitorStrength = "link building and industry references";
        strengthData = `with ${topCompetitor.seoData.backlinks} websites linking to them`;
      } else {
        competitorStrength = "online marketing";
        strengthData = "giving them a competitive advantage";
      }
      
      // Check gap between top competitor and user's site (if available)
      let competitiveGap = "";
      if (userData.expertiseScore && userData.authorityScore &&
          topCompetitor.expertiseScore && topCompetitor.authorityScore) {
          
        const expertiseGap = topCompetitor.expertiseScore - userData.expertiseScore;
        const authorityGap = topCompetitor.authorityScore - userData.authorityScore;
        
        if (expertiseGap > 20 && authorityGap > 20) {
          competitiveGap = " They significantly outperform in both expertise demonstration and digital authority.";
        } else if (expertiseGap > 20) {
          competitiveGap = " Their main advantage is in expertise demonstration on their website.";
        } else if (authorityGap > 20) {
          competitiveGap = " Their primary advantage is in online visibility and digital authority.";
        }
      }
      
      // Craft the insight message
      insights.push({
        type: "competitor",
        title: `${topCompetitor.name} Dominates Online`,
        message: `${topCompetitor.name} is investing in ${competitorStrength}, ${strengthData} and giving them a competitive advantage in online visibility.${competitiveGap}`
      });
      
      // Mark this competitor as "the boss"
      topCompetitor.isBoss = true;
      
      // Position the "boss" competitor in a position of strength
      // Update their quadrant position if they're currently in a weak position
      if (topCompetitor.position === "LOW PROFILE" || !topCompetitor.position) {
        // Ensure they're placed in a stronger position (Verified Expert)
        topCompetitor.position = "VERIFIED EXPERT";
        if (topCompetitor.authorityScore && topCompetitor.authorityScore < 60) {
          topCompetitor.authorityScore = Math.max(65, topCompetitor.authorityScore + 15);
        }
        if (topCompetitor.expertiseScore && topCompetitor.expertiseScore < 60) {
          topCompetitor.expertiseScore = Math.max(65, topCompetitor.expertiseScore + 10);
        }
      }
    }
  }
  
 // Generate industry-specific insights
  if (industry === "Healthcare") {
    insights.push({
      type: "industry",
      title: "Healthcare Authority",
      message: "In healthcare, balancing clinical expertise with digital visibility is critical for establishing trust while complying with Australian regulations."
    });
    
    // Add AHPRA insight for regulated specialties
    const specialty = userData.specialty;
    if (specialty === "Plastic Surgery" || specialty === "Cosmetic Surgery") {
      insights.push({
        type: "regulation",
        title: "AHPRA Compliance",
        message: "For plastic and cosmetic surgeons, AHPRA guidelines limit use of patient testimonials and before/after photos. Focus on educational content and your credentials instead."
      });
    }
  } else if (industry === "Construction") {
    insights.push({
      type: "industry",
      title: "Construction Credibility",
      message: "In construction, showcasing completed projects and proven results builds more credibility than general marketing claims."
    });
  } else if (industry === "Environmental") {
    insights.push({
      type: "industry",
      title: "Environmental Impact",
      message: "Environmental services require demonstrating both expertise and measurable outcomes - focus on case studies with quantifiable results."
    });
  } else if (industry === "Finance") {
    insights.push({
      type: "industry",
      title: "Finance Trust Factors",
      message: "In financial services, clear display of credentials, AFSL information, and educational content builds more trust than marketing claims."
    });
  } else if (industry === "Legal") {
    insights.push({
      type: "industry",
      title: "Legal Authority",
      message: "For legal services, demonstrating specialized expertise and successful outcomes (while maintaining client confidentiality) is key to digital authority."
    });
  } else if (industry === "Real Estate") {
    insights.push({
      type: "industry",
      title: "Property Expertise",
      message: "In real estate, local market knowledge and property success stories create more authority than general promotional content."
    });
  }
  
  // Generate hidden expertise insight if applicable
  if (userData.expertiseScore >= 65 && 
      userData.authorityScore < 50 && 
      (userData.expertiseScore - userData.authorityScore) >= 20) {
    
    insights.push({
      type: "hidden",
      title: "Hidden Expert Detected",
      message: "Your expertise is being hidden by low online visibility. Your ability significantly outshines your online presence, making it difficult for potential clients to discover your services."
    });
  }
  
  // Industry average comparison insight
  insights.push({
    type: "average",
    title: "Industry Average Comparison",
    message: `Compared to the Australian industry average for ${industry}, your overall credibility score is ${getComparisonToAverage(userData.credibilityScore || 0, industry)}. ${getIndustryAdviceByComparison(userData.credibilityScore || 0, industry)}`
  });
  
  // Return top insights (but always include the competitor insight if available)
  const competitorInsight = insights.find(i => i.type === "competitor");
  const hiddenInsight = insights.find(i => i.type === "hidden");
  const averageInsight = insights.find(i => i.type === "average");
  const otherInsights = insights.filter(i => i.type !== "competitor" && i.type !== "hidden" && i.type !== "average");
  
  // Prioritize the order: competitor first, hidden expert second, average third, then others
  let prioritizedInsights = [];
  
  if (competitorInsight) {
    prioritizedInsights.push(competitorInsight);
  }
  
  if (hiddenInsight) {
    prioritizedInsights.push(hiddenInsight);
  }
  
  if (averageInsight) {
    prioritizedInsights.push(averageInsight);
  }
  
  return [...prioritizedInsights, ...otherInsights].slice(0, 3); // Return top 3 insights max
}

/**
 * Helper function to compare user score to industry average
 * @param {number} score - User's credibility score
 * @param {string} industry - Industry category
 * @returns {string} - Comparison description
 */
function getComparisonToAverage(score, industry) {
  // Simulated industry average scores
  const industryAverages = {
    "Healthcare": 68,
    "Construction": 62,
    "Environmental": 58,
    "Technology": 75,
    "Finance": 71,
    "Legal": 70,
    "Real Estate": 64,
    "default": 60
  };
  
  const avgScore = industryAverages[industry] || industryAverages.default;
  const difference = score - avgScore;
  
  if (difference >= 20) return "significantly above average";
  if (difference >= 10) return "above average";
  if (difference >= -10) return "around average";
  if (difference >= -20) return "below average";
  return "significantly below average";
}

/**
 * Helper function to generate industry-specific advice based on comparison
 * @param {number} score - User's credibility score
 * @param {string} industry - Industry category
 * @returns {string} - Industry-specific advice
 */
function getIndustryAdviceByComparison(score, industry) {
  // Simulated industry average scores
  const industryAverages = {
    "Healthcare": 68,
    "Construction": 62,
    "Environmental": 58,
    "Technology": 75,
    "Finance": 71,
    "Legal": 70,
    "Real Estate": 64,
    "default": 60
  };
  
  const avgScore = industryAverages[industry] || industryAverages.default;
  const difference = score - avgScore;
  
  if (difference >= 10) {
    return `Businesses with above-average credibility in the ${industry} industry typically see 35% higher conversion rates and 27% greater client retention.`;
  } else if (difference >= -10) {
    return `Businesses that improve from average to high credibility in the ${industry} industry typically see a 42% increase in qualified leads.`;
  } else {
    return `${industry} businesses that improve their credibility from below average to above average typically see a 78% increase in new client acquisition.`;
  }
}

/**
 * Process a list of competitors to enhance them with additional data
 * @param {Array} competitors - List of competitors to process
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty
 * @returns {Promise<Array>} - Enhanced competitor list
 */
async function processCompetitors(competitors, industry, specialty) {
  const enhancedCompetitors = [];
  
  for (const competitor of competitors) {
    try {
      const enhancedCompetitor = await enhanceCompetitorData(competitor, industry, specialty);
      enhancedCompetitors.push(enhancedCompetitor);
    } catch (error) {
      console.error(`Error processing competitor ${competitor.name}:`, error.message);
      // Still include the competitor without the additional data
      enhancedCompetitors.push(competitor);
    }
  }
  
  return enhancedCompetitors;
}

/**
 * Calculates non-overlapping positions for competitors in the quadrant chart
 * Prevents circles from overlapping with each other and with chart labels
 * @param {Array} competitors - List of competitors
 * @param {Object} chartDimensions - Chart width and height
 * @returns {Array} - Competitors with position data
 */
function calculateCompetitorPositions(competitors, chartDimensions = {width: 800, height: 600}) {
  const positionedCompetitors = [...competitors];
  const occupiedSpaces = [];
  const circleRadius = 40; // Base circle radius
  const padding = 15;      // Minimum padding between circles
  
  // Group competitors by quadrant for better distribution
  const competitorsByQuadrant = {
    "VERIFIED EXPERT": [],
    "HIDDEN EXPERT": [],
    "VISIBILITY WITHOUT SUBSTANCE": [],
    "LOW PROFILE": []
  };
  
  // Group competitors by quadrant first
  for (const competitor of positionedCompetitors) {
    if (competitor.position && competitorsByQuadrant[competitor.position]) {
      competitorsByQuadrant[competitor.position].push(competitor);
    }
  }
  
  // For each quadrant with multiple competitors, adjust spacing
  Object.keys(competitorsByQuadrant).forEach(quadrant => {
    const quadrantCompetitors = competitorsByQuadrant[quadrant];
    
    if (quadrantCompetitors.length <= 1) return;
    
    // Determine quadrant boundaries
    const isHighExpertise = quadrant === "VERIFIED EXPERT" || quadrant === "HIDDEN EXPERT";
    const isHighAuthority = quadrant === "VERIFIED EXPERT" || quadrant === "VISIBILITY WITHOUT SUBSTANCE";
    
    // Calculate center of mass for this quadrant's competitors
    const centerX = quadrantCompetitors.reduce((sum, c) => sum + (c.authorityScore || 50), 0) / quadrantCompetitors.length;
    const centerY = quadrantCompetitors.reduce((sum, c) => sum + (c.expertiseScore || 50), 0) / quadrantCompetitors.length;
    
    // Apply a dispersion pattern to create better separation
    quadrantCompetitors.forEach((competitor, index) => {
      // Skip the first competitor (keep it closer to the center of quadrant)
      if (index === 0) return;
      
      // Adjust relative to center of mass
      const angle = (index / quadrantCompetitors.length) * Math.PI;
      const distance = 5 + (index * 3);
      
      // Direction depends on quadrant
      const dirX = isHighAuthority ? 1 : -1;
      const dirY = isHighExpertise ? 1 : -1;
      
      // Apply adjustment
      if (competitor.authorityScore) competitor.authorityScore += dirX * distance * Math.cos(angle);
      if (competitor.expertiseScore) competitor.expertiseScore += dirY * distance * Math.sin(angle);
      
      // Ensure scores stay within bounds
      if (competitor.authorityScore) competitor.authorityScore = Math.max(30, Math.min(95, competitor.authorityScore));
      if (competitor.expertiseScore) competitor.expertiseScore = Math.max(30, Math.min(95, competitor.expertiseScore));
    });
  });
  
  // Calculate positions for each competitor
  for (let i = 0; i < positionedCompetitors.length; i++) {
    const competitor = positionedCompetitors[i];
    
    // Calculate initial position based on scores
    const xPercent = competitor.authorityScore / 100;
    const yPercent = competitor.expertiseScore / 100;
    
    // Adjust radius based on significance (boss competitors are larger)
    const radius = competitor.isBoss ? circleRadius * 1.2 : circleRadius;
    
    // Convert to pixel positions
    let x = Math.floor(xPercent * chartDimensions.width);
    let y = Math.floor((1 - yPercent) * chartDimensions.height); // Invert Y axis
    
    // Find a non-overlapping position
    let attempts = 0;
    const maxAttempts = 50;
    let isOverlapping = true;
    
    while (isOverlapping && attempts < maxAttempts) {
      isOverlapping = false;
      
      // Check if this position overlaps with any occupied space
      for (const space of occupiedSpaces) {
        const distance = Math.sqrt(Math.pow(x - space.x, 2) + Math.pow(y - space.y, 2));
        if (distance < (radius + space.radius + padding)) {
          isOverlapping = true;
          break;
        }
      }
      
      // Also check if it's too close to quadrant labels or borders
      const borderPadding = radius + 40; // Avoid placing too close to edges
      if (x < borderPadding || x > chartDimensions.width - borderPadding ||
          y < borderPadding || y > chartDimensions.height - borderPadding) {
        isOverlapping = true;
      }
      
      if (isOverlapping) {
        // Adjust position slightly - move in a spiral pattern
        const angle = 0.5 * attempts;
        const distance = 5 * Math.ceil(attempts / 6);
        const deltaX = Math.cos(angle) * distance;
        const deltaY = Math.sin(angle) * distance;
        
        // Keep the adjustment within the same quadrant if possible
        x = Math.max(radius, Math.min(chartDimensions.width - radius, 
            Math.floor(xPercent * chartDimensions.width) + deltaX));
        y = Math.max(radius, Math.min(chartDimensions.height - radius, 
            Math.floor((1 - yPercent) * chartDimensions.height) + deltaY));
        
        attempts++;
      }
    }
    
    // Record the position
    occupiedSpaces.push({
      x,
      y,
      radius
    });
    
    // Update competitor with position data
    positionedCompetitors[i].chartPosition = {
      x,
      y,
      radius
    };
  }
  
  return positionedCompetitors;
}

/**
 * Creates a visually improved expertise eclipse visualization
 * @param {number} expertiseScore - User's expertise score
 * @param {number} visibilityScore - User's digital visibility/authority score
 * @returns {Object} - Eclipse visualization data
 */
function generateEclipseVisualization(expertiseScore, visibilityScore) {
  // Normalize scores to ensure they're within bounds
  const expertise = Math.max(1, Math.min(100, expertiseScore));
  const visibility = Math.max(1, Math.min(100, visibilityScore));
  
  // Calculate eclipse parameters based on scores
  const eclipseData = {
    expertise: {
      size: expertise,
      radius: Math.max(50, expertise * 1.5),
      label: `EXPERTISE: ${expertise}/100`,
      color: '#3B82F6', // Blue for expertise
      opacity: 0.8,
      position: {
        x: 400,
        y: 250
      }
    },
    visibility: {
      size: visibility,
      radius: Math.max(50, visibility * 1.5),
      label: `VISIBILITY: ${visibility}/100`,
      color: '#10B981', // Green for visibility
      opacity: 0.7,
      position: {
        x: 400 + ((expertise - visibility) * 1.5),
        y: 250
      }
    },
    isEclipsed: expertise > visibility + 15,
    eclipsePercentage: expertise > visibility ? 
      Math.min(100, Math.round(((expertise - visibility) / expertise) * 100)) : 0
  };
  
  // Calculate label positions to ensure they're readable
  eclipseData.expertise.labelPosition = {
    x: eclipseData.expertise.position.x - (eclipseData.expertise.radius * 0.4),
    y: eclipseData.expertise.position.y
  };
  
  eclipseData.visibility.labelPosition = {
    x: eclipseData.visibility.position.x - (eclipseData.visibility.radius * 0.4),
    y: eclipseData.visibility.position.y + 30
  };
  
  return eclipseData;
}

/**
 * Finds and analyzes competitors for a given domain
 * @param {string} domain - User's domain
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty
 * @param {Object} userData - User's website data
 * @returns {Promise<Array>} - Enhanced competitor list
 */
async function findAndAnalyzeCompetitors(domain, industry, specialty, userData) {
  try {
    // Step 1: Try to get competitors from DataForSEO
    let competitors = [];
    let searchQuery = '';
    
    // Create more specific search parameters
    if (specialty) {
      searchQuery = `${specialty} ${industry} ${contentFetcher.extractLocationFromDomain(domain) || ''}`;
    } else {
      searchQuery = `${industry} ${contentFetcher.extractLocationFromDomain(domain) || ''}`;
    }
    console.log('Using search query for competitors:', searchQuery);
    
    try {
      competitors = await contentFetcher.fetchCompetitorsFromDataForSEO(domain, industry, 3, searchQuery, specialty);
      console.log(`Found ${competitors.length} competitors via DataForSEO`);
    } catch (error) {
      console.error('Error fetching competitors from DataForSEO:', error.message);
    }
    
    // Step 2: If we don't have enough real competitors, generate some
    if (competitors.length < 3) {
      const simulatedCount = 3 - competitors.length;
      const simulatedCompetitors = generateSimulatedCompetitors(industry, specialty, userData, simulatedCount);
      competitors.push(...simulatedCompetitors);
    }
    
    // Step 3: Enhance all competitors with additional data
    const enhancedCompetitors = await processCompetitors(competitors, industry, specialty);
    
    // Step 4: Calculate positions to avoid overlaps
    return calculateCompetitorPositions(enhancedCompetitors);
  } catch (error) {
    console.error(`Error finding and analyzing competitors:`, error.message);
    // Fallback to simulated competitors
    const simulatedCompetitors = generateSimulatedCompetitors(industry, specialty, userData, 3);
    return calculateCompetitorPositions(simulatedCompetitors);
  }
}

// Export all module functions
module.exports = {
  init,
  searchBusinessByName,
  getBusinessDetails,
  generateSimulatedCompetitors,
  enhanceCompetitorData,
  generateCompetitiveInsights,
  processCompetitors,
  calculateCompetitorPositions,
  generateEclipseVisualization,
  determineMarketPosition,
  findAndAnalyzeCompetitors,
  analyzeContentWithAI,
  applyCurve,
  getComparisonToAverage,
  getIndustryAdviceByComparison,
  calculateSeoStrength
};