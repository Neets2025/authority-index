/**
 * Content Fetcher Module
 * Handles fetching content from websites using either DataForSEO API or direct fetching
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');

// Credentials
let DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD;

/**
 * Initialize the module with API credentials
 * @param {string} login - DataForSEO login
 * @param {string} password - DataForSEO password
 */
function init(login, password) {
  DATAFORSEO_LOGIN = login;
  DATAFORSEO_PASSWORD = password;
}

/**
 * Fetch content from a webpage using DataForSEO API
 * @param {string} url - URL to fetch content from
 * @returns {Promise<string>} - Webpage content
 */
async function fetchContentFromDataForSEO(url) {
  try {
    console.log(`Fetching content from DataForSEO for ${url}...`);
    
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      throw new Error('DataForSEO credentials not configured');
    }
    
    // Format the request body according to DataForSEO's specifications
    const requestData = [{
      url: url,
      enable_javascript: true,
      enable_browser_rendering: true  // Add this to get more complete content
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
      timeout: 60000 // Increase timeout for content fetching
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
      
      const content = response.data.tasks[0].result[0].items[0].page_content || 
                      response.data.tasks[0].result[0].items[0].content || 
                      response.data.tasks[0].result[0].items[0].plain_text;
      
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

/**
 * Fetch competitors for a website using DataForSEO API
 * @param {string} url - URL to find competitors for
 * @param {number} limit - Maximum number of competitors to return
 * @returns {Promise<Array>} - List of competitors
 */
async function fetchCompetitorsFromDataForSEO(url, limit = 5) {
  try {
    console.log(`Fetching competitors from DataForSEO for ${url}...`);
    
    if (!DATAFORSEO_LOGIN || !DATAFORSEO_PASSWORD) {
      throw new Error('DataForSEO credentials not configured');
    }
    
    // Extract domain from URL for DataForSEO
    let domain;
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.replace('www.', '');
    } catch (error) {
      throw new Error(`Invalid URL format: ${error.message}`);
    }
    
    // Updated request body format for DataForSEO Competitors API
    const requestData = [{
      target: domain, // Use domain instead of full URL
      limit: limit,
      include_subdomains: true
    }];
    
    const authString = Buffer.from(`${DATAFORSEO_LOGIN}:${DATAFORSEO_PASSWORD}`).toString('base64');
    
    // Updated API endpoint URL
    const response = await axios({
      method: 'post',
      url: 'https://api.dataforseo.com/v3/domain_analytics/competitors/live',
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
    
    // Updated response structure processing
    if (response.data.tasks && 
        response.data.tasks[0] && 
        response.data.tasks[0].result && 
        response.data.tasks[0].result[0] && 
        response.data.tasks[0].result[0].items) {
      
      const competitorItems = response.data.tasks[0].result[0].items;
      
      // Transform the competitor data into our format
      const competitors = competitorItems.map(item => {
        return {
          name: item.domain || item.competitor_domain || '',
          url: 'https://' + (item.domain || item.competitor_domain || ''),
          relevanceScore: item.relevance || item.intersections || 0,
          seoData: {
            traffic: item.metrics?.organic?.traffic || 0,
            keywords: item.metrics?.organic?.keywords || 0,
            backlinks: item.metrics?.backlinks?.referring_domains || 0
          }
        };
      }).filter(comp => comp.name); // Filter out any items without a name
      
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

/**
 * Fallback function to fetch webpage content directly
 * @param {string} url - URL to fetch content from
 * @returns {Promise<string>} - Webpage content
 */
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
 * Get website content, trying DataForSEO first and falling back to direct fetch
 * @param {string} url - Website URL to fetch
 * @returns {Promise<string>} - Website content
 */
async function getWebsiteContent(url) {
  try {
    // Try DataForSEO first, fall back to direct fetch
    try {
      if (DATAFORSEO_LOGIN && DATAFORSEO_PASSWORD) {
        return await fetchContentFromDataForSEO(url);
      } else {
        throw new Error('DataForSEO credentials not configured');
      }
    } catch (dataForSeoError) {
      console.log(`DataForSEO fetch failed: ${dataForSeoError.message}. Falling back to direct fetch.`);
      return await fetchPageContent(url);
    }
  } catch (error) {
    console.error('Error fetching content:', error);
    throw error;
  }
}

module.exports = {
  init,
  getWebsiteContent,
  fetchContentFromDataForSEO,
  fetchCompetitorsFromDataForSEO,
  fetchPageContent
};
