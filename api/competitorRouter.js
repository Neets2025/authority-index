const express = require('express');
const router = express.Router();
const competitorAnalyzer = require('../modules/competitor-analyzer');
const contentFetcher = require('../modules/content-fetcher');

/**
 * POST /api/competitors
 * Finds and analyzes competitors for a given website
 * @param {string} url - Website URL to find competitors for
 * @param {string} industry - Industry category
 * @param {string} specialty - Optional industry specialty
 */
router.post('/', async (req, res) => {
  try {
    const { url, industry, specialty } = req.body;
    
    if (!url || !industry) {
      return res.status(400).json({
        error: true,
        message: 'URL and industry are required'
      });
    }
    
    console.log(`Finding competitors for: ${url} (${industry}${specialty ? `, ${specialty}` : ''})`);
    
    // Extract domain from URL
    const domain = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0];
    
    // Use this as a placeholder for the user's analysis (in production, you'd fetch this from your database)
    const userData = {
      expertiseScore: 65,
      authorityScore: 70,
      communicationScore: 65,
      url: url,
      domain: domain,
      industry: industry,
      specialty: specialty || ''
    };
    
    // Find and analyze competitors
    const competitors = await competitorAnalyzer.findAndAnalyzeCompetitors(
      domain, 
      industry, 
      specialty || '', 
      userData
    );
    
    // Generate insights based on competitor analysis
    const insights = competitorAnalyzer.generateCompetitiveInsights(
      userData,
      competitors,
      industry
    );
    
    // Fetch industry average data
    let industryAverage = {
      expertiseScore: 60,
      authorityScore: 60,
      communicationScore: 60,
      isIndustry: true,
      name: `${industry} Industry Average`
    };
    
    try {
      const response = await fetch(
        `http://localhost:${process.env.PORT || 5000}/api/industry-average?industry=${encodeURIComponent(industry)}&specialty=${encodeURIComponent(specialty || '')}`
      );
      
      if (response.ok) {
        industryAverage = await response.json();
      }
    } catch (avgError) {
      console.error('Error fetching industry average:', avgError);
      // Continue with default values
    }
    
    // Calculate quadrant positions to prevent overlaps
    const positionedCompetitors = competitorAnalyzer.calculateCompetitorPositions(competitors);
    
    // Prepare and send response
    res.json({
      competitors: positionedCompetitors,
      insights: insights,
      industryAverage: industryAverage
    });
  } catch (error) {
    console.error('Competitor analysis error:', error);
    
    // Generate simulated competitors as fallback
    let fallbackCompetitors = [];
    
    try {
      const userData = {
        expertiseScore: 65,
        authorityScore: 70,
        communicationScore: 65
      };
      
      fallbackCompetitors = competitorAnalyzer.generateSimulatedCompetitors(
        req.body.industry, 
        req.body.specialty || '', 
        userData, 
        3
      );
      
      const positionedCompetitors = competitorAnalyzer.calculateCompetitorPositions(fallbackCompetitors);
      
      res.json({
        competitors: positionedCompetitors,
        insights: [],
        isSimulated: true,
        industryAverage: {
          expertiseScore: 60,
          authorityScore: 60,
          communicationScore: 60,
          isIndustry: true,
          name: `${req.body.industry} Industry Average`
        }
      });
    } catch (fallbackError) {
      console.error('Fallback competitor generation error:', fallbackError);
      res.status(500).json({
        error: true,
        message: 'An error occurred during competitor analysis. Please try again.'
      });
    }
  }
});

module.exports = router;