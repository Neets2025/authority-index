/**
 * AI Analysis Module
 * Handles integration with OpenAI for content analysis
 */

const axios = require('axios');

let OPENAI_API_KEY;

/**
 * Initialize the module with API key
 * @param {Object} config - Configuration object with API keys
 */
function init(config) {
  OPENAI_API_KEY = config.openaiApiKey;
}

/**
 * Analyze website content using OpenAI
 * @param {string} content - Website content to analyze
 * @param {string} industry - Industry category
 * @param {string} specialty - Optional industry specialty
 * @returns {Promise<Object|null>} - AI analysis results
 */
async function analyzeContent(content, industry, specialty = '') {
  const maxRetries = 3;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      if (!OPENAI_API_KEY) {
        console.log('OpenAI API key not configured');
        return null;
      }

      // Trim content to avoid excessive token usage
      const contentSample = content.substring(0, 8000).trim();

      if (contentSample.length < 100) {
        console.log('Content too short for meaningful AI analysis');
        return null;
      }

      // Pre-analyze content for existing elements to avoid redundant recommendations
      const existingElements = preAnalyzeContent(contentSample);
      console.log('Pre-analysis detected existing elements:', existingElements);

      // Check for industry-specific compliance rules
      const complianceGuidelines = getComplianceGuidelines(industry, specialty);

      const systemPrompt = `You are an expert analyst of professional websites in the ${industry} industry${specialty ? ` with specialty in ${specialty}` : ''}.
Your task is to analyze website content and identify signals of expertise, authority, and trustworthiness.
Provide a thorough, objective assessment using industry standards.

${getIndustrySpecificInstructions(industry, specialty)}

${complianceGuidelines ? `IMPORTANT COMPLIANCE INFORMATION: ${complianceGuidelines}` : ''}

EXTREMELY IMPORTANT - REDUNDANCY PREVENTION:
Based on preliminary analysis, this website ALREADY HAS the following elements:
${existingElements.hasTeamPage ? '- TEAM PAGE: The website already has a team page or about section. DO NOT recommend adding this, but you may suggest improvements to it if needed.' : ''}
${existingElements.hasTestimonials ? '- TESTIMONIALS: The website already has testimonials or reviews. DO NOT recommend adding these, but you may suggest improvements if needed.' : ''}
${existingElements.hasCredentials ? '- CREDENTIALS: The website already displays qualifications or certifications. DO NOT recommend adding these, but you may suggest improvements if needed.' : ''}
${existingElements.hasPortfolio ? '- PORTFOLIO: The website already has a portfolio or case studies section. DO NOT recommend adding this, but you may suggest improvements if needed.' : ''}

Your analysis MUST account for these existing elements, and you should NEVER recommend adding something that is already present.`;

      const userPrompt = `Analyze this website content for an ${industry} business${specialty ? ` specializing in ${specialty}` : ''}.

IMPORTANT - READ CAREFULLY: Before making any recommendations, thoroughly check if the feature already exists in the content sample. DO NOT recommend adding something that is already present in any form.

FIRST, SYSTEMATICALLY CHECK FOR THESE COMMON ELEMENTS:

1. TEAM PAGE/ABOUT: Does the website have an "About", "About Us", "Our Team", "Meet the Team", or similar section? If terms like "our team", "our people", "who we are", or multiple staff member names appear together, assume a team page exists.

2. TESTIMONIALS: Does the website include customer testimonials, reviews, or feedback? Check for quotes, review mentions, client stories, success stories, or ratings.

3. CREDENTIALS: Does the website show qualifications, certifications, licenses, experience claims, or professional memberships?

4. PORTFOLIO: Does the website include project examples, case studies, galleries, "our work" sections, or before/after images?

5. SERVICE AREA MAP: Does the website include a map, service area visualization, or description of locations served?

6. BEFORE/AFTER PHOTOS: Does the website include before/after photos, transformations, or result images?

7. CONTACT FORM: Does the website have a contact form, booking system, or appointment scheduler?

8. PRICING INFO: Does the website mention prices, rates, fees, packages, or costs?

9. SOCIAL PROOF: Does the website include social media links, third-party validation, awards, or recognition?

10. FAQ SECTION: Does the website include FAQs, common questions, or Q&A sections?

DO NOT recommend adding these elements if they already exist in some form. Instead, recommend specific ways to improve them if needed.

EXTREMELY IMPORTANT: For ANY recommendation you make, first verify that you are not suggesting adding something that already exists in the content. Focus on enhancing existing elements rather than adding new ones whenever possible.

Content sample:
${contentSample}

Evaluate the following:
1.  Expertise signals:
    * Presence and clarity of licenses and certifications.
    * Detailed staff bios and qualifications. (This may be in the about or our team page)
    * Use of evidence-based claims and citations.
    * Demonstrable experience and case studies.

2.  Authority indicators:
    * Number and quality of backlinks.
    * Industry mentions and recognition.
    * Original research or unique methodologies.
    * Thought leadership content and publications.

3.  Trust elements:
    * Clarity of privacy policy and terms of service.
    * Presence of testimonials and case studies.
    * Responsiveness to inquiries (if data is available).
    * Security measures (e.g., HTTPS, data protection).

4.  Content quality:
    * Depth, accuracy, and usefulness of information.
    * Organization and clarity of content.
    * Relevance to the target audience.

5.  Clarity:
    * How well the business explains what they do and for whom.
    * Ease of navigation and user experience.
    * Clear calls to action.

Format your response as a JSON object with these exact properties and no others:
{
  "expertiseScore": [0-100 numerical score],
  "authorityScore": [0-100 numerical score],
  "trustScore": [0-100 numerical score],
  "contentQualityScore": [0-100 numerical score],
  "communicationScore": [0-100 numerical score],
  "strengths": [array of 2-3 expertise strengths identified],
  "weaknesses": [array of 2-3 expertise gaps or weaknesses],
  "keyCredentials": [array of credentials or qualifications mentioned],
  "uniqueInsights": [array of unique perspectives or methodologies],
  "trustSignals": [array of trust elements identified],
  "contentGaps": [array of missing content elements that would improve expertise perception],
  "complianceIssues": [array of potential regulatory compliance issues, or empty array if none],
  "industrySpecificRecommendations": [
      {
          "category": "EXPERTISE VALIDATION",
          "recommendation": "Specific recommendation text - DO NOT suggest adding elements that already exist",
          "supportingData": "Data or statistic to support the recommendation",
          "source": "Source of the data (e.g., study, report, etc.)",
          "actionItems": [
              "Action item 1 - DO NOT suggest adding elements that already exist",
              "Action item 2 - DO NOT suggest adding elements that already exist",
              "Action item 3 - DO NOT suggest adding elements that already exist"
          ]
      },
      {
          "category": "AUDIENCE TRUST",
          "recommendation": "Specific recommendation text - DO NOT suggest adding elements that already exist",
          "supportingData": "Data or statistic to support the recommendation",
          "source": "Source of the data (e.g., study, report, etc.)",
          "actionItems": [
              "Action item 1 - DO NOT suggest adding elements that already exist",
              "Action item 2 - DO NOT suggest adding elements that already exist",
              "Action item 3 - DO NOT suggest adding elements that already exist"
          ]
      },
       {
          "category": "COMMUNICATION INTEGRITY",
          "recommendation": "Specific recommendation text - DO NOT suggest adding elements that already exist",
          "supportingData": "Data or statistic to support the recommendation",
          "source": "Source of the data (e.g., study, report, etc.)",
          "actionItems": [
              "Action item 1 - DO NOT suggest adding elements that already exist",
              "Action item 2 - DO NOT suggest adding elements that already exist",
              "Action item 3 - DO NOT suggest adding elements that already exist"
          ]
      },
       {
          "category": "REGULATORY COMPLIANCE",
          "recommendation": "Specific recommendation text - DO NOT suggest adding elements that already exist",
          "supportingData": "Data or statistic to support the recommendation",
          "source": "Source of the data (e.g., study, report, etc.)",
          "actionItems": [
              "Action item 1 - DO NOT suggest adding elements that already exist",
              "Action item 2 - DO NOT suggest adding elements that already exist",
              "Action item 3 - DO NOT suggest adding elements that already exist"
          ]
      }
  ]
}

Only return valid JSON that can be parsed. Do not include any explanations or text outside the JSON.`;

      console.log(`Sending ${industry}${specialty ? ` (${specialty})` : ''} content to OpenAI for analysis`);

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',  // Using GPT-4o for optimal analysis
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
          max_tokens: 1000,
          response_format: { type: "json_object" } // Ensure response is formatted as JSON
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

          // Calculate credibility score
          analysisData.credibilityScore = calculateCredibilityScore(analysisData);

          // Post-process recommendations to filter out any that still refer to adding elements that already exist
          analysisData.industrySpecificRecommendations = postProcessRecommendations(
            analysisData.industrySpecificRecommendations, 
            existingElements
          );
          
          // Verify recommendations against content
          verifyRecommendations(analysisData, contentSample, existingElements);

          // Generate recommendations
          analysisData.recommendations = generateRecommendations(analysisData, industry, specialty);

          console.log('AI analysis successful with scores:', {
            expertise: analysisData.expertiseScore,
            authority: analysisData.authorityScore,
            credibility: analysisData.credibilityScore
          });

          return analysisData;
            console.log(`OpenAI token usage: ${response.data.usage.total_tokens} tokens`);
        } catch (parseError) {
          console.error('Error parsing OpenAI response:', parseError.message);
          console.log('Raw response:', aiResponse);
          return null;
        }
      }

      console.log('No valid response from OpenAI');
      return null;

    } catch (error) {
      if (error.response && error.response.status === 429) {
        // Rate limit hit - wait and retry
        retries++;
        console.log(`OpenAI rate limit hit, retrying in ${retries * 3} seconds...`);
        await new Promise(r => setTimeout(r, retries * 3000)); // Wait longer between retries
      } else {
        console.error('Error analyzing content with OpenAI:', error.message);
        return null;
      }
    }
  }

  // If we get here, all retries failed
  console.log('All OpenAI retries failed, falling back to local analysis');
  return null;
}

/**
 * Pre-analyze content to detect existing elements
 * @param {string} content - Website content to analyze
 * @returns {Object} - Object with boolean flags for existing elements and features
 */
function preAnalyzeContent(content) {
  const contentLower = content.toLowerCase();
  
  // Check for team page
  const hasTeamPage = 
    contentLower.includes('about us') || 
    contentLower.includes('our team') || 
    contentLower.includes('meet the team') || 
    contentLower.includes('about our') ||
    contentLower.includes('our staff') ||
    contentLower.includes('our people') ||
    contentLower.includes('our builders') ||
    contentLower.includes('meet our') ||
    contentLower.includes('who we are') ||
    contentLower.includes('about the') ||
    /meet\s+([a-z]+\s+){1,3}team/i.test(contentLower) ||
    /(dr|doctor|prof|professor)\.?\s+[a-z]+/i.test(content); // Pattern for doctors/professors
  
  // Check for testimonials
  const hasTestimonials = 
    contentLower.includes('testimonial') || 
    contentLower.includes('review') || 
    contentLower.includes('what our clients say') || 
    contentLower.includes('customer feedback') ||
    contentLower.includes('client stories') ||
    contentLower.includes('success stories') ||
    contentLower.includes('client results') ||
    contentLower.includes('happy clients') ||
    contentLower.includes('satisfied customers') ||
    /[""].*[""].*said/i.test(content) || // Look for quote patterns
    /stars?[\s\-–—]{1,3}[0-9.]{1,3}\/[0-9.]{1,3}/i.test(content); // Look for star ratings
  
  // Check for credentials
  const hasCredentials = 
    contentLower.includes('certified') || 
    contentLower.includes('license') || 
    contentLower.includes('qualified') || 
    contentLower.includes('accredited') ||
    contentLower.includes('credential') ||
    contentLower.includes('certificate') ||
    contentLower.includes('qualification') ||
    contentLower.includes('member of') ||
    contentLower.includes('association') ||
    contentLower.includes('degree') ||
    contentLower.includes('graduated') ||
    contentLower.includes('education') ||
    contentLower.includes('university') ||
    contentLower.includes('board certified') ||
    contentLower.includes('years experience') ||
    contentLower.includes('years of experience') ||
    /[A-Z]{2,5},\s+[A-Z]{2,5}/.test(content) || // Look for credential patterns like "MBA, CPA"
    /[A-Z]{2,5}(?:-|\s)certified/i.test(content); // Look for "ABC-certified" pattern
  
  // Check for portfolio
  const hasPortfolio = 
    contentLower.includes('portfolio') || 
    contentLower.includes('our work') || 
    contentLower.includes('case stud') || 
    contentLower.includes('project') ||
    contentLower.includes('gallery') ||
    contentLower.includes('showcase') ||
    contentLower.includes('completed') ||
    contentLower.includes('success stories') ||
    contentLower.includes('before and after') ||
    contentLower.includes('previous work') ||
    contentLower.includes('recent work') ||
    contentLower.includes('our projects') ||
    /before\s+(?:&|and)\s+after/i.test(contentLower);
  
  // Check for specific features
  const hasMap = 
    contentLower.includes('map') ||
    contentLower.includes('service area') ||
    contentLower.includes('service location') ||
    contentLower.includes('where we serve') ||
    contentLower.includes('coverage area') ||
    contentLower.includes('we service') ||
    /locations?(?:\s+we)?(?:\s+serve)/i.test(contentLower);
  
  const hasBeforeAfterPhotos = 
    contentLower.includes('before and after') ||
    contentLower.includes('before & after') ||
    contentLower.includes('transformation') ||
    contentLower.includes('results photos') ||
    contentLower.includes('see the results') ||
    contentLower.includes('patient results') ||
    contentLower.includes('client results') ||
    contentLower.includes('project photos') ||
    contentLower.includes('photo gallery') ||
    /before\s+(?:&|and)\s+after/i.test(contentLower);
  
  const hasPricing = 
    contentLower.includes('pricing') ||
    contentLower.includes('prices') ||
    contentLower.includes('cost') ||
    contentLower.includes('fee') ||
    contentLower.includes('quote') ||
    contentLower.includes('rates') ||
    contentLower.includes('payment') ||
    contentLower.includes('invest') ||
    contentLower.includes('package') ||
    /\$\d+/.test(content) ||
    /(?:cost|price|fee)s?\s+(?:start|begin)/i.test(contentLower);
  
  const hasContactForm = 
    contentLower.includes('contact form') ||
    contentLower.includes('get in touch') ||
    contentLower.includes('contact us') ||
    contentLower.includes('send us a message') ||
    contentLower.includes('request a quote') ||
    contentLower.includes('request an appointment') ||
    contentLower.includes('book an appointment') ||
    contentLower.includes('schedule a') ||
    contentLower.includes('book a') ||
    contentLower.includes('get a quote') ||
    contentLower.includes('form') ||
    /submit|send|email|phone|call/i.test(contentLower) &&
    /form|inquiry|request/i.test(contentLower);
  
  const hasSocialProof = 
    contentLower.includes('social media') ||
    contentLower.includes('follow us') ||
    contentLower.includes('facebook') ||
    contentLower.includes('instagram') ||
    contentLower.includes('twitter') ||
    contentLower.includes('linkedin') ||
    contentLower.includes('youtube') ||
    contentLower.includes('tiktok') ||
    contentLower.includes('as seen on') ||
    contentLower.includes('featured in') ||
    contentLower.includes('awards') ||
    contentLower.includes('recognition');
  
  const hasFAQ = 
    contentLower.includes('faq') ||
    contentLower.includes('frequently asked') ||
    contentLower.includes('questions') ||
    contentLower.includes('common questions') ||
    /q(?:uestion)?:?\s+.*\s+a(?:nswer)?:/i.test(contentLower);
  
  return {
    hasTeamPage,
    hasTestimonials,
    hasCredentials,
    hasPortfolio,
    hasMap,
    hasBeforeAfterPhotos,
    hasPricing,
    hasContactForm,
    hasSocialProof,
    hasFAQ
  };
}

/**
 * Post-process recommendations to filter out any that still refer to adding elements that already exist
 * @param {Array} recommendations - Recommendations array
 * @param {Object} existingElements - Object with boolean flags for existing elements
 * @returns {Array} - Filtered recommendations
 */
function postProcessRecommendations(recommendations, existingElements) {
  if (!recommendations || !Array.isArray(recommendations)) {
    return [];
  }
  
  // Create a map of feature types to their detection flags and replacement text
  const featureMap = {
    team: {
      exists: existingElements.hasTeamPage,
      keywords: ['team page', 'about page', 'about us', 'team section', 'about section', 'staff page'],
      replacement: 'Enhance the existing team/about section'
    },
    testimonials: {
      exists: existingElements.hasTestimonials,
      keywords: ['testimonial', 'review', 'client feedback', 'customer story', 'client story'],
      replacement: 'Improve the existing testimonials'
    },
    credentials: {
      exists: existingElements.hasCredentials,
      keywords: ['credential', 'certification', 'qualification', 'license', 'accreditation'],
      replacement: 'Enhance the presentation of existing credentials'
    },
    portfolio: {
      exists: existingElements.hasPortfolio,
      keywords: ['portfolio', 'case stud', 'project', 'showcase', 'work sample', 'gallery'],
      replacement: 'Expand the existing portfolio'
    },
    map: {
      exists: existingElements.hasMap,
      keywords: ['map', 'service area', 'location', 'coverage', 'where we serve', 'areas served'],
      replacement: 'Enhance the existing service area map'
    },
    beforeAfter: {
      exists: existingElements.hasBeforeAfterPhotos,
      keywords: ['before and after', 'before/after', 'transformation', 'results photo'],
      replacement: 'Improve the existing before and after photos'
    },
    pricing: {
      exists: existingElements.hasPricing,
      keywords: ['pricing', 'price', 'cost', 'fee', 'rate', 'package'],
      replacement: 'Refine the existing pricing information'
    },
    contactForm: {
      exists: existingElements.hasContactForm,
      keywords: ['contact form', 'contact us', 'get in touch', 'book', 'appointment', 'schedule'],
      replacement: 'Enhance the existing contact functionality'
    },
    socialProof: {
      exists: existingElements.hasSocialProof,
      keywords: ['social media', 'facebook', 'instagram', 'linkedin', 'twitter', 'featured in'],
      replacement: 'Optimize the existing social proof elements'
    },
    faq: {
      exists: existingElements.hasFAQ,
      keywords: ['faq', 'frequently asked', 'question', 'q&a'],
      replacement: 'Expand the existing FAQ section'
    }
  };
  
  // Filter and modify recommendations
  const modifiedRecs = recommendations.map(rec => {
    // Create a deep copy of the recommendation
    const newRec = JSON.parse(JSON.stringify(rec));
    
    // Get the lowercase recommendation text for matching
    const recLower = rec.recommendation.toLowerCase();
    
    // Check each feature type against the recommendation
    Object.entries(featureMap).forEach(([featureType, featureInfo]) => {
      if (featureInfo.exists) {
        // Check if recommendation contains addition keywords for this feature
        const hasAdditionKeywords = 
          recLower.includes('add ') || 
          recLower.includes('create ') || 
          recLower.includes('include ') || 
          recLower.includes('implement ') || 
          recLower.includes('develop ') ||
          recLower.includes('introduce ') ||
          recLower.includes('build ') ||
          recLower.includes('incorporate ') ||
          recLower.includes('establish ') ||
          recLower.includes('set up ');
        
        // Check if any feature keywords are in the recommendation
        const matchesFeature = featureInfo.keywords.some(keyword => 
          recLower.includes(keyword)
        );
        
        // If the recommendation suggests adding this feature that already exists
        if (hasAdditionKeywords && matchesFeature) {
          // Replace with improvement suggestion
          newRec.recommendation = newRec.recommendation.replace(
            /(?:add|create|include|implement|develop|introduce|build|incorporate|establish|set up)(?:\s+a|\s+an)?(\s+new)?/i,
            'Optimize'
          );
          
          // If the replacement didn't actually change anything (rare edge case), use backup method
          if (newRec.recommendation === rec.recommendation) {
            newRec.recommendation = featureInfo.replacement + ': ' + 
              newRec.recommendation.replace(/^(?:add|create|include|implement|develop|introduce|build|incorporate|establish|set up)(?:\s+a|\s+an)?(\s+new)?\s+[^:]+(?::)?/i, '');
          }
        }
      }
    });
    
    // Process action items
    if (newRec.actionItems && Array.isArray(newRec.actionItems)) {
      newRec.actionItems = newRec.actionItems.map(item => {
        const itemLower = item.toLowerCase();
        
        // Check each feature type against the action item
        let modifiedItem = item;
        Object.entries(featureMap).forEach(([featureType, featureInfo]) => {
          if (featureInfo.exists) {
            // Check if action item contains addition keywords for this feature
            const hasAdditionKeywords = 
              itemLower.includes('add ') || 
              itemLower.includes('create ') || 
              itemLower.includes('include ') || 
              itemLower.includes('implement ') ||
              itemLower.includes('develop ') ||
              itemLower.includes('introduce ') ||
              itemLower.includes('build ') ||
              itemLower.includes('incorporate ') ||
              itemLower.includes('establish ') ||
              itemLower.includes('set up ');
            
            // Check if any feature keywords are in the action item
            const matchesFeature = featureInfo.keywords.some(keyword => 
              itemLower.includes(keyword)
            );
            
            // If the action item suggests adding this feature that already exists
            if (hasAdditionKeywords && matchesFeature) {
              // Replace with improvement suggestion
              modifiedItem = modifiedItem.replace(
                /(?:add|create|include|implement|develop|introduce|build|incorporate|establish|set up)(?:\s+a|\s+an)?(\s+new)?/i,
                'Enhance existing'
              );
            }
          }
        });
        
        return modifiedItem;
      });
    }
    
    return newRec;
  });
  
  // Additional filtering to remove redundant recommendations
  // Group recommendations by category to identify and remove duplicates
  const categorized = {};
  modifiedRecs.forEach(rec => {
    const category = rec.category;
    if (!categorized[category]) {
      categorized[category] = [];
    }
    categorized[category].push(rec);
  });
  
  // For each category, identify and merge similar recommendations
  const finalRecs = [];
  Object.entries(categorized).forEach(([category, recs]) => {
    if (recs.length <= 1) {
      // Just one recommendation in this category, add it as is
      finalRecs.push(...recs);
    } else {
      // Multiple recommendations in this category, check for similarity
      const processedRecs = [];
      const skippedIndices = new Set();
      
      for (let i = 0; i < recs.length; i++) {
        if (skippedIndices.has(i)) continue;
        
        const rec1 = recs[i];
        let merged = { ...rec1 };
        let hasMerged = false;
        
        for (let j = i + 1; j < recs.length; j++) {
          if (skippedIndices.has(j)) continue;
          
          const rec2 = recs[j];
          const similarity = calculateSimilarity(
            rec1.recommendation.toLowerCase(), 
            rec2.recommendation.toLowerCase()
          );
          
          if (similarity > 0.5) {  // Threshold for considering recommendations similar
            // Merge action items from both recommendations
            merged.actionItems = [...new Set([
              ...(merged.actionItems || []),
              ...(rec2.actionItems || [])
            ])];
            
            // Mark as merged and skip the second recommendation
            hasMerged = true;
            skippedIndices.add(j);
          }
        }
        
        processedRecs.push(merged);
      }
      
      finalRecs.push(...processedRecs);
    }
  });
  
  return finalRecs;
}

/**
 * Calculate overall credibility score from component scores with adaptive weighting
 * @param {Object} analysis - Analysis data with component scores
 * @param {string} industry - Optional industry for industry-specific weighting
 * @returns {number} - Overall credibility score
 */
function calculateCredibilityScore(analysis, industry = '') {
  // Industry-specific weightings
  const industryWeights = {
    "Healthcare": { expertise: 0.45, authority: 0.25, communication: 0.30 }, // Higher emphasis on expertise
    "Finance": { expertise: 0.40, authority: 0.35, communication: 0.25 },    // Higher authority emphasis
    "Legal": { expertise: 0.45, authority: 0.30, communication: 0.25 },      // Expertise is key
    "Construction": { expertise: 0.35, authority: 0.30, communication: 0.35 }, // More balanced
    "Real Estate": { expertise: 0.30, authority: 0.35, communication: 0.35 }, // Communication matters more
    "Technology": { expertise: 0.35, authority: 0.40, communication: 0.25 },  // Authority is key
    "default": { expertise: 0.40, authority: 0.30, communication: 0.30 }      // Balanced default
  };
  
  // Get appropriate weights based on industry
  const weights = industryWeights[industry] || industryWeights.default;
  
  // Apply adaptive weighting based on score distribution
  // If one score is significantly higher, give it slightly more weight
  let adjustedWeights = { ...weights };
  
  const expertiseScore = analysis.expertiseScore || 0;
  const authorityScore = analysis.authorityScore || 0;
  const communicationScore = analysis.communicationScore || 0;
  
  // Check for significant differences between scores
  if (expertiseScore > authorityScore + 20 && expertiseScore > communicationScore + 20) {
    // Expertise is significantly higher - adjust weights to emphasize strength
    adjustedWeights.expertise += 0.05;
    adjustedWeights.authority -= 0.025;
    adjustedWeights.communication -= 0.025;
  } else if (authorityScore > expertiseScore + 20 && authorityScore > communicationScore + 20) {
    // Authority is significantly higher
    adjustedWeights.authority += 0.05;
    adjustedWeights.expertise -= 0.025;
    adjustedWeights.communication -= 0.025;
  } else if (communicationScore > expertiseScore + 20 && communicationScore > authorityScore + 20) {
    // Communication is significantly higher
    adjustedWeights.communication += 0.05;
    adjustedWeights.expertise -= 0.025;
    adjustedWeights.authority -= 0.025;
  }
  
  // Calculate weighted score with adjusted weights
  const score = (
    (adjustedWeights.expertise * expertiseScore) +
    (adjustedWeights.authority * authorityScore) +
    (adjustedWeights.communication * communicationScore)
  );
  
  // Set floor and ceiling
  const finalScore = Math.max(30, Math.min(95, Math.round(score)));
  
  return finalScore;
}

/**
 * Calculate similarity between two strings (simplified Jaccard similarity)
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
  // Tokenize strings into words
  const words1 = str1.split(/\s+/).filter(w => w.length > 3);  // Filter out short words
  const words2 = str2.split(/\s+/).filter(w => w.length > 3);
  
  // Create sets
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Calculate intersection
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  // Calculate union
  const union = new Set([...set1, ...set2]);
  
  // Return Jaccard similarity
  return intersection.size / union.size;
}

/**
 * Generate recommendations based on analysis
 * @param {Object} analysis - Analysis data
 * @param {string} industry - Industry category
 * @param {string} specialty - Industry specialty
 * @returns {Array} - Recommendations
 */
function generateRecommendations(analysis, industry, specialty) {
  if (!analysis || !analysis.industrySpecificRecommendations) {
    return []; // Return an empty array if there are no recommendations
  }

  return analysis.industrySpecificRecommendations.map(rec => ({
    category: rec.category,
    recommendation: rec.recommendation,
    supportingData: rec.supportingData,
    source: rec.source,
    actionItems: rec.actionItems,
    // You might want to include the 'impact' if it's still relevant or derive it
  }));
}

/**
 * Verify recommendations against actual content to further reduce inaccuracies
 * @param {Object} analysisData - Complete analysis data 
 * @param {string} content - Original content sample
 * @param {Object} existingElements - Pre-analyzed elements
 */
function verifyRecommendations(analysisData, content, existingElements) {
  if (!analysisData || !analysisData.industrySpecificRecommendations) {
    return;
  }
  
  const contentLower = content.toLowerCase();
  
  // Define specific features to check for beyond our initial detection
  const specificFeatures = [
    // Service area maps
    {
      name: 'service area map',
      patterns: [
        /service\s+area\s+map/i,
        /coverage\s+area/i,
        /areas?\s+(?:we|they)\s+serve/i,
        /locations?\s+served/i
      ]
    },
    // Before and after photos
    {
      name: 'before and after photos',
      patterns: [
        /before\s+(?:&|and)\s+after/i,
        /transformation/i,
        /results?\s+photos?/i,
        /patient\s+gallery/i
      ]
    },
    // Visual elements (more generic)
    {
      name: 'visual elements',
      patterns: [
        /image/i,
        /photo/i,
        /picture/i,
        /gallery/i,
        /illustration/i,
        /diagram/i
      ]
    },
    // Videos
    {
      name: 'video',
      patterns: [
        /video/i,
        /youtube/i,
        /watch/i,
        /play/i
      ]
    }
  ];
  
  // Filter out or modify recommendations that suggest adding features that are likely present
  analysisData.industrySpecificRecommendations = analysisData.industrySpecificRecommendations.filter(rec => {
    const recLower = rec.recommendation.toLowerCase();
    
    // For each specific feature, check if it's recommended to add but actually exists
    for (const feature of specificFeatures) {
      const recommendsAddingFeature = 
        (recLower.includes('add') || 
         recLower.includes('create') || 
         recLower.includes('implement') || 
         recLower.includes('include')) && 
        recLower.includes(feature.name);
      
      if (recommendsAddingFeature) {
        // Check if feature likely exists using patterns
        const featureExists = feature.patterns.some(pattern => pattern.test(contentLower));
        
        if (featureExists) {
          // If this is a major recommendation that's invalid, we might want to drop it entirely
          console.log(`Dropping invalid recommendation: "${rec.recommendation}" - Feature "${feature.name}" already exists`);
          return false;
        }
      }
    }
    
    // Additional check for repeating client testimonials
    if (existingElements.hasTestimonials && 
        (recLower.includes('add client testimonial') || recLower.includes('include testimonial'))) {
      // Look for specific indicators of testimonials
      const hasQuotes = /[""].*[""]/.test(content);
      const hasTestimonialWords = contentLower.includes('said') || 
                                 contentLower.includes('testimonial') || 
                                 contentLower.includes('review');
      
      if (hasQuotes && hasTestimonialWords) {
        console.log(`Dropping invalid recommendation: "${rec.recommendation}" - Testimonials already exist`);
        return false;
      }
    }
    
    // Detailed check for before/after photos
    if (recLower.includes('before and after') || recLower.includes('before/after')) {
      const hasBeforeAfterIndicators = 
        contentLower.includes('before and after') || 
        contentLower.includes('before & after') ||
        contentLower.includes('transformation') ||
        /before\s*\/\s*after/i.test(contentLower);
      
      if (hasBeforeAfterIndicators) {
        // Modify rather than remove
        rec.recommendation = rec.recommendation.replace(
          /add|create|include|implement/i,
          'Enhance existing'
        );
        
        if (rec.actionItems) {
          rec.actionItems = rec.actionItems.map(item => 
            item.toLowerCase().includes('before and after') || item.toLowerCase().includes('before/after')
              ? item.replace(/add|create|include|implement/i, 'Improve existing')
              : item
          );
        }
      }
    }
    
    return true;
  });
  
  // Check for repetitive or overlapping recommendations
  const recSet = new Set();
  analysisData.industrySpecificRecommendations = analysisData.industrySpecificRecommendations.filter(rec => {
    // Create a simplified signature of the recommendation
    const simplifiedRec = rec.recommendation
      .toLowerCase()
      .replace(/\b(add|create|include|implement|enhance|improve)\b/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    // If we've seen a very similar recommendation, filter it out
    if (recSet.has(simplifiedRec)) {
      return false;
    }
    
    recSet.add(simplifiedRec);
    return true;
  });
}

module.exports = {
  init,
  analyzeContent,
  generateRecommendations,
  calculateCredibilityScore,
  preAnalyzeContent,  // Exported for testing
  postProcessRecommendations,  // Exported for testing
  verifyRecommendations  // Exported for testing
};