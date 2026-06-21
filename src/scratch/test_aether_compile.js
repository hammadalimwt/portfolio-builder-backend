const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');
const generatorService = require('../services/generatorService');

const testCompile = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error('MONGODB_URI is not set');
      process.exit(1);
    }
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB database.');

    // 1. Fetch template
    const template = await Template.findOne({ slug: 'aether-tech-premium' });
    if (!template) {
      console.error('Template aether-tech-premium not found in database!');
      process.exit(1);
    }
    console.log(`Loaded template: ${template.name}`);

    // 2. Build mock portfolio data matching the schema
    const mockPortfolio = {
      title: 'Aether Flagship Test',
      portfolioType: 'Developer',
      personal: {
        fullName: 'Alex Mercer',
        title: 'Principal Systems Architect',
        bio: 'Cybernetic systems and fullstack pioneer with 8+ years of experience leading multi-disciplinary engineering teams. Specializing in distributed systems, web performance optimization, and premium user experience micro-animations.',
        location: 'Neo-Tokyo / SF',
        email: 'alex.mercer@aether.io',
        phone: '+1 (555) 901-4420',
        profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop'
      },
      socialLinks: {
        github: 'https://github.com/alex-mercer',
        linkedin: 'https://linkedin.com/in/alex-mercer',
        twitter: 'https://twitter.com/alex_mercer',
        instagram: 'https://instagram.com/alex_mercer'
      },
      skills: ['TypeScript', 'Node.js', 'React', 'GraphQL', 'Docker', 'Kubernetes', 'AWS', 'MongoDB', 'WebSockets', 'Tailwind CSS'],
      experience: [
        {
          company: 'Aether Cybernetics',
          position: 'Lead Architecture Engineer',
          startDate: '2024-01',
          endDate: 'Present',
          description: 'Spearheading development of distributed SaaS dashboard systems, cutting load speeds by 50% and designing animated visual layout panels using HTML5 canvas.'
        },
        {
          company: 'Vortex Technologies',
          position: 'Senior Fullstack Engineer',
          startDate: '2021-06',
          endDate: '2023-12',
          description: 'Built scalable API architectures serving 2M+ active daily requests. Engineered interactive micro-services using WebSockets and Node.js clusters.'
        }
      ],
      projects: [
        {
          name: 'Hyperion Analytics Platform',
          description: 'A futuristic analytics dashboard utilizing real-time SVG charting, high-frequency websocket feeds, and a micro-frontend architecture.',
          technologies: 'React, Tailwind CSS, Recharts, Node.js, WebSockets',
          image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop',
          githubLink: 'https://github.com/alex-mercer/hyperion',
          liveDemo: 'https://hyperion.aether.io'
        },
        {
          name: 'Project Chronos Simulation',
          description: 'A web-based 3D physics simulator built with custom canvas physics engine to map particle movements and user mouse-repel gravity models.',
          technologies: 'Vanilla JS, Canvas API, WebGL, HSL Color Math',
          image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400&auto=format&fit=crop',
          githubLink: 'https://github.com/alex-mercer/chronos',
          liveDemo: 'https://chronos.aether.io'
        }
      ]
    };

    // 3. Compile assets
    console.log('Compiling HTML, CSS, and JS components...');
    const compiledHtml = generatorService.compile(template.htmlCode, mockPortfolio);
    const compiledCss = generatorService.compile(template.cssCode, mockPortfolio);
    const compiledJs = generatorService.compile(template.javascriptCode, mockPortfolio);

    console.log(`HTML size: ${compiledHtml.length} bytes`);
    console.log(`CSS size: ${compiledCss.length} bytes`);
    console.log(`JS size: ${compiledJs.length} bytes`);

    // Verify Handlebars blocks got compiled
    if (compiledHtml.includes('{{#') || compiledHtml.includes('{{/')) {
      const matches = compiledHtml.match(/\{\{[#\/][^}]+\}\}/g);
      console.log('Uncompiled tags found:', matches);
      throw new Error('Compilation failed: Handlebars loops remained uncompiled in HTML.');
    }
    if (compiledHtml.includes('{{personal.')) {
      throw new Error('Compilation failed: Flattened placeholders remained uncompiled in HTML.');
    }
    console.log('Verification: All Handlebars block template tags were successfully resolved.');

    // 4. Generate ZIP archive
    console.log('Packaging compiled files into local ZIP...');
    const zipBuffer = await generatorService.generateZipBuffer(mockPortfolio, template);
    console.log(`ZIP buffer generated. Size: ${zipBuffer.length} bytes`);

    const outputZipPath = path.join(__dirname, 'aether-test.zip');
    fs.writeFileSync(outputZipPath, zipBuffer);
    console.log(`Successfully saved test zip to: ${outputZipPath}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Test compilation failed:', error);
    process.exit(1);
  }
};

testCompile();
