/**
 * Constants and industry-specific terminology
 * Contains regulatory information, industry terms, and other constants
 */

// Australian healthcare and other industry regulatory context
const industryRegulations = {
  "Healthcare": {
    regulatoryBodies: [
      "AHPRA", "Medical Board of Australia", "RACS", "ASPS", "ASAPS", 
      "TGA", "Healthcare Complaints Commission"
    ],
    credentials: [
      "FRACS", "MBBS", "BMed", "Fellow of", "Specialist Plastic Surgeon",
      "Registered Medical Practitioner"
    ],
    complianceTerms: [
      "AHPRA registered", "Medical Board of Australia", "code of conduct",
      "Australian Standards", "health practitioner regulation"
    ],
    reviewLimitations: {
      "Plastic Surgery": true,
      "Cosmetic Surgery": true,
      "General Practice": false,
      "Dentistry": false
    },
    scoreWeightAdjustments: {
      expertiseWeight: 0.5,
      authorityWeight: 0.3,
      consistencyWeight: 0.2
    }
  },
  "Finance": {
    regulatoryBodies: [
      "ASIC", "AFSL", "Australian Financial Services License", "APRA",
      "Financial Adviser Standards and Ethics Authority", "FASEA"
    ],
    credentials: [
      "CFP", "Certified Financial Planner", "CA", "CPA", "RG146",
      "Financial Adviser", "Authorised Representative"
    ],
    complianceTerms: [
      "AFSL", "ABN", "Australian Financial Services License", "disclosure",
      "Statement of Advice", "Financial Services Guide", "compliant"
    ],
    reviewLimitations: {
      "Financial Planning": true,
      "Mortgage Broking": true,
      "Investment": true
    },
    scoreWeightAdjustments: {
      expertiseWeight: 0.45,
      authorityWeight: 0.3,
      consistencyWeight: 0.25
    }
  },
  "Legal": {
    regulatoryBodies: [
      "Law Society", "Legal Services Commission", "Legal Practice Board",
      "Law Institute", "Bar Association"
    ],
    credentials: [
      "LLB", "JD", "Solicitor", "Barrister", "Attorney", "Principal",
      "Partner", "Legal Practitioner"
    ],
    complianceTerms: [
      "practicing certificate", "admitted", "legal practitioner",
      "professional standards", "ethics", "legal profession"
    ],
    reviewLimitations: {
      "All": true
    },
    scoreWeightAdjustments: {
      expertiseWeight: 0.5,
      authorityWeight: 0.25,
      consistencyWeight: 0.25
    }
  },
  "Construction": {
    regulatoryBodies: [
      "Building Commission", "Fair Trading", "Master Builders",
      "Housing Industry Association", "Building Practitioners Board"
    ],
    credentials: [
      "Licensed Builder", "Registered", "Certified", "Master Builder",
      "Building Practitioner"
    ],
    complianceTerms: [
      "licensed", "insured", "warranty", "building code", "compliance",
      "Australian Standards", "regulations"
    ],
    reviewLimitations: {
      "All": false
    },
    scoreWeightAdjustments: {
      expertiseWeight: 0.4,
      authorityWeight: 0.4,
      consistencyWeight: 0.2
    }
  },
  "Real Estate": {
    regulatoryBodies: [
      "Real Estate Institute", "Estate Agents Authority", "Consumer Affairs",
      "Fair Trading", "Property Council"
    ],
    credentials: [
      "Licensed Agent", "Licensed Real Estate Agent", "REIA", "Registered",
      "Auctioneer"
    ],
    complianceTerms: [
      "license number", "licensed", "member of", "professional standards",
      "code of conduct", "registered"
    ],
    reviewLimitations: {
      "All": false
    },
    scoreWeightAdjustments: {
      expertiseWeight: 0.4,
      authorityWeight: 0.4,
      consistencyWeight: 0.2
    }
  },
  "Default": {
    scoreWeightAdjustments: {
      expertiseWeight: 0.45,
      authorityWeight: 0.35,
      consistencyWeight: 0.2
    }
  }
};

// Industry-specific terminology
const industryTerminology = {
  "Healthcare": {
    generalTerms: [
      "patient", "care", "health", "treatment", "diagnosis", 
      "medical", "clinical", "healthcare", "procedure", "consultation"
    ],
    specialtyTerms: {
      "Plastic Surgery": [
        "reconstruction", "cosmetic", "aesthetic", "surgery", "procedure",
        "enhancement", "augmentation", "reduction", "lift", "reshape"
      ],
      "Cosmetic Surgery": [
        "aesthetic", "enhancement", "beauty", "cosmetic", "elective",
        "procedure", "rejuvenation", "transformation", "improvement", "appearance"
      ],
      "General Practice": [
        "primary care", "preventive", "chronic", "family medicine", "checkup",
        "vaccination", "screening", "referral", "holistic", "wellness"
      ],
      "Dentistry": [
        "dental", "teeth", "oral health", "hygiene", "cleaning",
        "filling", "crown", "implant", "whitening", "orthodontic"
      ]
    }
  },
  "Construction": {
    generalTerms: [
      "build", "construction", "project", "design", "renovation",
      "contractor", "building", "structure", "quality", "materials"
    ]
  },
  "Environmental": {
    generalTerms: [
      "sustainable", "environment", "eco-friendly", "conservation", "green",
      "renewable", "efficiency", "impact", "assessment", "management"
    ]
  },
  "Technology": {
    generalTerms: [
      "software", "development", "solution", "innovation", "digital",
      "technology", "system", "application", "platform", "integration"
    ]
  },
  "Finance": {
    generalTerms: [
      "financial", "investment", "planning", "wealth", "tax",
      "retirement", "portfolio", "strategy", "risk", "management"
    ],
    specialtyTerms: {
      "Financial Planning": [
        "financial plan", "retirement", "investment", "superannuation", "advice",
        "strategy", "goals", "wealth", "portfolio", "asset allocation"
      ],
      "Mortgage Broking": [
        "mortgage", "loan", "interest rate", "refinance", "repayments",
        "lending", "application", "pre-approval", "borrowing", "lender"
      ],
      "Accounting": [
        "tax", "accounting", "audit", "compliance", "financial statements",
        "bookkeeping", "BAS", "lodgment", "deduction", "expense"
      ],
      "Investment": [
        "portfolio", "returns", "diversification", "growth", "income",
        "capital", "asset", "risk profile", "market", "securities"
      ]
    }
  },
  "Legal": {
    generalTerms: [
      "legal", "law", "attorney", "solicitor", "litigation", 
      "rights", "court", "claim", "advice", "representation"
    ],
    specialtyTerms: {
      "Family Law": [
        "divorce", "custody", "parenting", "settlement", "property",
        "support", "mediation", "separation", "child", "spouse"
      ],
      "Criminal Law": [
        "defense", "charges", "prosecution", "bail", "sentencing",
        "trial", "evidence", "allegations", "court", "plea"
      ],
      "Commercial Law": [
        "contract", "business", "commercial", "corporation", "compliance",
        "governance", "transaction", "liability", "dispute", "litigation"
      ],
      "Property Law": [
        "property", "conveyancing", "title", "transfer", "settlement",
        "purchase", "sale", "lease", "contract", "owners corporation"
      ]
    }
  },
  "Real Estate": {
    generalTerms: [
      "property", "sale", "purchase", "listing", "agent",
      "market", "appraisal", "real estate", "price", "value"
    ]
  }
};

// Name prefixes and suffixes for generating simulated competitors
const simulationData = {
  industryPrefixes: {
    "Healthcare": ["Advanced", "City", "Premier", "Elite", "Modern", "Australian", "Sydney", "Melbourne", "Brisbane", "Perth", "National", "Complete", "Total"],
    "Construction": ["Quality", "Expert", "Master", "Professional", "Advanced", "Premier", "Australian", "Western", "Eastern", "Southern", "Precision", "Custom", "Elite"],
    "Environmental": ["Green", "Eco", "Sustainable", "Natural", "Earth", "Clean", "Australian", "Climate", "Environmental", "Sydney", "Organic", "Renewable", "Pure"],
    "Technology": ["Tech", "Digital", "Innovative", "Smart", "Future", "Advanced", "Next-Gen", "Australian", "Sydney", "Melbourne", "Cloud", "Cyber", "Data"],
    "Finance": ["Secure", "Trusted", "Premier", "Capital", "Financial", "Wealth", "Australian", "Sydney", "Melbourne", "Brisbane", "Strategic", "Global", "Asset"],
    "Legal": ["Expert", "Premier", "Professional", "National", "Australian", "City", "Central", "Regional", "Metropolitan", "Capital", "Advocate", "Justice", "Rights"],
    "Real Estate": ["Premier", "Elite", "Australian", "Capital", "City", "Metropolitan", "Regional", "National", "First", "Prime", "Select", "Prestige", "Choice"]
  },
  industrySuffixes: {
    "Healthcare": ["Medical", "Healthcare", "Clinic", "Specialists", "Practice", "Doctors", "Health", "Wellness", "Care", "Group", "Medical Centre", "Hospital"],
    "Construction": ["Builders", "Construction", "Homes", "Building", "Projects", "Contractors", "Renovations", "Development", "Structures", "Solutions", "Properties"],
    "Environmental": ["Solutions", "Consultants", "Services", "Group", "Associates", "Advisors", "Management", "Team", "Professionals", "Experts", "Systems"],
    "Technology": ["Technologies", "Solutions", "Systems", "IT", "Computing", "Digital", "Tech", "Software", "Group", "Services", "Networks", "Cloud", "Innovations"],
    "Finance": ["Advisors", "Partners", "Planners", "Group", "Associates", "Consulting", "Management", "Services", "Solutions", "Specialists", "Investments"],
    "Legal": ["Law Firm", "Legal", "Lawyers", "Attorneys", "Law Group", "Legal Partners", "Associates", "Solicitors", "Advocates", "Legal Services", "Legal Solutions"],
    "Real Estate": ["Properties", "Real Estate", "Realty", "Homes", "Property Group", "Estate Agents", "Realtors", "Property Partners", "Land", "Residential"]
  },
  defaultPrefixes: ["Premier", "Advanced", "Elite", "Expert", "Professional", "Complete", "Total", "Australian"],
  defaultSuffixes: ["Services", "Group", "Solutions", "Professionals", "Experts", "Associates", "Partners", "Australia"]
};

module.exports = {
  industryRegulations,
  industryTerminology,
  simulationData
};