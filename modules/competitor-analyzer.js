/**
 * Competitor Analysis Module
 * Handles competitor data gathering, simulation, and competitive insights
 * Enhanced version with improved competitor selection and visualization positioning
 */

const axios = require('axios');
const contentFetcher = require('./content-fetcher');
const analysisEngine = require('./analysis-engine');
const { simulationData } = require('./constants');

// API Keys
let GOOGLE_PLACES_API_KEY;
let DATAFORSEO_LOGIN;
let DATAFORSEO_PASSWORD;

/**
 * Initialize the module with API credentials
 * @param {string} googleKey - Google Places API Key
 * @param {string} dataForSeoLogin - DataForSEO Login
 * @param {string} dataForSeoPassword - DataForSEO Password
 */
function init(googleKey, dataForSeoLogin, dataForSeoPassword) {
  GOOGLE_PLACES_API_KEY = googleKey;
  DATAFORSEO_LOGIN = dataForSeoLogin;
  DATAFORSEO_PASSWORD = dataForSeoPassword;
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
 * Generates simulated competitors when real data is unavailable
 * Enhanced to consider specialty and location
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
  const userLocation = userData.location || '';
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
    
    // Generate scores that are somewhat related to the user's scores
    // We want some competitors to be better, some worse
    const userExpertise = userData.expertiseScore || 60;
    const userAuthority = userData.authorityScore || 50;
    
    // Generate scores with some variation around the user's scores
    const expertiseVariation = Math.round(Math.random() * 40) - 20; // -20 to +20
    const authorityVariation = Math.round(Math.random() * 40) - 20; // -20 to +20
    
    const expertiseScore = Math.max(30, Math.min(95, userExpertise + expertiseVariation));
    const authorityScore = Math.max(30, Math.min(95, userAuthority + authorityVariation));
    const consistencyScore = Math.max(30, Math.min(90, 50 + Math.round(Math.random() * 25)));
    
    // For some competitors, make them clearly better to establish as "the boss"
    const isTopCompetitor = i === 0; // First competitor is the "boss"
    
    // Determine position
    const position = analysisEngine.determineMarketPosition(expertiseScore, authorityScore);
    
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
      expertiseScore,
      authorityScore,
      consistencyScore,
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
      if (competitor.expertiseScore <= userExpertise && competitor.authorityScore <= userAuthority) {
        if (Math.random() > 0.5) {
          // Make expertise better
          competitor.expertiseScore = Math.min(95, userExpertise + Math.floor(Math.random() * 15) + 5);
        } else {
          // Make authority better
          competitor.authorityScore = Math.min(95, userAuthority + Math.floor(Math.random() * 15) + 5);
        }
      }
      
      // Position in Digital Authority quadrant
      competitor.position = "DIGITAL AUTHORITY";
      
      // Improve Google data for boss competitor
      competitor.googleData.rating = Math.min(5.0, 4.2 + (Math.random() * 0.8));
      competitor.googleData.userRatingsTotal = Math.floor(Math.random() * 100) + 25; // 25 to 125
    }
    
    simulatedCompetitors.push(competitor);
  }
  
  return simulatedCompetitors;
}

/**
 * Enhances a competitor with additional data from Google Places and website analysis
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
        // Search for the business
        const searchResult = await searchBusinessByName(competitor.name, competitor.location || '');
        
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
          }
        }
      } else {
        console.log('Skipping Google Places API call - API key not configured');
      }
    }
    
    // Analyze content if we have a URL but no expertise/authority scores
    if (enhancedCompetitor.url && (!enhancedCompetitor.expertiseScore || !enhancedCompetitor.authorityScore)) {
      try {
        console.log(`Analyzing competitor website: ${enhancedCompetitor.url}`);
        
        // Fetch content using the content fetcher module
        const pageContent = await contentFetcher.getWebsiteContent(enhancedCompetitor.url);
        
        if (pageContent && pageContent.length > 100) {
          // Analyze the content
          const analysis = analysisEngine.analyzeAuthorityIndex(pageContent, industry, specialty);
          
          // Add the scores to the competitor
          enhancedCompetitor.expertiseScore = analysis.expertiseSignals;
          enhancedCompetitor.authorityScore = analysis.digitalAuthority;
          enhancedCompetitor.consistencyScore = analysis.consistencyMarkers;
          enhancedCompetitor.position = analysis.position;
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
        enhancedCompetitor.consistencyScore = 45 + Math.round(Math.random() * 25);
        enhancedCompetitor.isEstimated = true;
      } else {
        // Completely randomized but plausible scores
        enhancedCompetitor.expertiseScore = 40 + Math.round(Math.random() * 40);
        enhancedCompetitor.authorityScore = 40 + Math.round(Math.random() * 40);
        enhancedCompetitor.consistencyScore = 40 + Math.round(Math.random() * 30);
        enhancedCompetitor.isEstimated = true;
      }
      
      // Set position based on generated scores
      enhancedCompetitor.position = analysisEngine.determineMarketPosition(
        enhancedCompetitor.expertiseScore, 
        enhancedCompetitor.authorityScore
      );
    }
    
    return enhancedCompetitor;
  } catch (error) {
    console.error(`Error enhancing competitor data for ${competitor.name || 'unknown competitor'}:`, error.message);
    return competitor; // Return original competitor if enhancement fails
  }
}

/**
 * Generates competitive insights based on analysis of competitors
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
      if (topCompetitor.position === "LIMITED VISIBILITY" || !topCompetitor.position) {
        // Ensure they're placed in a stronger position (Digital Authority)
        topCompetitor.position = "DIGITAL AUTHORITY";
        if (topCompetitor.authorityScore && topCompetitor.authorityScore < 60) {
          topCompetitor.authorityScore = Math.max(65, topCompetitor.authorityScore + 15);
        }
        if (topCompetitor.expertiseScore && topCompetitor.expertiseScore < 60) {
          topCompetitor.expertiseScore = Math.max(55, topCompetitor.expertiseScore + 10);
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
  
  // Generate eclipse insight if applicable
  if (userData.expertiseSignals >= 65 && 
      userData.digitalAuthority < 50 && 
      (userData.expertiseSignals - userData.digitalAuthority) >= 20) {
    
    insights.push({
      type: "eclipse",
      title: "Expertise Eclipse Detected",
      message: "Your expertise is being eclipsed by low digital visibility. Your ability significantly outshines your online presence, making it difficult for potential clients to discover your services."
    });
  }
  
  // Return top insights (but always include the competitor insight if available)
  const competitorInsight = insights.find(i => i.type === "competitor");
  const eclipseInsight = insights.find(i => i.type === "eclipse");
  const otherInsights = insights.filter(i => i.type !== "competitor" && i.type !== "eclipse");
  
  // Prioritize the order: competitor first, eclipse second, then others
  let prioritizedInsights = [];
  
  if (competitorInsight) {
    prioritizedInsights.push(competitorInsight);
  }
  
  if (eclipseInsight) {
    prioritizedInsights.push(eclipseInsight);
  }
  
  return [...prioritizedInsights, ...otherInsights].slice(0, 3); // Return top 3 insights max
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
 * @param {Array} competitors - List of competitors
 * @param {Object} chartDimensions - Chart width and height
 * @returns {Array} - Competitors with position data
 */
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
