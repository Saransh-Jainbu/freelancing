const express = require('express');
const router = express.Router();
const axios = require('axios');

// Configuration for external APIs
const GITHUB_JOBS_API = 'https://jobs.github.com/positions.json';
const ADZUNA_API_ID = process.env.ADZUNA_API_ID;
const ADZUNA_API_KEY = process.env.ADZUNA_API_KEY;

/**
 * GET /internships
 * Fetch internship listings from reputable sources
 */
router.get('/', async (req, res) => {
  try {
    // Get search parameters from query if any
    const { query = '', location = '', page = 1 } = req.query;
    
    // Get current date for deadline calculations
    const currentDate = new Date();
    const twoMonthsFromNow = new Date(currentDate);
    twoMonthsFromNow.setMonth(currentDate.getMonth() + 2);
    
    // Try fetching from GitHub Jobs (primary source)
    let internships = [];
    try {
      const githubResponse = await axios.get(GITHUB_JOBS_API, {
        params: {
          description: query ? `${query} intern` : 'intern',
          location: location || '',
          page: page
        }
      });
      
      if (githubResponse.data && Array.isArray(githubResponse.data)) {
        internships = githubResponse.data.map(job => ({
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type === 'Full Time' ? 'Full-time' : 'Part-time',
          posted: new Date(job.created_at).toLocaleDateString(),
          deadline: new Date(twoMonthsFromNow).toLocaleDateString(),
          stipend: 'Competitive',
          description: job.description.slice(0, 300) + '...',
          requirements: [
            'Skills mentioned: ' + extractSkills(job.description).join(', '),
            job.how_to_apply.replace(/<[^>]*>?/gm, '').slice(0, 100) + '...'
          ],
          url: job.url,
          company_url: job.company_url,
          company_logo: job.company_logo
        }));
      }
    } catch (error) {
      console.error('GitHub Jobs API error:', error.message);
      // Continue to backup source if GitHub fails
    }
    
    // If GitHub fails or returns no results, try Adzuna as backup
    if (internships.length === 0 && ADZUNA_API_ID && ADZUNA_API_KEY) {
      try {
        const adzunaResponse = await axios.get(
          `https://api.adzuna.com/v1/api/jobs/us/search/${page}`, {
            params: {
              app_id: ADZUNA_API_ID,
              app_key: ADZUNA_API_KEY,
              results_per_page: 10,
              what: query ? `${query} intern` : 'intern',
              where: location || '',
              content-type: 'application/json'
            }
          }
        );
        
        if (adzunaResponse.data && adzunaResponse.data.results) {
          internships = adzunaResponse.data.results.map(job => ({
            id: job.id,
            title: job.title,
            company: job.company.display_name,
            location: job.location.display_name,
            type: 'Internship',
            posted: new Date(job.created).toLocaleDateString(),
            deadline: new Date(twoMonthsFromNow).toLocaleDateString(),
            stipend: job.salary_min ? `$${job.salary_min}-${job.salary_max}` : 'Competitive',
            description: job.description,
            requirements: [
              'Required skills: ' + extractSkills(job.description).join(', '),
              'See full job posting for details'
            ],
            url: job.redirect_url
          }));
        }
      } catch (error) {
        console.error('Adzuna API error:', error.message);
      }
    }
    
    // If both APIs fail or no real data is available, use fallback mock data
    if (internships.length === 0) {
      internships = getMockInternships();
    }
    
    res.json(internships);
  } catch (error) {
    console.error('Error fetching internships:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch internship listings'
    });
  }
});

/**
 * Extract skills from job description
 */
function extractSkills(description) {
  if (!description) return ['Not specified'];
  
  const commonSkills = [
    'JavaScript', 'Python', 'Java', 'C++', 'React', 'Node.js', 'AWS',
    'SQL', 'NoSQL', 'MongoDB', 'Express', 'Vue.js', 'Angular',
    'Machine Learning', 'Data Science', 'AI', 'Cloud Computing',
    'Git', 'Docker', 'Kubernetes', 'DevOps', 'Agile', 'Scrum',
    'UI/UX', 'Design', 'Figma', 'Photoshop', 'Illustrator',
    'Marketing', 'SEO', 'Content Writing', 'Social Media',
    'Data Analysis', 'Excel', 'Tableau', 'Power BI'
  ];
  
  const foundSkills = commonSkills.filter(skill => 
    description.toLowerCase().includes(skill.toLowerCase())
  );
  
  return foundSkills.length > 0 ? foundSkills : ['Not specified'];
}

/**
 * Provide fallback mock data if APIs fail
 */
function getMockInternships() {
  return [
    {
      id: 1,
      title: 'Software Engineering Intern',
      company: 'Tech Innovators Inc.',
      location: 'Remote',
      type: 'Part-time',
      posted: '2 days ago',
      deadline: 'May 10, 2025',
      stipend: '$20-25/hr',
      description: 'Join our engineering team to develop cutting-edge web applications using React and Node.js.',
      requirements: ['JavaScript proficiency', 'Basic knowledge of React', 'Currently pursuing CS degree']
    },
    {
      id: 2,
      title: 'UX/UI Design Intern',
      company: 'Creative Solutions',
      location: 'New York, NY (Hybrid)',
      type: 'Full-time',
      posted: '1 week ago',
      deadline: 'May 15, 2025',
      stipend: '$22/hr',
      description: 'Help create beautiful user interfaces and experiences for our clients in various industries.',
      requirements: ['Figma skills', 'Understanding of design principles', 'Portfolio required']
    },
    {
      id: 3,
      title: 'Digital Marketing Intern',
      company: 'GrowthHackers',
      location: 'Remote',
      type: 'Part-time',
      posted: '3 days ago',
      deadline: 'May 8, 2025',
      stipend: '$18-20/hr',
      description: 'Assist in managing social media campaigns, content creation, and SEO optimization.',
      requirements: ['Social media knowledge', 'Basic SEO understanding', 'Good writing skills']
    },
    {
      id: 4,
      title: 'Data Science Intern',
      company: 'DataMinds',
      location: 'Boston, MA (On-site)',
      type: 'Full-time',
      posted: '5 days ago',
      deadline: 'May 20, 2025',
      stipend: '$25-28/hr',
      description: 'Work on real-world data science projects involving machine learning and data visualization.',
      requirements: ['Python experience', 'Statistics background', 'Knowledge of ML libraries']
    },
    {
      id: 5,
      title: 'Product Management Intern',
      company: 'ProductPro',
      location: 'Remote',
      type: 'Part-time',
      posted: '1 day ago',
      deadline: 'May 12, 2025',
      stipend: '$22-24/hr',
      description: 'Learn the product development lifecycle while working closely with our product teams.',
      requirements: ['Analytical thinking', 'Communication skills', 'Interest in product development']
    }
  ];
}

module.exports = router;