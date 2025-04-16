import React from 'react';

const RecommendationCard = ({ recommendation }) => {
  // Helper function to get the appropriate color scheme based on category
  const getCategoryStyles = (category) => {
    switch (category) {
      case 'EXPERTISE VALIDATION':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-100',
          badge: 'bg-blue-100 text-blue-800',
          icon: 'text-blue-500'
        };
      case 'AUDIENCE TRUST':
        return {
          bg: 'bg-green-50',
          border: 'border-green-100',
          badge: 'bg-green-100 text-green-800',
          icon: 'text-green-500'
        };
      case 'COMMUNICATION INTEGRITY':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-100',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: 'text-yellow-500'
        };
      case 'REGULATORY COMPLIANCE':
        return {
          bg: 'bg-red-50',
          border: 'border-red-100',
          badge: 'bg-red-100 text-red-800',
          icon: 'text-red-500'
        };
      case 'MARKET DIFFERENTIATION':
        return {
          bg: 'bg-purple-50',
          border: 'border-purple-100',
          badge: 'bg-purple-100 text-purple-800',
          icon: 'text-purple-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-100',
          badge: 'bg-gray-100 text-gray-800',
          icon: 'text-gray-500'
        };
    }
  };

  // Get styles for this recommendation
  const styles = getCategoryStyles(recommendation.category);

  return (
    <div className={`border rounded-md mb-4 overflow-hidden ${styles.border}`}>
      <div className={`${styles.bg} px-4 py-3 border-b`}>
        <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${styles.badge} mb-2`}>
          {recommendation.category}
        </span>
        <h4 className="font-medium">{recommendation.recommendation}</h4> {/* Changed this line */}
      </div>

      <div className="p-4">
        <div className={`${styles.bg} p-3 rounded mb-3 text-sm font-medium ${styles.badge.replace('bg-', 'text-').replace('100', '800')}`}>
          {recommendation.supportingData} - {recommendation.source} {/* Added this line */}
        </div>

        <ul className="space-y-2">
          {recommendation.actionItems.map((item, i) => (
            <li key={i} className="flex items-start">
              <div className={`${styles.icon} mt-0.5 mr-2 flex-shrink-0`}>
                {getCategoryIcon(recommendation.category)}
              </div>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Helper function to get category-specific icons
const getCategoryIcon = (category) => {
  switch (category) {
    case 'EXPERTISE VALIDATION':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
    case 'AUDIENCE TRUST':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      );
    case 'COMMUNICATION INTEGRITY':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
        </svg>
      );
    case 'REGULATORY COMPLIANCE':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
        </svg>
      );
    case 'MARKET DIFFERENTIATION':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
        </svg>
      );
    default:
      return (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      );
  }
};

export default RecommendationCard;