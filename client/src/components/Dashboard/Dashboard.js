import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyzeWebsite, getCompetitors, getIndustryAverage } from '../../services/apiService';
import MarketPositionQuadrant from './MarketPositionQuadrant';
import CredibilityScore from './CredibilityScore';
import RecommendationCard from './RecommendationCard';

const Dashboard = () => {
  const [searchParams] = useSearchParams();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const url = searchParams.get('url');
    const industry = searchParams.get('industry');
    const specialty = searchParams.get('specialty') || '';
    
    // Only proceed if we have the required parameters
    if (!url || !industry) {
      setError('URL and industry are required');
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching analysis for:', url, industry, specialty);
        
        // Make actual API calls to the backend
        const analysisData = await analyzeWebsite(url, industry, specialty);
        const competitorData = await getCompetitors(url, industry, specialty);
        const industryAvgData = await getIndustryAverage(industry, specialty);
        
        console.log('Analysis data received:', analysisData);
        console.log('Competitor data received:', competitorData);
        
        // Combine the data
        const combinedData = {
          ...analysisData,
          competitors: competitorData.competitors || [],
          insights: competitorData.insights || [],
          industryAverage: industryAvgData
        };
        
        setAnalysis(combinedData);
      } catch (error) {
        console.error('Error loading analysis:', error);
        setError('Failed to load analysis data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Analyzing your website and competitors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-8">LABSOLUTELY.ai</h1>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary mb-8">LABSOLUTELY.ai</h1>
        <div className="bg-red-50 p-4 rounded-md">
          <p className="text-red-600">Failed to load analysis data. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-primary mb-8">LABSOLUTELY.ai</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-1">
          <CredibilityScore 
            score={analysis.credibilityScore} 
            label={analysis.scoreLabels?.overall || 'MEDIUM'} 
          />
        </div>
        
        <div className="lg:col-span-3">
          <h2 className="text-xl font-semibold flex items-center mb-6">
            Credibility Score Results
            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              AI-Enhanced
            </span>
          </h2>
          
          {/* Score cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500 mb-1">Expertise Validation</div>
              <div className="text-3xl font-bold">{analysis.expertiseSignals || analysis.expertiseScore}</div>
              <div className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded ${
                analysis.scoreLabels?.expertise === 'HIGH' ? 'bg-green-100 text-green-800' :
                analysis.scoreLabels?.expertise === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {analysis.scoreLabels?.expertise || 'MEDIUM'}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500 mb-1">Audience Trust</div>
              <div className="text-3xl font-bold">{analysis.digitalAuthority || analysis.authorityScore}</div>
              <div className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded ${
                analysis.scoreLabels?.audienceTrust === 'HIGH' ? 'bg-green-100 text-green-800' :
                analysis.scoreLabels?.audienceTrust === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {analysis.scoreLabels?.audienceTrust || 'MEDIUM'}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm font-medium text-gray-500 mb-1">Communication Integrity</div>
              <div className="text-3xl font-bold">{analysis.consistencyMarkers || analysis.communicationScore}</div>
              <div className={`mt-2 inline-block px-2 py-1 text-xs font-medium rounded ${
                analysis.scoreLabels?.communication === 'HIGH' ? 'bg-green-100 text-green-800' :
                analysis.scoreLabels?.communication === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {analysis.scoreLabels?.communication || 'MEDIUM'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Market Position Quadrant */}
      <MarketPositionQuadrant 
        userData={{
          expertiseScore: analysis.expertiseSignals || analysis.expertiseScore || 65,
          authorityScore: analysis.digitalAuthority || analysis.authorityScore || 70,
          communicationScore: analysis.consistencyMarkers || analysis.communicationScore || 60
        }}
        competitors={analysis.competitors || []}
        industryAverage={analysis.industryAverage || {
          expertiseScore: 60,
          authorityScore: 60,
          communicationScore: 58
        }}
      />
      
      {/* Recommendations */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-lg mb-4">Recommendations</h3>
        
        {analysis.recommendations && analysis.recommendations.length > 0 ? (
          analysis.recommendations.map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))
        ) : (
          <p className="text-gray-500">No recommendations available.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;