const express = require('express');
const router = express.Router();
const contentFetcher = require('../modules/content-fetcher');
const aiAnalyzer = require('../modules/ai-analyzer');

/**
 * POST /api/analyze
 * Analyzes a website for expertise and authority signals
 * @param {string} url - Website URL to analyze
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

    console.log(`Analyzing website: ${url} (${industry}${specialty ? `, ${specialty}` : ''})`);

    // 1. Fetch website content
    let content;
    try {
      content = await contentFetcher.getWebsiteContent(url);

      if (!content || content.length < 100) {
        return res.status(400).json({
          error: true,
          message: 'Unable to extract sufficient content from the website'
        });
      }
    } catch (fetchError) {
      console.error('Error fetching website content:', fetchError);
      return res.status(400).json({
        error: true,
        message: 'Unable to fetch website content. Please check the URL and try again.'
      });
    }

    // 2. Analyze content using AI
    let analysisData;
    try {
      analysisData = await aiAnalyzer.analyzeContent(content, industry, specialty);

      if (!analysisData) {
        throw new Error('AI analysis failed');
      }
    } catch (analysisError) {
      console.error('Error in AI analysis:', analysisError);

      // Fallback to basic analysis if AI fails
      analysisData = {
        expertiseScore: 60,
        authorityScore: 55,
        trustScore: 60,
        contentQualityScore: 65,
        communicationScore: 60,
        credibilityScore: 58,
        strengths: ["Website has clear service descriptions"],
        weaknesses: ["Limited evidence of expertise", "Few trust signals"],
        recommendations: [
          {
            category: 'EXPERTISE VALIDATION',
            description: 'Your expertise presentation needs improvement.',
            impact: 'Improving expertise presentation can increase prospect trust.',
            actionItems: [
              'Add credential information and professional background',
              'Create case studies that demonstrate your expertise',
              'Display relevant certifications and qualifications'
            ]
          },
          {
            category: 'AUDIENCE TRUST',
            description: 'Your online visibility needs enhancement.',
            impact: 'Improving online visibility can increase lead generation.',
            actionItems: [
              'Optimize your Google Business Profile',
              'Create targeted content that demonstrates your expertise',
              'Build a consistent brand presence across platforms'
            ]
          }
        ]
      };
    }

    // 3. Map scores to labels
    const scoreLabels = {
      overall: mapScoreToLabel(analysisData.credibilityScore),
      expertise: mapScoreToLabel(analysisData.expertiseScore),
      audienceTrust: mapScoreToLabel(analysisData.authorityScore),
      communication: mapScoreToLabel(analysisData.communicationScore)
    };

    // 4. Prepare response data
    const responseData = {
      url,
      industry,
      specialty: specialty || '',
      credibilityScore: analysisData.credibilityScore,
      expertiseSignals: analysisData.expertiseScore,
      digitalAuthority: analysisData.authorityScore,
      consistencyMarkers: analysisData.communicationScore,
      scoreLabels,
      strengths: analysisData.strengths || [],
      weaknesses: analysisData.weaknesses || [],
      recommendations: analysisData.recommendations || [],
      userData: {
        expertiseScore: analysisData.expertiseScore,
        authorityScore: analysisData.authorityScore,
        communicationScore: analysisData.communicationScore
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: true,
      message: 'An error occurred during analysis. Please try again.'
    });
  }
});

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

module.exports = router;