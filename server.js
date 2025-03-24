// Import required packages
const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

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

// Australian healthcare regulatory context
const australianHealthcareRegulations = {
  // Australian healthcare regulatory bodies
  regulatoryBodies: [
    "AHPRA", "Medical Board of Australia", "RACS", "ASPS", "ASAPS", 
    "TGA", "Healthcare Complaints Commission"
  ],
  
//===================================
// INDUSTRY REGULATORY DATA
//===================================

/**
 * Industry-specific regulatory and terminology data
 * Used to adjust analysis based on industry requirements
 */
const industryRegulations = {
  // Australian healthcare regulatory context
  "Healthcare": {
    // Regulatory bodies for validation
    regulatoryBodies: [
      "AHPRA", "Medical Board of Australia", "RACS", "ASPS", "ASAPS", 
      "TGA", "Healthcare Complaints Commission"
    ],
    
    // Industry-specific credentials
    credentials: [
      "FRACS", "MBBS", "BMed", "Fellow of", "Specialist Plastic Surgeon",
      "Registered Medical Practitioner"
    ],
    
    // Terms related to compliance
    complianceTerms: [
      "AHPRA registered", "Medical Board of Australia", "code of conduct",
      "Australian Standards", "health practitioner regulation"
    ],
    
    // Review limitations by specialty
    reviewLimitations: {
      "Plastic Surgery": true,  // Has significant review limitations
      "Cosmetic Surgery": true, // Has significant review limitations
      "General Practice": false,
      "Dentistry": false
    },
    
    // Weight adjustments for industry
    scoreWeightAdjustments: {
      expertiseWeight: 0.5,     // Increased from 0.45 base
      authorityWeight: 0.3,     // Decreased from 0.35 base
      consistencyWeight: 0.2    // Unchanged
    }
  },
  
  // Finance industry regulatory context
  "Finance": {
    regulatoryBodies: [
      "ASIC", "AFSL", "Australian Financial Services License", "APRA",
      "Financial Adviser Standards and Ethics Authority", "FASEA"
    ],
    
    credentials: [
      "CFP", "Certified Financial Planner", "CA", "CPA", "RG146",
      "Financial Adviser", "Authorised Representative"
    ],
    
    complianceTerms: [
      "AFSL", "ABN", "Australian Financial Services License", "disclosure",
      "Statement of Advice", "Financial Services Guide", "compliant"
    ],
    
    reviewLimitations: {
      "Financial Planning": true,
      "Mortgage Broking": true,
      "Investment": true
    },
    
    scoreWeightAdjustments: {
      expertiseWeight: 0.45,    // Unchanged
      authorityWeight: 0.3,     // Decreased from 0.35 base
      consistencyWeight: 0.25   // Increased from 0.2 base
    }
  },
  
  // Legal services regulatory context
  "Legal": {
    regulatoryBodies: [
      "Law Society", "Legal Services Commission", "Legal Practice Board",
      "Law Institute", "Bar Association"
    ],
    
    credentials: [
      "LLB", "JD", "Solicitor", "Barrister", "Attorney", "Principal",
      "Partner", "Legal Practitioner"
    ],
    
    complianceTerms: [
      "practicing certificate", "admitted", "legal practitioner", 
      "professional standards", "ethics", "legal profession"
    ],
    
    reviewLimitations: {
      "All": true // Legal services generally have review limitations
    },
    
    scoreWeightAdjustments: {
      expertiseWeight: 0.5,    // Increased from 0.45 base
      authorityWeight: 0.25,   // Decreased from 0.35 base
      consistencyWeight: 0.25  // Increased from 0.2 base
    }
  },
  
  // Construction industry regulatory context
  "Construction": {
    regulatoryBodies: [
      "Building Commission", "Fair Trading", "Master Builders",
      "Housing Industry Association", "Building Practitioners Board"
    ],
    
    credentials: [
      "Licensed Builder", "Registered", "Certified", "Master Builder",
      "Building Practitioner"
    ],
    
    complianceTerms: [
      "licensed", "insured", "warranty", "building code", "compliance",
      "Australian Standards", "regulations"
    ],
    
    reviewLimitations: {
      "All": false // Construction generally doesn't have review limitations
    },
    
    scoreWeightAdjustments: {
      expertiseWeight: 0.4,    // Decreased from 0.45 base
      authorityWeight: 0.4,    // Increased from 0.35 base
      consistencyWeight: 0.2   // Unchanged
    }
  },

  /**
 * Industry-specific terminology collections
 * Used for expertise signal detection
 */
const industryTerminology = {
  "Healthcare": {
    generalTerms: [
      "patient", "care", "health", "treatment", "diagnosis", 
      "medical", "clinical", "healthcare", "procedure", "consultation"
    ],
    specialtyTerms: {
      "Plastic Surgery": [
        "reconstruction", "cosmetic", "aesthetic", "surgery", "procedure",
        "enhancement", "augmentation", "reduction", "lift", "reshape"
      ],
      "Cosmetic Surgery": [
        "aesthetic", "enhancement", "beauty", "cosmetic", "elective",
        "procedure", "rejuvenation", "transformation", "improvement", "appearance"
      ],
      "General Practice": [
        "primary care", "preventive", "chronic", "family medicine", "checkup",
        "vaccination", "screening", "referral", "holistic", "wellness"
      ],
      "Dentistry": [
        "dental", "teeth", "oral health", "hygiene", "cleaning",
        "filling", "crown", "implant", "whitening", "orthodontic"
      ]
    }
  },
  
  "Construction": {
    generalTerms: [
      "build", "construction", "project", "design", "renovation",
      "contractor", "building", "structure", "quality", "materials"
    ]
  },
  
  "Environmental": {
    generalTerms: [
      "sustainable", "environment", "eco-friendly", "conservation", "green",
      "renewable", "efficiency", "impact", "assessment", "management"
    ]
  },
  
  "Technology": {
    generalTerms: [
      "software", "development", "solution", "innovation", "digital",
      "technology", "system", "application", "platform", "integration"
    ]
  },
  
  "Finance": {
    generalTerms: [
      "financial", "investment", "planning", "wealth", "tax",
      "retirement", "portfolio", "strategy", "risk", "management"
    ]
  },
  
  "Legal": {
    generalTerms: [
      "legal", "law", "advice", "counsel", "representation",
      "litigation", "contract", "rights", "obligation", "compliance"
    ]
  },
  
  "Real Estate": {
    generalTerms: [
      "property", "real estate", "home", "buyer", "seller",
      "market", "agent", "listing", "sale", "investment"
    ]
  }
};
  
  // Real Estate industry regulatory context
  "Real Estate": {
    regulatoryBodies: [
      "Real Estate Institute", "Estate Agents Authority", "Consumer Affairs",
      "Fair Trading", "Property Council"
    ],
    
    credentials: [
      "Licensed Agent", "Licensed Real Estate Agent", "REIA", "Registered",
      "Auctioneer"
    ],
    
    complianceTerms: [
      "license number", "licensed", "member of", "professional standards",
      "code of conduct", "registered"
    ],
    
    reviewLimitations: {
      "All": false // Real Estate generally doesn't have review limitations
    },
    
    scoreWeightAdjustments: {
      expertiseWeight: 0.4,    // Decreased from 0.45 base
      authorityWeight: 0.4,    // Increased from 0.35 base
      consistencyWeight: 0.2   // Unchanged
    }
  },
  
  // Default weights for industries without specific configurations
  "Default": {
    scoreWeightAdjustments: {
      expertiseWeight: 0.45,
      authorityWeight: 0.35,
      consistencyWeight: 0.2
    }
  }
};
  ],
  
  // Review limitations
  reviewLimitations: {
    "Plastic Surgery": true,  // Has significant review limitations
    "Cosmetic Surgery": true, // Has significant review limitations
    "General Practice": false,
    "Dentistry": false
  }
};

// Function to fetch content from DataForSEO
async function fetchContentFromDataForSEO(url) {
  try {
    console.log(`Fetching content from DataForSEO for ${url}...`);
    
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      throw new Error('DataForSEO credentials not configured');
    }
    
    // Format the request body according to DataForSEO's specifications
    const requestData = [{
      url: url,
      enable_javascript: true
    }];
    
    // Using direct authentication in headers as recommended by DataForSEO
    const authString = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
    
    const response = await axios({
      method: 'post',
      url: 'https://api.dataforseo.com/v3/on_page/instant_pages',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      data: requestData,
      timeout: 30000 // Longer timeout for DataForSEO responses
    });
    
    console.log('DataForSEO response status:', response.status);
    
    // More detailed error checking and logging
    if (!response.data || response.data.status_code !== 20000) {
      console.error('DataForSEO API error:', response.data);
      throw new Error(`DataForSEO API returned error: ${response.data?.status_message || 'Unknown error'}`);
    }
    
    // Validate response structure and extract content
    if (response.data.tasks && 
        response.data.tasks[0] && 
        response.data.tasks[0].result && 
        response.data.tasks[0].result[0] && 
        response.data.tasks[0].result[0].items && 
        response.data.tasks[0].result[0].items.length > 0) {
      
      const content = response.data.tasks[0].result[0].items[0].page_content;
      
      if (!content || content.length < 100) {
        console.error('DataForSEO content too short or empty:', content);
        throw new Error('No substantial content retrieved from DataForSEO');
      }
      
      return content;
    } else {
      console.error('Invalid DataForSEO response structure:', JSON.stringify(response.data).substring(0, 500) + '...');
      throw new Error('Invalid response structure from DataForSEO');
    }
  } catch (error) {
    console.error('Error fetching from DataForSEO:', error.message);
    
    // Check if it's an axios error with a response
    if (error.response) {
      console.error('DataForSEO response error data:', error.response.data);
    }
    
    throw new Error(`Failed to fetch content from DataForSEO: ${error.message}`);
  }
}

// Add a function to fetch competitor data from DataForSEO
async function fetchCompetitorsFromDataForSEO(url, limit = 5) {
  try {
    console.log(`Fetching competitors from DataForSEO for ${url}...`);
    
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      throw new Error('DataForSEO credentials not configured');
    }
    
    // Format the request for the Competitors API
    const requestData = [{
      target: url,
      limit: limit
    }];
    
    const authString = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
    
    const response = await axios({
      method: 'post',
      url: 'https://api.dataforseo.com/v3/domain_analytics/relevant_pages/live',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/json'
      },
      data: requestData,
      timeout: 30000
    });
    
    console.log('DataForSEO competitors API response status:', response.status);
    
    if (!response.data || response.data.status_code !== 20000) {
      console.error('DataForSEO Competitors API error:', response.data);
      throw new Error(`DataForSEO API returned error: ${response.data?.status_message || 'Unknown error'}`);
    }
    
    // Extract competitor information
    if (response.data.tasks && 
        response.data.tasks[0] && 
        response.data.tasks[0].result && 
        response.data.tasks[0].result[0] && 
        response.data.tasks[0].result[0].items) {
      
      const competitorItems = response.data.tasks[0].result[0].items;
      
      // Transform the competitor data into our format
      const competitors = competitorItems.map(item => {
        return {
          name: item.domain,
          url: 'https://' + item.domain,
          relevanceScore: item.relevance || 0,
          seoData: {
            traffic: item.metrics?.organic?.traffic || 0,
            keywords: item.metrics?.organic?.keywords || 0,
            backlinks: item.metrics?.backlinks?.referring_domains || 0
          }
        };
      });
      
      return competitors;
    } else {
      console.error('Invalid DataForSEO Competitors response structure:', 
                  JSON.stringify(response.data).substring(0, 500) + '...');
      throw new Error('Invalid response structure from DataForSEO Competitors API');
    }
  } catch (error) {
    console.error('Error fetching competitors from DataForSEO:', error.message);
    
    if (error.response) {
      console.error('DataForSEO competitors response error data:', error.response.data);
    }
    
    throw new Error(`Failed to fetch competitors from DataForSEO: ${error.message}`);
  }
}

// Fallback function to fetch webpage content directly
async function fetchPageContent(url) {
  try {
    console.log(`Fetching content from ${url}...`);
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
      },
      timeout: 15000
    });
    
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    let textContent = '';
    if (document.body) {
      // Skip navigation, footer, and sidebar elements
      const elementsToSkip = document.querySelectorAll('nav, footer, aside, .sidebar, .navigation, .menu, .footer');
      elementsToSkip.forEach(el => el.remove());
      
      textContent = document.body.textContent || '';
      textContent = textContent.trim();
    }
    
    if (!textContent || textContent.length < 50) {
      throw new Error('Could not extract meaningful content from the page');
    }
    
    return textContent.slice(0, 15000);
  } catch (error) {
    console.error('Error fetching page content:', error.message);
    throw new Error(`Failed to fetch content from ${url}: ${error.message}`);
  }
}

/**
 * Detects compliance markers based on industry-specific regulatory terms
 * @param {string} content - The webpage content
 * @param {string} industry - The industry category
 * @returns {number} - Compliance score (0-50)
 */
function detectIndustryComplianceMarkers(content, industry) {
  const industryData = industryRegulations[industry];
  
  if (!industryData) {
    return 0;
  }
  
  let complianceScore = 0;
  
  // Check for mentions of industry-specific regulatory bodies
  if (industryData.regulatoryBodies) {
    industryData.regulatoryBodies.forEach(body => {
      const regex = new RegExp(`\\b${body}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        complianceScore += matches.length * 5;
      }
    });
  }
  
  // Check for industry-specific credentials
  if (industryData.credentials) {
    industryData.credentials.forEach(credential => {
      const regex = new RegExp(`\\b${credential}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        complianceScore += matches.length * 4;
      }
    });
  }
  
  // Check for industry-specific compliance terms
  if (industryData.complianceTerms) {
    industryData.complianceTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        complianceScore += matches.length * 3;
      }
    });
  }
  
  return Math.min(50, complianceScore); // Cap at 50 points
}
}

/**
 * Adjusts authority scores based on industry-specific regulations
 * @param {number} authorityScore - Original authority score
 * @param {string} industry - The industry category
 * @param {string} specialty - Optional specialty within the industry
 * @returns {number} - Adjusted authority score
 */
function adjustAuthorityForRegulations(authorityScore, industry, specialty) {
  // Base adjustment
  let adjustedScore = authorityScore;
  const industryData = industryRegulations[industry];
  
  if (!industryData) {
    return authorityScore;
  }
  
  // Check if this is a regulated industry with review limitations
  let hasReviewLimitations = false;
  
  if (industryData.reviewLimitations) {
    if (specialty && industryData.reviewLimitations[specialty]) {
      hasReviewLimitations = true;
    } else if (industryData.reviewLimitations["All"]) {
      hasReviewLimitations = true;
    }
  }
  
  if (hasReviewLimitations) {
    // For specialties where reviews are limited by regulation
    // We need to adjust expectations for social proof
    
    // 1. Increase the baseline score to compensate for limitations
    adjustedScore = Math.max(40, adjustedScore);
    
    // 2. Apply a scaling factor to compensate for review limitations
    const scalingFactor = 1.25; // Compensate by 25%
    adjustedScore = Math.min(100, adjustedScore * scalingFactor);
    
    console.log(`Adjusted authority score for regulated ${industry}/${specialty} from ${authorityScore} to ${adjustedScore}`);
  }
  
  return Math.round(adjustedScore);
}/**
 * Gets industry-specific weight adjustments for the Authority Index calculation
 * @param {string} industry - The industry category
 * @returns {Object} - Weight adjustment factors
 */
function getIndustryWeights(industry) {
  const industryData = industryRegulations[industry] || industryRegulations["Default"];
  
  if (industryData && industryData.scoreWeightAdjustments) {
    return industryData.scoreWeightAdjustments;
  }
  
  // Default weights if industry not found
  return {
    expertiseWeight: 0.45,
    authorityWeight: 0.35,
    consistencyWeight: 0.2
  };
}



// Function to analyze website content for Authority Index
/**
 * Analyzes website content to calculate the Authority Index score
 * @param {string} content - The webpage content
 * @param {string} industry - The industry category
 * @param {string} specialty - Optional specialty within the industry
 * @returns {Object} - Complete analysis results
 */
function analyzeAuthorityIndex(content, industry, specialty = "") {
  // Capture detailed content analysis
  const contentAnalysis = {
    // For expertise analysis
    termCount: 0,
    knowledgeDepthScore: 0,
    specializationScore: 0,
    problemSolvingScore: 0,
    credibilityScore: 0,
    
    // For authority analysis
    socialProofScore: 0,
    sentimentScore: 0,
    trustScore: 0,
    externalValidationScore: 0,
    
    // For consistency analysis
    elementCount: 0,
    toneConsistencyScore: 0,
    structuralConsistencyScore: 0,
    themeRepetitionScore: 0,
    voiceConsistencyScore: 0
  };
  
  // Calculate main scores
  let expertiseSignals = calculateExpertiseScore(content, industry, specialty, contentAnalysis);
  let digitalAuthority = calculateAuthorityScore(content, industry, specialty, contentAnalysis);
  const consistencyMarkers = calculateConsistencyScore(content, contentAnalysis);
  
  // Apply industry-specific compliance adjustments if applicable
  const industryData = industryRegulations[industry] || industryRegulations["Default"];
  let complianceScore = 0;
  
  if (industryData && industryData.regulatoryBodies) {
    complianceScore = detectIndustryComplianceMarkers(content, industry);
    // Add compliance boost to expertise
    expertiseSignals = Math.min(100, Math.round(expertiseSignals + (complianceScore * 0.2)));
    
    // Adjust authority for regulatory limitations
    if (industry === "Healthcare" || industry === "Finance" || industry === "Legal") {
      digitalAuthority = adjustAuthorityForRegulations(digitalAuthority, industry, specialty);
    }
  }
  
  // Get weights based on industry
  const weights = getIndustryWeights(industry);
  
  // Calculate overall Authority Index with industry-specific weights
  const authorityIndex = Math.round(
    (expertiseSignals * weights.expertiseWeight) + 
    (digitalAuthority * weights.authorityWeight) + 
    (consistencyMarkers * weights.consistencyWeight)
  );
  
  // Determine position in the quadrant
  const position = determineMarketPosition(expertiseSignals, digitalAuthority);
  
  // Determine if there's an Expertise Eclipse
  const hasExpertiseEclipse = 
    expertiseSignals >= 65 && 
    digitalAuthority < 50 &&
    (expertiseSignals - digitalAuthority) >= 20;
  
  // Generate recommendations
  const recommendations = generateRecommendations({
    expertiseSignals,
    digitalAuthority,
    consistencyMarkers,
    authorityIndex,
    hasExpertiseEclipse,
    position
  }, industry, specialty, contentAnalysis);
  
  // Generate diagnosis
  const diagnosis = generateDiagnosis({
    expertiseSignals,
    digitalAuthority,
    consistencyMarkers,
    position
  }, industry, specialty);
  
  // Calculate rating bands
  const ratingBands = {
    expertise: getRatingBand(expertiseSignals),
    authority: getRatingBand(digitalAuthority),
    consistency: getRatingBand(consistencyMarkers),
    overall: getRatingBand(authorityIndex)
  };
  
  return {
    expertiseSignals,
    digitalAuthority,
    consistencyMarkers,
    authorityIndex,
    hasExpertiseEclipse,
    position,
    recommendations,
    diagnosis,
    contentAnalysis,
    complianceScore,
    ratingBands
  };
}

/**
 * Determines the rating band for a score (Low, Medium, High)
 * @param {number} score - Score value (0-100)
 * @returns {string} - Rating band classification
 */
function getRatingBand(score) {
  if (score <= 40) return "Low";
  if (score <= 70) return "Medium";
  return "High";
}
// Determine market position based on scores
function determineMarketPosition(expertiseSignals, digitalAuthority) {
  // Threshold for quadrant boundaries
  const expertiseThreshold = 60;
  const authorityThreshold = 60;
  
  // Determine quadrant
  if (expertiseSignals >= expertiseThreshold && digitalAuthority >= authorityThreshold) {
    return "DIGITAL AUTHORITY";
  } else if (expertiseSignals >= expertiseThreshold && digitalAuthority < authorityThreshold) {
    return "TRADITIONAL AUTHORITY";
  } else if (expertiseSignals < expertiseThreshold && digitalAuthority >= authorityThreshold) {
    return "BORROWED AUTHORITY";
  } else {
    return "LIMITED VISIBILITY";
  }
}

// Generate diagnosis based on position
function generateDiagnosis(analysis, industry, specialty) {
  const { position, expertiseSignals, digitalAuthority } = analysis;
  
  // Base diagnosis on position
  if (position === "TRADITIONAL AUTHORITY") {
    return "Your website demonstrates strong capability, but your numbers show low online visibility. Consider investing in digital marketing and online presence to match your expertise.";
  } else if (position === "BORROWED AUTHORITY") {
    return "Your website doesn't demonstrate strong capability, but you've invested in significant digital presence. Improve your website content to maximise your investment.";
  } else if (position === "DIGITAL AUTHORITY") {
    return "You've achieved an excellent balance of demonstrated expertise and online visibility. Continue to maintain and expand both aspects to strengthen your market position.";
  } else {
    return "Your website shows opportunities for improvement in both capability demonstration and online visibility. Focus on building foundational content that demonstrates your expertise.";
  }
}

// Function to calculate expertise score
function calculateExpertiseScore(content, industry, specialty, contentAnalysis) {
  // Example implementation - replace with your actual logic
  let score = 0;
  
  // Industry-specific terms analysis
  const industryTerms = getIndustryTerms(industry, specialty);
  let termCount = 0;
  
  industryTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    termCount += matches.length;
  });
  
  contentAnalysis.termCount = termCount;
  score += Math.min(35, termCount * 1.5);
  
  // Problem-solution patterns
  const problemTerms = ['problem', 'challenge', 'issue', 'difficulty', 'concern'];
  const solutionTerms = ['solution', 'resolve', 'address', 'approach', 'method', 'strategy'];
  
  let problemMatches = 0;
  problemTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    problemMatches += matches.length;
  });
  
  let solutionMatches = 0;
  solutionTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    solutionMatches += matches.length;
  });
  
  contentAnalysis.problemSolvingScore = Math.min(25, (problemMatches + solutionMatches) * 1.2);
  score += contentAnalysis.problemSolvingScore;
  
  // Credibility markers
  const credibilityTerms = ['experience', 'qualified', 'certified', 'proven', 'trusted', 'expert'];
  let credibilityCount = 0;
  
  credibilityTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    credibilityCount += matches.length;
  });
  
  contentAnalysis.credibilityScore = Math.min(25, credibilityCount * 2);
  score += contentAnalysis.credibilityScore;
  
  // Add specialty score for healthcare
  if (industry === 'Healthcare' && specialty) {
    contentAnalysis.specializationScore = 15;
    score += contentAnalysis.specializationScore;
  }
  
  return Math.min(100, Math.round(score));
}

// Function to calculate authority score
function calculateAuthorityScore(content, industry, specialty, contentAnalysis) {
  // Example implementation - replace with your actual logic
  let score = 0;
  
  // Social proof markers
  const socialProofTerms = ['testimonial', 'review', 'client', 'customer', 'rating', 'recommend'];
  let socialProofCount = 0;
  
  socialProofTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    socialProofCount += matches.length;
  });
  
  contentAnalysis.socialProofScore = Math.min(30, socialProofCount * 2);
  score += contentAnalysis.socialProofScore;
  
  // External validation (awards, certifications, etc.)
  const validationTerms = ['award', 'certification', 'accredited', 'recognized', 'featured'];
  let validationCount = 0;
  
  validationTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    validationCount += matches.length;
  });
  
  contentAnalysis.externalValidationScore = Math.min(25, validationCount * 2.5);
  score += contentAnalysis.externalValidationScore;
  
  // Trust signals
  const trustTerms = ['guarantee', 'secure', 'privacy', 'commitment', 'promise'];
  let trustCount = 0;
  
  trustTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    trustCount += matches.length;
  });
  
  contentAnalysis.trustScore = Math.min(20, trustCount * 2);
  score += contentAnalysis.trustScore;
  
  // Sentiment analysis (simplified)
  const positiveTerms = ['best', 'excellent', 'outstanding', 'leading', 'premier', 'superior'];
  let positiveCount = 0;
  
  positiveTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    positiveCount += matches.length;
  });
  
  contentAnalysis.sentimentScore = Math.min(25, positiveCount * 1.5);
  score += contentAnalysis.sentimentScore;
  
  return Math.min(100, Math.round(score));
}

// Function to calculate consistency score
function calculateConsistencyScore(content, contentAnalysis) {
  // Example implementation - replace with your actual logic
  let score = 0;
  
  // Tone consistency - check for professional language
  const formalTerms = ['professional', 'expertise', 'service', 'quality', 'commitment'];
  let formalCount = 0;
  
  formalTerms.forEach(term => {
    const regex = new RegExp(`\\b${term}\\b`, 'gi');
    const matches = content.match(regex) || [];
    formalCount += matches.length;
  });
  
  contentAnalysis.toneConsistencyScore = Math.min(30, formalCount * 1.5);
  score += contentAnalysis.toneConsistencyScore;
  
  // Message consistency - check for repeated themes
  const paragraphs = content.split(/\r?\n/).filter(p => p.trim().length > 0);
  const uniqueParagraphCount = new Set(paragraphs).size;
  
  contentAnalysis.elementCount = paragraphs.length;
  contentAnalysis.themeRepetitionScore = Math.min(25, 
    25 * (1 - (uniqueParagraphCount / Math.max(paragraphs.length, 1)))
  );
  score += contentAnalysis.themeRepetitionScore;
  
  // Voice consistency - active vs passive
  const activeVoiceTerms = ['we provide', 'we offer', 'we ensure', 'we deliver'];
  let activeVoiceCount = 0;
  
  activeVoiceTerms.forEach(term => {
    const regex = new RegExp(term, 'gi');
    const matches = content.match(regex) || [];
    activeVoiceCount += matches.length;
  });
  
  contentAnalysis.voiceConsistencyScore = Math.min(25, activeVoiceCount * 3);
  score += contentAnalysis.voiceConsistencyScore;
  
  // Structural consistency
  contentAnalysis.structuralConsistencyScore = 20; // Default value
  score += contentAnalysis.structuralConsistencyScore;
  
  return Math.min(100, Math.round(score));
}

// Function to generate recommendations
function generateRecommendations(analysis, industry, specialty, contentAnalysis) {
  const { expertiseSignals, digitalAuthority, consistencyMarkers, position, hasExpertiseEclipse } = analysis;
  const recommendations = [];
  
  // Check if this is a regulated healthcare specialty with review limitations
  const isRegulatedHealthcare = industry === "Healthcare" && 
                               australianHealthcareRegulations.reviewLimitations[specialty];
  
  // General recommendations based on position
  if (position === "TRADITIONAL AUTHORITY") {
    if (isRegulatedHealthcare) {
      recommendations.push("Enhance your online visibility through educational content and thought leadership while maintaining AHPRA compliance.");
      recommendations.push("Invest in a strategic digital marketing plan that focuses on your expertise rather than patient outcomes or testimonials.");
    } else {
      recommendations.push("Enhance your online visibility by incorporating more client testimonials and social proof on your website.");
      recommendations.push("Invest in a strategic digital marketing plan to increase your online presence and reach.");
    }
  } else if (position === "BORROWED AUTHORITY") {
    recommendations.push("Focus on creating more in-depth content that demonstrates your expertise and problem-solving capabilities.");
    recommendations.push("Develop educational resources and industry insights to balance your digital presence with proven expertise.");
  } else if (position === "LIMITED VISIBILITY") {
    if (isRegulatedHealthcare) {
      recommendations.push("Prioritize creating foundational content that clearly communicates your capabilities and qualifications while respecting AHPRA guidelines.");
      recommendations.push("Start building your online presence through educational resources and thought leadership in your specialty.");
    } else {
      recommendations.push("Prioritize creating foundational content that clearly communicates your capabilities and expertise.");
      recommendations.push("Start building your online presence through client testimonials and engagement on relevant platforms.");
    }
  } else if (position === "DIGITAL AUTHORITY") {
    recommendations.push("Continue expanding your content with in-depth educational resources to maintain your authority position.");
  }
  
  // Expertise-specific recommendations
  if (expertiseSignals < 50) {
    recommendations.push("Include more industry-specific terminology and detailed explanations to demonstrate deeper knowledge in your field.");
  }
  
  // Authority-specific recommendations
  if (digitalAuthority < 50) {
    if (isRegulatedHealthcare) {
      // For plastic surgeons and cosmetic surgeons
      if (specialty === "Plastic Surgery" || specialty === "Cosmetic Surgery") {
        recommendations.push("In compliance with AHPRA guidelines, focus on educational content about procedures and techniques rather than patient testimonials.");
        recommendations.push("Consider creating informational resources about your specialty that demonstrate expertise without relying on patient reviews.");
      } else {
        // For other healthcare providers with some limitations
        recommendations.push("Within regulatory constraints, incorporate more educational content and thought leadership to build professional authority.");
      }
    } else {
      recommendations.push("Add more client testimonials and reviews to build social proof and credibility.");
    }
  }
  
  // Consistency-specific recommendations
  if (consistencyMarkers < 50) {
    recommendations.push("Maintain a more consistent voice and tone throughout your content to strengthen your brand identity.");
  }
  
  // Industry-specific recommendations
  if (industry === "Healthcare") {
    if (contentAnalysis.credibilityScore < 15) {
      recommendations.push("Prominently feature your credentials, qualifications, and professional affiliations to build trust with potential patients.");
    }
    
    // Special recommendations for regulated specialties
    if (specialty === "Plastic Surgery") {
      recommendations.push("Ensure compliance with AHPRA guidelines while focusing on your specialized training, techniques, and areas of expertise rather than patient outcomes.");
    } else if (specialty === "Cosmetic Surgery") {
      recommendations.push("In accordance with Australian regulations, focus on educational content about procedures and your qualifications rather than patient testimonials.");
    }
  }
  
  return recommendations.slice(0, 5); // Return top 5 recommendations
}

/**
 * Gets industry-specific terms for content analysis
 * @param {string} industry - The industry category
 * @param {string} specialty - Optional specialty within the industry
 * @returns {Array} - List of industry-specific terms
 */
function getIndustryTerms(industry, specialty = "") {
  // Get general industry terms
  const industryData = industryTerminology[industry] || {};
  let terms = industryData.generalTerms || [];
  
  // Add specialty-specific terms if applicable
  if (industry && specialty && industryData.specialtyTerms && industryData.specialtyTerms[specialty]) {
    terms = [...terms, ...industryData.specialtyTerms[specialty]];
  }
  
  // If no terms found, return empty array
  if (terms.length === 0) {
    console.warn(`No terminology data found for industry: ${industry}${specialty ? ', specialty: ' + specialty : ''}`);
  }
  
  return terms;
}
  
  // Add specialty-specific terms
  if (industry === "Healthcare" && specialty) {
    const specialtyTerms = {
      "Plastic Surgery": [
        "reconstruction", "cosmetic", "aesthetic", "surgery", "procedure",
        "enhancement", "augmentation", "reduction", "lift", "reshape"
      ],
      "Cosmetic Surgery": [
        "aesthetic", "enhancement", "beauty", "cosmetic", "elective",
        "procedure", "rejuvenation", "transformation", "improvement", "appearance"
      ],
      "General Practice": [
        "primary care", "preventive", "chronic", "family medicine", "checkup",
        "vaccination", "screening", "referral", "holistic", "wellness"
      ],
      "Dentistry": [
        "dental", "teeth", "oral health", "hygiene", "cleaning",
        "filling", "crown", "implant", "whitening", "orthodontic"
      ]
    };
    
    if (specialtyTerms[specialty]) {
      return [...terms[industry], ...specialtyTerms[specialty]];
    }
  }
  
  return terms[industry] || [];
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
        title: `${topCompetitor.name} Is The Boss`,
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
  
  // Generate industry-specific insights
  if (industry === "Healthcare") {
    insights.push({
      type: "industry",
      title: "Healthcare Authority",
      message: "In healthcare, balancing clinical expertise with digital visibility is critical for establishing trust while complying with Australian regulations."
    });
    
    // Add AHPRA insight for regulated specialties
    if (userData.specialty === "Plastic Surgery" || userData.specialty === "Cosmetic Surgery") {
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
  }
  
  // Return top insights (but always include the competitor insight if available)
  const competitorInsight = insights.find(i => i.type === "competitor");
  const otherInsights = insights.filter(i => i.type !== "competitor");
  
  return competitorInsight 
    ? [competitorInsight, ...otherInsights.slice(0, 2)] 
    : otherInsights.slice(0, 3);
}

// Function to fetch Google Places data for a business
async function searchBusinessByName(name, location) {
  try {
    if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your-google-places-api-key') {
      console.log('Google Places API key not configured');
      return null;
    }
    
    const encodedName = encodeURIComponent(name);
    const encodedLocation = encodeURIComponent(location || '');
    const locationBias = location ? `point:0,0` : ''; // Simplified location bias
    
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodedName}&inputtype=textquery&fields=place_id,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`;
    
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

// Function to get business details including reviews and ratings
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

// Function to generate simulated competitors based on industry and user data
/**
 * Generates simulated competitors when real data is unavailable
 * @param {string} industry - The industry category
 * @param {string} specialty - Optional specialty within the industry
 * @param {Object} userData - User's website data
 * @param {number} count - Number of competitors to generate
 * @returns {Array} - List of simulated competitors
 */
function generateSimulatedCompetitors(industry, specialty, userData, count) {
  const simulatedCompetitors = [];
  
  // Industry-specific business name prefixes
  const industryPrefixes = {
    "Healthcare": ["Advanced", "City", "Premier", "Elite", "Modern", "Australian", "Sydney", "Melbourne", "Brisbane", "Perth", "National", "Complete", "Total"],
    "Construction": ["Quality", "Expert", "Master", "Professional", "Advanced", "Premier", "Australian", "Western", "Eastern", "Southern", "Precision", "Custom", "Elite"],
    "Environmental": ["Green", "Eco", "Sustainable", "Natural", "Earth", "Clean", "Australian", "Climate", "Environmental", "Sydney", "Organic", "Renewable", "Pure"],
    "Technology": ["Tech", "Digital", "Innovative", "Smart", "Future", "Advanced", "Next-Gen", "Australian", "Sydney", "Melbourne", "Cloud", "Cyber", "Data"],
    "Finance": ["Secure", "Trusted", "Premier", "Capital", "Financial", "Wealth", "Australian", "Sydney", "Melbourne", "Brisbane", "Strategic", "Global", "Asset"],
    "Legal": ["Expert", "Premier", "Professional", "National", "Australian", "City", "Central", "Regional", "Metropolitan", "Capital", "Advocate", "Justice", "Rights"],
    "Real Estate": ["Premier", "Elite", "Australian", "Capital", "City", "Metropolitan", "Regional", "National", "First", "Prime", "Select", "Prestige", "Choice"]
  };
  
  // Industry-specific business name suffixes
  const industrySuffixes = {
    "Healthcare": ["Medical", "Healthcare", "Clinic", "Specialists", "Practice", "Doctors", "Health", "Wellness", "Care", "Group", "Medical Centre", "Hospital"],
    "Construction": ["Builders", "Construction", "Homes", "Building", "Projects", "Contractors", "Renovations", "Development", "Structures", "Solutions", "Properties"],
    "Environmental": ["Solutions", "Consultants", "Services", "Group", "Associates", "Advisors", "Management", "Team", "Professionals", "Experts", "Systems"],
    "Technology": ["Technologies", "Solutions", "Systems", "IT", "Computing", "Digital", "Tech", "Software", "Group", "Services", "Networks", "Cloud", "Innovations"],
    "Finance": ["Advisors", "Partners", "Planners", "Group", "Associates", "Consulting", "Management", "Services", "Solutions", "Specialists", "Investments"],
    "Legal": ["Law Firm", "Legal", "Lawyers", "Attorneys", "Law Group", "Legal Partners", "Associates", "Solicitors", "Advocates", "Legal Services", "Legal Solutions"],
    "Real Estate": ["Properties", "Real Estate", "Realty", "Homes", "Property Group", "Estate Agents", "Realtors", "Property Partners", "Land", "Residential"]
  };
  
  // Default prefixes and suffixes if industry not found
  const defaultPrefixes = ["Premier", "Advanced", "Elite", "Expert", "Professional", "Complete", "Total", "Australian"];
  const defaultSuffixes = ["Services", "Group", "Solutions", "Professionals", "Experts", "Associates", "Partners", "Australia"];
  
  // Specialty-specific terms
  const specialtyTerms = {
    "Healthcare": {
      "Plastic Surgery": ["Plastic Surgery", "Cosmetic", "Surgical", "Aesthetics", "Reconstruction", "Plastic Surgeons"],
      "Cosmetic Surgery": ["Cosmetic", "Aesthetics", "Beauty", "Enhancement", "Refinement", "Cosmetic Surgeons"],
      "General Practice": ["Family Practice", "Medical Centre", "GP", "Doctors", "Primary Care", "Family Medicine"],
      "Dentistry": ["Dental", "Dentistry", "Oral Health", "Smile", "Teeth", "Dental Care"]
    },
    "Finance": {
      "Financial Planning": ["Financial Planning", "Wealth Advisors", "Financial Advisors", "Investment", "Retirement"],
      "Mortgage Broking": ["Mortgage", "Lending", "Home Loans", "Finance Brokers", "Mortgage Solutions"],
      "Accounting": ["Accounting", "Tax", "Accountants", "CPAs", "Business Advisors", "Tax Specialists"],
      "Investment": ["Investment", "Wealth", "Portfolio", "Asset Management", "Investors"]
    },
    "Legal": {
      "Family Law": ["Family Law", "Divorce", "Custody", "Family Lawyers", "Relationship Law"],
      "Criminal Law": ["Criminal Law", "Criminal Defense", "Legal Defense", "Trial Lawyers"],
      "Commercial Law": ["Commercial", "Business Law", "Corporate", "Commercial Lawyers"],
      "Property Law": ["Property Law", "Conveyancing", "Real Estate Law", "Property Lawyers"]
    }
  };
  
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
    // Get random prefixes and suffixes for the industry
    const prefixes = industryPrefixes[industry] || defaultPrefixes;
    let suffixes = industrySuffixes[industry] || defaultSuffixes;
    
    // If it's an industry with specialties and we have a specialty, mix in some specialty terms
    let specialtyWords = [];
    if (specialty && specialtyTerms[industry] && specialtyTerms[industry][specialty]) {
      specialtyWords = specialtyTerms[industry][specialty];
      // Randomly decide whether to use specialty term as suffix or in the name
      if (Math.random() > 0.5) {
        suffixes = [...suffixes, ...specialtyWords];
      }
    }
    
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
    // Generate company name (occasionally include specialty in the middle)
    let companyName;
    if (specialtyWords.length > 0 && Math.random() < 0.3) {
      const specialtyWord = specialtyWords[Math.floor(Math.random() * specialtyWords.length)];
      companyName = `${prefix} ${specialtyWord} ${suffix}`;
    } else {
      companyName = `${prefix} ${suffix}`;
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
    
    // Determine position
    const position = determineMarketPosition(expertiseScore, authorityScore);
    
    // For some competitors, make them clearly better to establish as "the boss"
    const isTopCompetitor = i === 0; // First competitor is the "boss"
    
    // Traffic and social data (for DataForSEO simulation)
    const traffic = getEstimatedTraffic(industry, isTopCompetitor);
    const socialFollowers = isTopCompetitor ? 
                          Math.floor(Math.random() * 2000) + 1000 : 
                          Math.floor(Math.random() * 1000) + 100;
    
    // Calculate SEO strength
    const seoStrength = isTopCompetitor ? 75 + Math.random() * 25 : 40 + Math.random() * 40;
    
    // Generate URLs 
    const domain = companyName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '') + '.com.au';
    
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
app.post('/api/analyze', async (req, res) => {
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
    console.log(`Analyzing ${url} for ${industry} industry...`);
    let pageContent;
    try {
      // Try DataForSEO first, fall back to direct fetch
      try {
        if (DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD) {
          pageContent = await fetchContentFromDataForSEO(url);
        } else {
          throw new Error('DataForSEO credentials not configured');
        }
      } catch (dataForSeoError) {
        console.log(`DataForSEO fetch failed: ${dataForSeoError.message}. Falling back to direct fetch.`);
        pageContent = await fetchPageContent(url);
      }
      
      if (!pageContent || pageContent.length < 100) {
        return res.status(400).json({ error: 'Could not extract sufficient content from the URL' });
      }
    } catch (error) {
      return res.status(400).json({ error: `Could not fetch page content: ${error.message}` });
    }
    
    // Analyze the content
    const analysis = analyzeAuthorityIndex(pageContent, industry, specialty);
    
    // Try to find competitors automatically
    let competitors = [];
    let dataForSeoError = null;
    
    try {
      if (DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD) {
        // Try to fetch competitors from DataForSEO
        competitors = await fetchCompetitorsFromDataForSEO(url, 3);
        console.log(`Found ${competitors.length} competitors via DataForSEO`);
      } else {
        dataForSeoError = 'DataForSEO credentials not configured';
        console.log(dataForSeoError);
      }
    } catch (error) {
      dataForSeoError = error.message;
      console.error('Error fetching competitors from DataForSEO:', error.message);
    }
    
    // If no competitors found or error occurred, generate simulated competitors
    if (competitors.length === 0) {
      console.log('Generating simulated competitors...');
      
      // Create dummy user data for simulation based on analysis results
      const userData = {
        expertiseScore: analysis.expertiseSignals,
        authorityScore: analysis.digitalAuthority,
        url: url,
        industry: industry,
        specialty: specialty
      };
      
      // Generate simulated competitors
      competitors = generateSimulatedCompetitors(industry, specialty, userData, 3);
    }
    
    // Generate competitor insights
    const competitorInsights = generateCompetitiveInsights({
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
    return res.json({ analysis });
    
  } catch (error) {
    console.error('Error in analysis:', error);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

// API endpoint for auto-competitor analysis
app.post('/api/competitors/auto-analyze', async (req, res) => {
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
      if (DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD) {
        competitors = await fetchCompetitorsFromDataForSEO(url, 5);
        console.log(`Found ${competitors.length} competitors via DataForSEO`);
      } else {
        dataForSeoError = 'DataForSEO credentials not configured';
        console.log(dataForSeoError);
      }
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
      const simulatedCompetitors = generateSimulatedCompetitors(industry, specialty, userData, 5);
      competitors = simulatedCompetitors;
      
      // Mark these as simulated
      competitors.forEach(comp => {
        comp.isSimulated = true;
      });
    }
    
    // Enhance the competitor data with Google places information if possible
    const enhancedCompetitors = [];
    
    for (const competitor of competitors) {
      try {
        let enhancedCompetitor = { ...competitor };
        
        // If we have a name but no Google data, try to find it
        if (competitor.name && !competitor.googleData && !competitor.placeId) {
          // Skip the Google API call if API key isn't configured
          if (GOOGLE_PLACES_API_KEY && GOOGLE_PLACES_API_KEY !== 'your-google-places-api-key') {
            // Search for the business
            const searchResult = await searchBusinessByName(competitor.name, '');
            
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
            
            // Fetch content (try DataForSEO first, fall back to direct fetch)
            let pageContent;
            try {
              if (DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD) {
                pageContent = await fetchContentFromDataForSEO(enhancedCompetitor.url);
              } else {
                throw new Error('DataForSEO credentials not configured');
              }
            } catch (dataForSeoError) {
              console.log(`DataForSEO fetch failed for competitor: ${dataForSeoError.message}. Falling back to direct fetch.`);
              pageContent = await fetchPageContent(enhancedCompetitor.url);
            }
            
            if (pageContent && pageContent.length > 100) {
              // Analyze the content
              const analysis = analyzeAuthorityIndex(pageContent, industry, specialty);
              
              // Add the scores to the competitor
              enhancedCompetitor.expertiseScore = analysis.expertiseSignals;
              enhancedCompetitor.authorityScore = analysis.digitalAuthority;
              enhancedCompetitor.consistencyScore = analysis.consistencyMarkers;
              enhancedCompetitor.position = analysis.position;
              enhancedCompetitor.hasAnalysis = true;
            }
          } catch (analysisError) {
            console.error(`Error analyzing competitor website: ${analysisError.message}`);
            // If analysis fails, generate plausible scores
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
        }
        
        enhancedCompetitors.push(enhancedCompetitor);
      } catch (error) {
        console.error(`Error processing competitor ${competitor.name}:`, error.message);
        // Still include the competitor without the additional data
        enhancedCompetitors.push(competitor);
      }
    }
    
    // Create dummy user data
    const userData = {
      url,
      industry,
      specialty
    };
    
    // Generate competitive insights
    const insights = generateCompetitiveInsights(userData, enhancedCompetitors, industry);
    
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
});

// API endpoint for specific competitor analysis
app.post('/api/competitors/analyze-specific', async (req, res) => {
  try {
    const { competitors, industry, specialty, userData } = req.body;
    
    if (!competitors || !Array.isArray(competitors) || competitors.length === 0) {
      return res.status(400).json({ error: 'Valid competitors array is required' });
    }
    
    if (!industry) {
      return res.status(400).json({ error: 'Industry is required' });
    }
    
    // Process each competitor to gather Google data if available
    const enhancedCompetitors = [];
    
    for (const competitor of competitors) {
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
            
            // Fetch content (try DataForSEO first, fall back to direct fetch)
            let pageContent;
            try {
              if (DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD) {
                pageContent = await fetchContentFromDataForSEO(enhancedCompetitor.url);
              } else {
                throw new Error('DataForSEO credentials not configured');
              }
            } catch (dataForSeoError) {
              console.log(`DataForSEO fetch failed for competitor: ${dataForSeoError.message}. Falling back to direct fetch.`);
              pageContent = await fetchPageContent(enhancedCompetitor.url);
            }
            
            if (pageContent && pageContent.length > 100) {
              // Analyze the content
              const analysis = analyzeAuthorityIndex(pageContent, industry, specialty);
              
              // Add the scores to the competitor
              enhancedCompetitor.expertiseScore = analysis.expertiseSignals;
              enhancedCompetitor.authorityScore = analysis.digitalAuthority;
              enhancedCompetitor.consistencyScore = analysis.consistencyMarkers;
              enhancedCompetitor.position = analysis.position;
              enhancedCompetitor.hasAnalysis = true;
            }
          } catch (analysisError) {
            console.error(`Error analyzing competitor website: ${analysisError.message}`);
            // If analysis fails, generate plausible scores
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
        }
        
        enhancedCompetitors.push(enhancedCompetitor);
      } catch (error) {
        console.error(`Error processing competitor ${competitor.name}:`, error.message);
        // Still include the competitor without the additional data
        enhancedCompetitors.push(competitor);
      }
    }
    
    // Generate additional competitors if we have fewer than 3
    if (enhancedCompetitors.length < 3) {
      const simulatedCompetitors = generateSimulatedCompetitors(industry, specialty, userData, 3 - enhancedCompetitors.length);
      // Store simulated competitors separately
      enhancedCompetitors[0].simulatedCompetitors = simulatedCompetitors;
    }
    
    // Generate competitive insights
    const insights = generateCompetitiveInsights(userData, enhancedCompetitors, industry);
    
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
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Log API configuration status
  if (!GOOGLE_PLACES_API_KEY || GOOGLE_PLACES_API_KEY === 'your-google-places-api-key') {
    console.log('WARNING: Google Places API key is not configured - Google Places features will be disabled');
  } else {
    console.log('Google Places API key is configured');
  }
  
  if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
    console.log('WARNING: DataForSEO credentials are not configured - falling back to direct content fetching');
  } else {
    console.log('DataForSEO credentials are configured');
  }
});
