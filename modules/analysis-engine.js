/**
 * Analysis Engine Module
 * Core functionality for analyzing website content and generating the Authority Index
 */

const { industryRegulations, industryTerminology } = require('./constants');

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
    digitalAuthority = adjustAuthorityForRegulations(digitalAuthority, industry, specialty);
  }
  
  // Get industry-specific weights
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
}

/**
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

/**
 * Determine market position based on scores
 * @param {number} expertiseSignals - Expertise score
 * @param {number} digitalAuthority - Authority score
 * @returns {string} - Market position classification
 */
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

/**
 * Generate diagnosis based on position
 * @param {Object} analysis - Analysis data
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty
 * @returns {string} - Diagnosis text
 */
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

/**
 * Calculate expertise score based on content analysis
 * @param {string} content - Website content
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty
 * @param {Object} contentAnalysis - Content analysis object to populate
 * @returns {number} - Expertise score (0-100)
 */
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

/**
 * Calculate authority score based on content analysis
 * @param {string} content - Website content
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty
 * @param {Object} contentAnalysis - Content analysis object to populate
 * @returns {number} - Authority score (0-100)
 */
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

/**
 * Calculate consistency score based on content analysis
 * @param {string} content - Website content
 * @param {Object} contentAnalysis - Content analysis object to populate
 * @returns {number} - Consistency score (0-100)
 */
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

/**
 * Generate recommendations based on analysis
 * @param {Object} analysis - Analysis data
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty
 * @param {Object} contentAnalysis - Detailed content analysis
 * @returns {Array} - List of recommendations
 */
function generateRecommendations(analysis, industry, specialty, contentAnalysis) {
  const { expertiseSignals, digitalAuthority, consistencyMarkers, position, hasExpertiseEclipse } = analysis;
  const recommendations = [];
  
  // Check if this is a regulated healthcare specialty with review limitations
  const isRegulatedHealthcare = industry === "Healthcare" && 
                             industryRegulations.Healthcare && 
                             industryRegulations.Healthcare.reviewLimitations && 
                             industryRegulations.Healthcare.reviewLimitations[specialty];
  
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

module.exports = {
  analyzeAuthorityIndex,
  determineMarketPosition,
  getRatingBand,
  detectIndustryComplianceMarkers,
  adjustAuthorityForRegulations,
  getIndustryTerms,
  calculateExpertiseScore,
  calculateAuthorityScore,
  calculateConsistencyScore
};
