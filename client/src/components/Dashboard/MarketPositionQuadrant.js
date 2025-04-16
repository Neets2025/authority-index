import React, { useState } from 'react';

const MarketPositionQuadrant = ({ userData, competitors, industryAverage }) => {
  const [hoveredItem, setHoveredItem] = useState(null);
  
  // Set up dimensions and layout
  const width = 600;
  const height = 500;
  const padding = 50;
  const innerWidth = width - (padding * 2);
  const innerHeight = height - (padding * 2);

  // Helper function to map expertise and authority scores to coordinates
  const mapToCoordinates = (authorityScore, expertiseScore) => {
    // Map scores to coordinates (authority score is x-axis, expertise score is y-axis)
    const x = padding + (authorityScore / 100) * innerWidth;
    const y = height - padding - (expertiseScore / 100) * innerHeight;
    return { x, y };
  };

  // Render quadrant labels
  const renderQuadrantLabels = () => (
    <>
      <div className="absolute top-8 right-8 text-center p-2 bg-blue-50 bg-opacity-80 rounded shadow text-sm">
        <strong className="block text-blue-800">VERIFIED EXPERT</strong>
        <span className="text-xs text-gray-600">High expertise, high visibility</span>
      </div>
      
      <div className="absolute top-8 left-8 text-center p-2 bg-yellow-50 bg-opacity-80 rounded shadow text-sm">
        <strong className="block text-yellow-800">HIDDEN EXPERT</strong>
        <span className="text-xs text-gray-600">High expertise, low visibility</span>
      </div>
      
      <div className="absolute bottom-8 right-8 text-center p-2 bg-red-50 bg-opacity-80 rounded shadow text-sm">
        <strong className="block text-red-800">VISIBILITY WITHOUT SUBSTANCE</strong>
        <span className="text-xs text-gray-600">Low expertise, high visibility</span>
      </div>
      
      <div className="absolute bottom-8 left-8 text-center p-2 bg-gray-50 bg-opacity-80 rounded shadow text-sm">
        <strong className="block text-gray-800">LOW PROFILE</strong>
        <span className="text-xs text-gray-600">Low expertise, low visibility</span>
      </div>
    </>
  );

  // Render axis labels
  const renderAxisLabels = () => (
    <>
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm font-medium text-gray-600">
        AUDIENCE TRUST / VISIBILITY
      </div>
      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-gray-600">
        EXPERTISE VALIDATION
      </div>
    </>
  );

  // Render quadrant lines
  const renderQuadrantLines = () => (
    <>
      {/* Vertical midline */}
      <line 
        x1={padding + innerWidth / 2} 
        y1={padding} 
        x2={padding + innerWidth / 2} 
        y2={height - padding} 
        stroke="#CBD5E1" 
        strokeWidth="1"
        strokeDasharray="5,5" 
      />
      
      {/* Horizontal midline */}
      <line 
        x1={padding} 
        y1={padding + innerHeight / 2} 
        x2={width - padding} 
        y2={padding + innerHeight / 2} 
        stroke="#CBD5E1" 
        strokeWidth="1"
        strokeDasharray="5,5" 
      />
    </>
  );

  // Render entity (user, competitor, or industry average)
  const renderEntity = (entity, index) => {
    const { authorityScore, expertiseScore } = entity;
    const { x, y } = mapToCoordinates(authorityScore, expertiseScore);
    
    // Set different styles based on entity type
    let fillColor = "#3B82F6"; // Default blue
    let strokeColor = "#1E40AF";
    let radius = 10;
    let strokeWidth = 2;
    
    if (entity.isUser) {
      fillColor = "#10B981"; // Green for user
      strokeColor = "#065F46";
      radius = 12;
      strokeWidth = 3;
    } else if (entity.isIndustry) {
      fillColor = "#9CA3AF"; // Gray for industry average
      strokeColor = "#4B5563";
      radius = 10;
      strokeWidth = 2;
    } else if (entity.isBoss) {
      fillColor = "#F87171"; // Red for top competitor
      strokeColor = "#B91C1C";
      radius = 12;
    }
    
    const isHovered = hoveredItem === entity.name;
    
    return (
      <g key={index} onMouseEnter={() => setHoveredItem(entity.name)} onMouseLeave={() => setHoveredItem(null)}>
        {/* Entity circle */}
        <circle 
          cx={x} 
          cy={y} 
          r={isHovered ? radius + 2 : radius} 
          fill={fillColor} 
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          opacity={0.8}
        />
        
        {/* Entity label */}
        <text 
          x={x} 
          y={y + radius + 12} 
          textAnchor="middle" 
          fill="#1F2937" 
          className="text-xs font-medium"
        >
          {entity.name}
        </text>
        
        {/* Tooltip on hover */}
        {isHovered && (
          <g>
            <rect 
              x={x + 15} 
              y={y - 40} 
              width={180} 
              height={80} 
              rx={4} 
              fill="white" 
              stroke="#E5E7EB"
              strokeWidth={1}
              opacity={0.95}
            />
            <text x={x + 25} y={y - 20} fill="#1F2937" className="text-xs font-medium">
              {entity.name}
            </text>
            <text x={x + 25} y={y} fill="#4B5563" className="text-xs">
              Expertise: {expertiseScore}
            </text>
            <text x={x + 25} y={y + 20} fill="#4B5563" className="text-xs">
              Audience Trust: {authorityScore}
            </text>
          </g>
        )}
      </g>
    );
  };

  // Prepare entities array (user, competitors, industry average)
  const entities = [
    // User data
    { ...userData, isUser: true, name: "Your Position" },
    // Industry average
    { ...industryAverage, isIndustry: true, name: "Industry Average" },
    // Competitors
    ...competitors.map(comp => ({ ...comp, name: comp.name }))
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h3 className="font-semibold text-lg mb-4">Market Position</h3>
      <div className="relative" style={{ width, height }}>
        {renderQuadrantLabels()}
        {renderAxisLabels()}
        
        <svg width={width} height={height}>
          {/* Background */}
          <rect x={padding} y={padding} width={innerWidth} height={innerHeight} fill="#F9FAFB" rx={4} />
          
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percent, i) => (
            <React.Fragment key={`grid-${i}`}>
              {/* Vertical grid lines */}
              <line 
                x1={padding + (percent / 100) * innerWidth} 
                y1={padding} 
                x2={padding + (percent / 100) * innerWidth} 
                y2={height - padding} 
                stroke="#E5E7EB" 
                strokeWidth="1" 
              />
              
              {/* Horizontal grid lines */}
              <line 
                x1={padding} 
                y1={padding + (percent / 100) * innerHeight} 
                x2={width - padding} 
                y2={padding + (percent / 100) * innerHeight} 
                stroke="#E5E7EB" 
                strokeWidth="1" 
              />
            </React.Fragment>
          ))}
          
          {renderQuadrantLines()}
          
          {/* Entities (user, competitors, industry average) */}
          {entities.map(renderEntity)}
        </svg>
      </div>
      <p className="text-sm text-gray-500 mt-4">
        Calculated utilizing DataForSEO estimated website traffic/month, branded content in search, 
        total social media followers and Google review score.
      </p>
    </div>
  );
};

export default MarketPositionQuadrant;