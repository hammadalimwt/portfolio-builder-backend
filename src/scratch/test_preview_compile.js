const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Template = require('../models/Template');
const generatorService = require('../services/generatorService');
const fs = require('fs');
const path = require('path');

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

const run = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('Connected to DB.');
    const template = await Template.findById('6a35b3cc030effc1bdcee55c');
    if (!template) {
      console.log('Template not found.');
      process.exit(1);
    }
    
    console.log('Compiling HTML...');
    console.time('compile-html');
    let compiledHtml = generatorService.compile(template.htmlCode, dummyData);
    console.timeEnd('compile-html');

    console.log('Compiling CSS...');
    console.time('compile-css');
    let compiledCss = generatorService.compile(template.cssCode, dummyData);
    console.timeEnd('compile-css');

    console.log('Compiling JS...');
    console.time('compile-js');
    let compiledJs = generatorService.compile(template.javascriptCode, dummyData);
    console.timeEnd('compile-js');

    console.log('Applying replacements...');
    console.time('replacements');
    compiledHtml = compiledHtml.replace(
      /<link[^>]*href=["']style\.css["'][^>]*>/i,
      `<style>\n${compiledCss}\n</style>`
    );
    if (!compiledHtml.includes('<style>')) {
      compiledHtml = compiledHtml.replace('</head>', `<style>\n${compiledCss}\n</style></head>`);
    }

    compiledHtml = compiledHtml.replace(
      /<script[^>]*src=["']script\.js["'][^>]*>([\s\S]*?)<\/script>/i,
      `<script>\n${compiledJs}\n</script>`
    );
    if (!compiledHtml.includes('<script>')) {
      compiledHtml = compiledHtml.replace('</body>', `<script>\n${compiledJs}\n</script></body>`);
    }
    console.timeEnd('replacements');

    const outputPath = path.join(__dirname, 'output.html');
    fs.writeFileSync(outputPath, compiledHtml);
    console.log('Saved compiled preview to:', outputPath);
    console.log('File size:', compiledHtml.length);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
