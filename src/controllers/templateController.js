const templateService = require('../services/templateService');
const { getPaginationOptions, formatPaginationResult } = require('../utilities/paginationHelper');
const { sendSuccess } = require('../utilities/responseHelper');
const { templateListItemDTO, templateDetailDTO } = require('../dtos/template.dto');
const asyncHandler = require('../utilities/asyncHandler');
const AppError = require('../utilities/AppError');
const generatorService = require('../services/generatorService');

const getTemplates = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = getPaginationOptions(req.query);

  const filter = {};
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.search) {
    filter.name = new RegExp(req.query.search, 'i');
  }

  const templates = await templateService.getPublicTemplates(filter, skip, limit, sort);
  const total = await templateService.getPublicTemplatesCount(filter);

  const formatted = templates.map(t => templateListItemDTO(t));
  const result = formatPaginationResult(total, page, limit, formatted);

  return sendSuccess(res, 'Templates retrieved successfully.', result);
});

const getTemplateById = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplateById(req.params.id, true);
  return sendSuccess(res, 'Template details retrieved successfully.', { template: templateDetailDTO(template) });
});

const getPopularTemplates = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 5;
  const templates = await templateService.getPopularTemplates(limit);
  const formatted = templates.map(t => templateListItemDTO(t));
  return sendSuccess(res, 'Popular templates retrieved successfully.', { templates: formatted });
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await templateService.getCategories({ isActive: true });
  return sendSuccess(res, 'Categories retrieved successfully.', { categories });
});

const previewTemplate = asyncHandler(async (req, res) => {
  const template = await templateService.getTemplateById(req.params.id, true);
  if (!template) {
    throw new AppError('Template not found.', 404);
  }

  const dummyData = {
    personal: {
      fullName: 'Jane Doe',
      title: 'Senior Software Engineer & UI Designer',
      bio: 'Passionate designer and developer with 5+ years of experience building beautiful, accessible user interfaces. I love crafting code, tinkering with animations, and deploying serverless web apps.',
      location: 'San Francisco, CA',
      email: 'jane.doe@example.com',
      phone: '+1 (555) 019-2834',
      website: 'https://example.com',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60'
    },
    portfolioType: 'Developer',
    socialLinks: {
      github: 'https://github.com',
      linkedin: 'https://linkedin.com',
      twitter: 'https://twitter.com',
      instagram: 'https://instagram.com',
      facebook: 'https://facebook.com'
    },
    skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'Figma', 'UI/UX Design', 'CSS Grid', 'Tailwind CSS', 'Docker', 'Git'],
    experience: [
      {
        company: 'Tech Solutions Inc.',
        position: 'Senior Software Engineer',
        startDate: 'Jan 2023',
        endDate: 'Present',
        description: 'Lead developer for high-traffic e-commerce portal, improving page speed by 40% and conversion rate by 15% through modern UI rebuilds in React.'
      },
      {
        company: 'Creative Media Agency',
        position: 'Web Developer',
        startDate: 'Jun 2021',
        endDate: 'Dec 2022',
        description: 'Built and maintained 30+ responsive websites for diverse clients, resulting in multiple local design awards.'
      }
    ],
    education: [
      {
        institution: 'State Tech University',
        degree: 'B.S. in Computer Science',
        year: '2021',
        description: 'Graduated with honors, focusing on human-computer interaction and web design.'
      }
    ],
    projects: [
      {
        name: 'Interactive Design System',
        description: 'A comprehensive, modular CSS design token library built for lightning-fast premium website layout creations.',
        technologies: ['React', 'Tailwind', 'Storybook'],
        githubLink: 'https://github.com',
        liveDemo: 'https://example.com',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=60'
      },
      {
        name: 'Analytics Dashboard App',
        description: 'Real-time performance metrics monitor aggregating visual charts and tables for system health telemetry.',
        technologies: ['Node.js', 'Chart.js', 'WebSockets'],
        githubLink: 'https://github.com',
        liveDemo: 'https://example.com',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&auto=format&fit=crop&q=60'
      }
    ],
    certificates: [
      {
        name: 'Advanced UI/UX Certification',
        organization: 'Design Institute of Tech',
        date: 'Aug 2022',
        verificationLink: 'https://example.com'
      }
    ],
    additionalInfo: {
      achievements: ['Won Local Hackathon 2022', 'Speaker at WebConf 2023'],
      languages: ['English (Native)', 'Spanish (Conversational)'],
      interests: ['Photography', 'Open Source Contributor'],
      hobbies: ['Hiking', 'Playing Chess']
    }
  };

  let compiledHtml = generatorService.compile(template.htmlCode, dummyData);
  let compiledCss = generatorService.compile(template.cssCode, dummyData);
  let compiledJs = generatorService.compile(template.javascriptCode, dummyData);

  // Replace stylesheet reference with embedded style
  compiledHtml = compiledHtml.replace(
    /<link[^>]*href=["']style\.css["'][^>]*>/i,
    `<style>\n${compiledCss}\n</style>`
  );
  if (!compiledHtml.includes('<style>')) {
    compiledHtml = compiledHtml.replace('</head>', `<style>\n${compiledCss}\n</style></head>`);
  }

  // Replace script reference with embedded script
  compiledHtml = compiledHtml.replace(
    /<script[^>]*src=["']script\.js["'][^>]*>([\s\S]*?)<\/script>/i,
    `<script>\n${compiledJs}\n</script>`
  );
  if (!compiledHtml.includes('<script>')) {
    compiledHtml = compiledHtml.replace('</body>', `<script>\n${compiledJs}\n</script></body>`);
  }

  res.setHeader('Content-Type', 'text/html');
  return res.send(compiledHtml);
});

module.exports = {
  getTemplates,
  getTemplateById,
  getPopularTemplates,
  getCategories,
  previewTemplate
};
