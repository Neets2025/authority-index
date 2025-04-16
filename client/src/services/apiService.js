import axios from 'axios';

// Read API base URL from environment variables
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for potentially slow AI operations
});

// Add request interceptor for authentication if needed
apiClient.interceptors.request.use(
  (config) => {
    // Add any auth tokens or other headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with a status code outside of 2xx range
      console.error('API Error:', error.response.status, error.response.data);
      
      // Customize error messages based on status code
      if (error.response.status === 429) {
        error.message = 'API rate limit exceeded. Please try again later.';
      } else if (error.response.status === 403) {
        error.message = 'Access denied. Please check your API credentials.';
      } else if (error.response.status >= 500) {
        error.message = 'Server error. Our team has been notified.';
      }
    } else if (error.request) {
      // Request was made but no response was received
      console.error('API No Response:', error.request);
      error.message = 'No response from server. Please check your internet connection.';
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const analyzeWebsite = async (url, industry, specialty = '') => {
  try {
    const response = await apiClient.post('/analyze', {
      url,
      industry,
      specialty
    });
    return response.data;
  } catch (error) {
    console.error('Website analysis error:', error);
    throw error;
  }
};

export const getCompetitors = async (url, industry, specialty = '') => {
  try {
    const response = await apiClient.post('/competitors', {
      url,
      industry,
      specialty
    });
    return response.data;
  } catch (error) {
    console.error('Competitor analysis error:', error);
    throw error;
  }
};

// New API functions
export const getIndustryAverage = async (industry, specialty = '') => {
  try {
    const response = await apiClient.get('/industry-average', {
      params: { industry, specialty }
    });
    return response.data;
  } catch (error) {
    console.error('Industry average data error:', error);
    throw error;
  }
};

export const getRecommendations = async (url, industry, competitors, specialty = '') => {
  try {
    const response = await apiClient.post('/recommendations', {
      url,
      industry,
      specialty,
      competitorData: competitors
    });
    return response.data;
  } catch (error) {
    console.error('Recommendations error:', error);
    throw error;
  }
};

// Fallback function for when API calls fail
export const generateFallbackData = (url, industry, specialty = '') => {
  console.warn('Using fallback data for', url, industry, specialty);
  
  // Generate basic fallback data to avoid UI errors
  return {
    credibilityScore: 60,
    expertiseSignals: 55,
    digitalAuthority: 65,
    consistencyMarkers: 60,
    scoreLabels: {
      overall: 'MEDIUM',
      expertise: 'MEDIUM',
      audienceTrust: 'MEDIUM',
      communication: 'MEDIUM'
    },
    competitors: [
      {
        name: 'Competitor 1',
        expertiseScore: 70,
        authorityScore: 75,
        communicationScore: 65,
        position: 'VERIFIED EXPERT',
        isBoss: true
      },
      {
        name: 'Competitor 2',
        expertiseScore: 50,
        authorityScore: 85,
        communicationScore: 60,
        position: 'VISIBILITY WITHOUT SUBSTANCE'
      },
      {
        name: 'Industry Average',
        expertiseScore: 60,
        authorityScore: 60,
        communicationScore: 58,
        isIndustry: true
      }
    ],
    recommendations: [
      {
        category: 'EXPERTISE VALIDATION',
        description: 'Your expertise presentation needs improvement compared to top competitors.',
        impact: 'Improving expertise presentation can increase prospect trust significantly.',
        actionItems: [
          'Add credential information and professional background',
          'Create case studies that demonstrate your expertise',
          'Display relevant certifications and qualifications'
        ]
      },
      {
        category: 'AUDIENCE TRUST',
        description: 'Your online visibility needs enhancement.',
        impact: 'Improving online visibility can increase lead generation substantially.',
        actionItems: [
          'Optimize your online business profiles',
          'Create targeted content that demonstrates your expertise',
          'Build a consistent brand presence across relevant platforms'
        ]
      }
    ]
  };
};

export default {
  analyzeWebsite,
  getCompetitors,
  getIndustryAverage,
  getRecommendations,
  generateFallbackData
};