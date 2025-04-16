import React from 'react';

const CredibilityScore = ({ score, label }) => {
  // Calculate circle properties
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const strokeDashoffset = circumference - progress;
  
  // Determine color based on score
  const getScoreColor = (score) => {
    if (score >= 80) return { ring: '#10B981', text: '#065F46' }; // Green
    if (score >= 60) return { ring: '#3B82F6', text: '#1E40AF' }; // Blue
    if (score >= 40) return { ring: '#F59E0B', text: '#B45309' }; // Yellow/Amber
    return { ring: '#EF4444', text: '#B91C1C' }; // Red
  };
  
  const colors = getScoreColor(score);
  
  return (
    <div className="bg-white p-6 rounded-lg shadow flex flex-col items-center">
      <div className="text-sm font-medium text-gray-500 mb-4 text-center">Overall Credibility</div>
      
      <div className="relative flex items-center justify-center">
        {/* Background circle */}
        <svg width="200" height="200" className="transform -rotate-90">
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#E5E7EB"
            strokeWidth="12"
          />
          
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke={colors.ring}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        
        {/* Score text */}
        <div className="absolute flex flex-col items-center">
          <div className="text-5xl font-bold" style={{ color: colors.text }}>{score}</div>
          <div className="text-sm font-medium mt-1 text-gray-500">/100</div>
        </div>
      </div>
      
      <div className={`mt-4 px-3 py-1.5 text-sm font-medium rounded ${
        label === 'HIGH' ? 'bg-green-100 text-green-800' :
        label === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
        label === 'LOW' ? 'bg-yellow-100 text-yellow-800' :
        'bg-red-100 text-red-800'
      }`}>
        {label}
      </div>
      
      <div className="mt-4 text-sm text-gray-500 text-center">
        <p>Based on AI analysis of your web presence compared to competitors</p>
      </div>
    </div>
  );
};

export default CredibilityScore;