/**
 * Content Fetcher Module
 * Handles website content extraction and competitor identification
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { parse } = require('url');

// Set up axios instance with proper headers
const fetchClient = axios.create({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  },
  timeout: 15000, // 15 second timeout
  maxRedirects: 5
});

// DataForSEO API credentials
let DATAFORSEO_LOGIN;
let DATAFORSEO_PASSWORD;

/**
 * Initialize the module with API credentials
 * @param {Object} config - Configuration object with API keys
 */
function init(config) {
  DATAFORSEO_LOGIN = config.dataForSeoLogin;
  DATAFORSEO_PASSWORD = config.dataForSeoPassword;
}

/**
 * Fetches website content with retry logic
 * @param {string} url - Website URL to analyze
 * @returns {Promise<string>} - Extracted text content
 */
async function getWebsiteContent(url) {
  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Ensure URL has a protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      
      console.log(`Fetching content from: ${url} (Attempt ${retries + 1}/${maxRetries})`);
      
      const response = await fetchClient.get(url);
      const html = response.data;
      
      // Log the actual domain being analyzed
      const domain = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
      console.log(`Successfully fetched content from domain: ${domain}`);
      
      // Use Cheerio to parse the HTML
      const $ = cheerio.load(html);
      
      // Remove script, style, and SVG elements
      $('script, style, svg, iframe, noscript, img, video, audio, canvas').remove();
      
      // Get page title
      const title = $('title').text().trim();
      
      // Get meta description
      let metaDescription = '';
      $('meta[name="description"]').each((i, element) => {
        metaDescription = $(element).attr('content') || '';
      });
      
      // Extract location information
      let locationInfo = extractLocationInformation($, html);
      
      // Extract main content
      let mainContent = '';
      
      // Try common content selectors
      const contentSelectors = [
        'main', 'article', '.content', '.main-content', '.post-content',
        '#content', '#main', '.article', 'section', '.page-content'
      ];
      
      for (const selector of contentSelectors) {
        if ($(selector).length) {
          mainContent += $(selector).text() + ' ';
        }
      }
      
      // If no content was found with selectors, extract from body
      if (!mainContent.trim()) {
        // Extract text from p, h1-h6, li, td elements
        $('p, h1, h2, h3, h4, h5, h6, li, td, div > br').each((i, element) => {
          const text = $(element).text().trim();
          if (text) {
            mainContent += text + ' ';
          }
        });
      }
      
      // Combine all the content
      let combinedContent = '';
      
      if (title) {
        combinedContent += `TITLE: ${title}\n\n`;
      }
      
      if (metaDescription) {
        combinedContent += `DESCRIPTION: ${metaDescription}\n\n`;
      }
      
      if (locationInfo) {
        combinedContent += `LOCATION: ${locationInfo}\n\n`;
      }
      
      combinedContent += `CONTENT:\n${mainContent.trim()}`;
      
      // Clean up the text
      let cleanedContent = combinedContent
        .replace(/\s+/g, ' ')       // Replace multiple spaces with a single space
        .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines
        .trim();
      
      return cleanedContent;
    } catch (error) {
      retries++;
      if (error.response && error.response.status === 429) {
        // Rate limiting - wait and retry
        const waitTime = retries * 2000; // Exponential backoff
        console.log(`Rate limit hit (429), waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (retries < maxRetries) {
        // Other error, but we still have retries left
        console.log(`Error fetching content (${error.message}), retry ${retries}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        // Out of retries, throw the error
        console.error(`Error fetching website content from ${url}:`, error.message);
        throw error;
      }
    }
  }
} // This closing bracket was missing!

/**
 * Extract location information from website content
 * @param {Object} $ - Cheerio object
 * @param {string} html - Raw HTML
 * @returns {string} - Location information
 */
function extractLocationInformation($, html) {
  let location = '';
  
  // Check common address containers
  const addressSelectors = [
    '.address', '.location', '.contact-address', '.footer-address',
    '[itemtype*="PostalAddress"]', '.contact-info address', 'footer address'
  ];
  
  for (const selector of addressSelectors) {
    if ($(selector).length) {
      const addressText = $(selector).text().trim();
      if (addressText && addressText.length > 5) {
        location = addressText;
        break;
      }
    }
  }
  
  // Look for Australian state abbreviations in text
  if (!location) {
    const stateRegex = /\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b/g;
    const matches = html.match(stateRegex);
    if (matches && matches.length > 0) {
      // Look for content around this state
      const index = html.indexOf(matches[0]);
      if (index !== -1) {
        const contextStart = Math.max(0, index - 50);
        const contextEnd = Math.min(html.length, index + 50);
        const context = html.substring(contextStart, contextEnd);
        
        // Clean up the context
        location = context.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }
  }
  
  // Look for Australian postal codes
  if (!location) {
    const postcodeRegex = /\b[0-9]{4}\b/g;
    const matches = html.match(postcodeRegex);
    if (matches && matches.length > 0) {
      // Look for Australian postcodes in promising contexts
      for (const postcode of matches) {
        const index = html.indexOf(postcode);
        if (index !== -1) {
          const contextStart = Math.max(0, index - 50);
          const contextEnd = Math.min(html.length, index + 50);
          const context = html.substring(contextStart, contextEnd);
          
          // Check if this looks like an address
          if (context.match(/street|road|ave|avenue|st\b|rd\b|lane|dr\b|drive|court|place/i)) {
            location = context.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            break;
          }
        }
      }
    }
  }
  
  // Extract from domain name if no other location found
  if (!location) {
    // Common Australian city names
    const cities = ['sydney', 'melbourne', 'brisbane', 'perth', 'adelaide', 'gold-coast', 'canberra', 
                   'newcastle', 'wollongong', 'hobart', 'geelong', 'townsville', 'cairns', 'darwin'];
    
    // Check domain for city names
    const domain = $('.title a').attr('href') || $('meta[property="og:url"]').attr('content') || '';
    
    for (const city of cities) {
      if (domain.toLowerCase().includes(city)) {
        location = city.charAt(0).toUpperCase() + city.slice(1).replace('-', ' ');
        break;
      }
    }
  }
  
  return location;
}

/**
 * Fetches competitors using DataForSEO API
 * @param {string} domain - Domain to find competitors for
 * @param {string} industry - Industry category for fallback
 * @param {number} limit - Maximum number of competitors to return
 * @param {string} searchQuery - Optional specialized search query
 * @param {string} specialty - Optional industry specialty
 * @returns {Promise<Array>} - List of competitors
 */
async function fetchCompetitorsFromDataForSEO(domain, industry, limit = 5, searchQuery = '', specialty = '') {
  try {
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      console.log('DataForSEO credentials not configured, using fallback');
      return [];
    }
    
    const auth = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
    
    console.log(`Fetching competitors for domain: ${domain} using DataForSEO Labs`);
    
    // Create payload using the correct structure
    const payload = [{
      "target": domain,
      "location_code": 2036, // Australia 
      "language_code": "en",
      "exclude_top_domains": true,
      "ignore_synonyms": false,
      "include_clickstream_data": false,
      "item_types": ["organic"],
      "limit": limit * 3 // Request more to filter down later
    }];
    
    const response = await axios({
      method: 'POST',
      url: 'https://api.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(payload)
    });
    
    if (response.data && response.data.tasks && response.data.tasks.length > 0) {
      const results = response.data.tasks[0].result;
      
      if (!results || results.length === 0) {
        console.log('No competitors found via DataForSEO');
        return [];
      }
      
      // Extract competitors
      const competitors = [];
      
      // Industry-specific keywords to match true competitors
      const industryKeywords = {
        'Healthcare': ['doctor', 'clinic', 'hospital', 'medical', 'health', 'practice', 'surgery'],
        'Plastic Surgery': ['surgeon', 'plastic', 'cosmetic', 'aesthetic', 'reconstruction', 'procedure'],
        'Construction': ['builder', 'construction', 'renovation', 'home', 'building', 'contractor', 'remodel'],
        'Environmental': ['environmental', 'sustainable', 'green', 'eco', 'renewable', 'conservation'],
        'Finance': ['financial', 'finance', 'accounting', 'wealth', 'invest', 'advisor', 'planning'],
        'Legal': ['lawyer', 'attorney', 'legal', 'law', 'solicitor', 'advocate', 'firm'],
        'Real Estate': ['realestate', 'property', 'house', 'land', 'agent', 'broker', 'home']
      };
      
      // Get relevant keywords for this industry and specialty
      let relevantKeywords = industryKeywords[industry] || [];
      if (specialty && industryKeywords[specialty]) {
        relevantKeywords = [...relevantKeywords, ...industryKeywords[specialty]];
      }
      
      // Add any terms from the search query
      if (searchQuery) {
        const queryTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 3);
        relevantKeywords = [...relevantKeywords, ...queryTerms];
      }
      
      console.log(`Using industry keywords for filtering: ${relevantKeywords.join(', ')}`);
      
      if (results[0] && results[0].items) {
        for (const comp of results[0].items) {
          // Skip if it's the same domain
          if (comp.domain === domain) continue;
          
          // Skip common non-competitor sites
          if (comp.domain.includes('google.com') || 
              comp.domain.includes('facebook.com') ||
              comp.domain.includes('youtube.com') ||
              comp.domain.includes('instagram.com') ||
              comp.domain.includes('wikipedia.org') ||
              comp.domain.includes('amazon.com')) {
            continue;
          }
          
          // Check if the domain contains any industry-specific keywords
          const domainName = comp.domain.toLowerCase();
          let relevanceScore = 50; // Base score
          let isRelevant = false;
          
          // Add relevance if domain contains industry keywords
          for (const keyword of relevantKeywords) {
            if (domainName.includes(keyword.toLowerCase())) {
              relevanceScore += 15;
              isRelevant = true;
              break;
            }
          }
          
          // For some industries, require stricter matching
          if ((industry === 'Plastic Surgery' || specialty === 'Plastic Surgery') && 
              !domainName.includes('surg') && !domainName.includes('plast') && 
              !domainName.includes('cosmet') && !domainName.includes('doctor')) {
            isRelevant = false;
          }
          
          // For builders/construction, require stricter matching
          if ((industry === 'Construction' || industry.includes('Build')) && 
              !domainName.includes('build') && !domainName.includes('construct') && 
              !domainName.includes('home') && !domainName.includes('renovat')) {
            isRelevant = false;
          }
          
          // Skip large platforms unless they're the only results
          const isGenericPlatform = domainName.includes('realestate.com.au') || 
                                    domainName.includes('domain.com.au') ||
                                    domainName.includes('houzz.com') ||
                                    domainName.includes('yelp.com');
                                    
          if (isGenericPlatform && competitors.length < 1) {
            // Only include if we have no other competitors
            relevanceScore = 30; // Lower score for generic platforms
          } else if (isGenericPlatform) {
            continue; // Skip generic platforms if we have other competitors
          }
          
          // Include if relevant or if we don't have enough competitors yet
          if (isRelevant || competitors.length < 2) {
            // Create competitor object
            const competitor = {
              name: formatDomainName(comp.domain),
              url: `https://${comp.domain}`,
              domain: comp.domain,
              seoData: {
                traffic: comp.metrics?.organic?.count || 0,
                keywords: comp.metrics?.organic?.count || 0,
                backlinks: comp.metrics?.backlinks_count || 0,
                seoStrength: comp.metrics?.organic?.intersections || comp.intersections || 50
              },
              relevanceScore: relevanceScore
            };
            
            competitors.push(competitor);
          }
          
          // Stop once we have enough
          if (competitors.length >= limit) {
            break;
          }
        }
      }
      
      // Sort by relevance score
      competitors.sort((a, b) => (b.seoData.seoStrength || 0) - (a.seoData.seoStrength || 0));
      
      console.log(`Found ${competitors.length} relevant competitors for ${domain}`);
      return competitors.slice(0, limit);
    }
    
    console.log('No competitor data returned from DataForSEO');
    return [];
  } catch (error) {
    console.error(`Error fetching competitors for ${domain}:`);
    console.error(`- Message: ${error.message}`);
    if (error.response) {
      console.error(`- Status: ${error.response.status}`);
      console.error(`- Response data:`, JSON.stringify(error.response.data));
    }
    return [];
  }
}

/**
 * Check if domain appears relevant to the given industry
 * @param {string} domain - Domain name
 * @param {string} industry - Industry category
 * @param {string} searchQuery - Search query used
 * @returns {boolean} - Whether domain appears relevant
 */
function isDomainRelevantToIndustry(domain, industry, searchQuery) {
  const domainLower = domain.toLowerCase();
  
  // Skip common irrelevant domains
  const irrelevantDomains = [
    'facebook.com', 'instagram.com', 'youtube.com', 'linkedin.com', 
    'twitter.com', 'pinterest.com', 'tiktok.com', 'google.com',
    'wikipedia.org', 'amazon.com', 'ebay.com', 'yelp.com', 
    'yellowpages.com', 'whitepages.com'
  ];
  
  for (const irrelevant of irrelevantDomains) {
    if (domainLower.includes(irrelevant)) return false;
  }
  
  // Check for industry-relevant terms in domain
  const industryTerms = {
    'Healthcare': ['health', 'medical', 'doctor', 'clinic', 'hospital', 'care', 'therapy', 'wellness'],
    'Construction': ['build', 'construct', 'renovation', 'home', 'house', 'property', 'contractor'],
    'Finance': ['financ', 'invest', 'wealth', 'money', 'capital', 'fund', 'asset', 'advisor'],
    'Legal': ['law', 'legal', 'attorney', 'solicitor', 'advocate', 'barrister', 'justice'],
    'Real Estate': ['real', 'estate', 'property', 'realty', 'home', 'house', 'land', 'apartment']
  };
  
  // Specialty-specific terms
  const specialtyTerms = {
    'Plastic Surgery': ['plastic', 'cosmetic', 'aesthetic', 'surgery', 'surgeon', 'beauty'],
    'Dental': ['dental', 'dentist', 'tooth', 'teeth', 'orthodont', 'smile'],
    'Residential': ['home', 'house', 'residential', 'living'],
    'Commercial': ['commercial', 'office', 'business', 'corporate']
  };
  
  // Extract specialty from search query if available
  let specialty = '';
  if (searchQuery) {
    const queryParts = searchQuery.toLowerCase().split(' ');
    for (const [key, terms] of Object.entries(specialtyTerms)) {
      if (queryParts.some(part => key.toLowerCase().includes(part))) {
        specialty = key;
        break;
      }
    }
  }
  
  // Check domain against industry terms
  if (industryTerms[industry]) {
    for (const term of industryTerms[industry]) {
      if (domainLower.includes(term)) return true;
    }
  }
  
  // Check domain against specialty terms if applicable
  if (specialty && specialtyTerms[specialty]) {
    for (const term of specialtyTerms[specialty]) {
      if (domainLower.includes(term)) return true;
    }
  }
  
  // If we have search terms, check if any part of the domain matches
  if (searchQuery) {
    const queryParts = searchQuery.toLowerCase().split(' ');
    for (const part of queryParts) {
      if (part.length > 3 && domainLower.includes(part)) {
        return true;
      }
    }
  }
  
  // Default to including if we can't determine relevance
  return true;
}

/**
 * Calculate domain relevance score to industry and specialty
 * @param {string} domain - Domain name
 * @param {string} industry - Industry category
 * @param {string} searchQuery - Search query with specialty info
 * @returns {number} - Relevance score (0-100)
 */
function calculateDomainRelevance(domain, industry, searchQuery) {
  const domainLower = domain.toLowerCase();
  let score = 50; // Base score
  
  // Industry term bonus
  const industryTerms = {
    'Healthcare': ['health', 'medical', 'doctor', 'clinic', 'hospital', 'care', 'therapy', 'wellness'],
    'Construction': ['build', 'construct', 'renovation', 'home', 'house', 'property', 'contractor'],
    'Finance': ['financ', 'invest', 'wealth', 'money', 'capital', 'fund', 'asset', 'advisor'],
    'Legal': ['law', 'legal', 'attorney', 'solicitor', 'advocate', 'barrister', 'justice'],
    'Real Estate': ['real', 'estate', 'property', 'realty', 'home', 'house', 'land', 'apartment']
  };
  
  if (industryTerms[industry]) {
    for (const term of industryTerms[industry]) {
      if (domainLower.includes(term)) {
        score += 10;
        break; // Only count industry match once
      }
    }
  }
  
  // Search query term bonus (includes specialty)
  if (searchQuery) {
    const queryParts = searchQuery.toLowerCase().split(' ');
    for (const part of queryParts) {
      if (part.length > 3 && domainLower.includes(part)) {
        score += 15; // Higher bonus for specialty match
        break; // Only count once
      }
    }
  }
  
  // Australian domain bonus
  if (domainLower.endsWith('.com.au') || domainLower.endsWith('.net.au')) {
    score += 10;
  }
  
  // Shorter domain bonus (more likely to be established)
  if (domain.length < 15) {
    score += 5;
  }
  
  return Math.min(100, score);
}

/**
 * Format domain name into a business name
 * @param {string} domain - Domain name
 * @returns {string} - Formatted business name
 */
function formatDomainName(domain) {
  if (!domain) return 'Competitor';
  
  // Remove www. and TLD
  let name = domain.replace(/^www\./, '').replace(/\.[a-z]{2,}(\.au)?$/, '');
  
  // Split by dot and dash
  let parts = name.split(/[.-]/);
  
  // Capitalize each part and join with space
  name = parts.map(part => {
    return part.charAt(0).toUpperCase() + part.slice(1);
  }).join(' ');
  
  // Clean up common abbreviations
  name = name.replace(/Pty Ltd/i, '').replace(/Inc/i, '').trim();
  
  // Add location context if possible
  const locationContext = extractLocationFromDomain(domain);
  if (locationContext && !name.includes(locationContext)) {
    name = `${name} ${locationContext}`;
  }
  
  return name;
}

/**
 * Extract potential location from domain name
 * @param {string} domain - Domain name
 * @returns {string} - Location or empty string
 */
function extractLocationFromDomain(domain) {
  // Australian cities and states to look for
  const locations = [
    'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 
    'GoldCoast', 'Newcastle', 'Canberra', 'Wollongong', 'Hobart',
    'Geelong', 'Townsville', 'Cairns', 'Darwin', 'NSW', 'VIC',
    'QLD', 'WA', 'SA', 'TAS', 'NT', 'ACT'
  ];
  
  const domainLower = domain.toLowerCase();
  
  for (const location of locations) {
    if (domainLower.includes(location.toLowerCase())) {
      // Format location (e.g., "goldcoast" to "Gold Coast")
      if (location === 'GoldCoast') {
        return 'Gold Coast';
      }
      return location;
    }
  }
  
  return '';
}

module.exports = {
  init,
  getWebsiteContent,
  fetchCompetitorsFromDataForSEO,
  extractLocationFromDomain
};