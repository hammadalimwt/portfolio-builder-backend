const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const dns = require('dns');
const fs = require('fs');
const path = require('path');

// Programmatically set DNS servers to Google and Cloudflare to resolve Atlas SRV records reliably
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {}

const User = require('./models/User');
const TemplateCategory = require('./models/TemplateCategory');
const Template = require('./models/Template');
const SystemConfig = require('./models/SystemConfig');
const logger = require('./services/loggerService');

const seedData = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      throw new Error('MONGODB_URI is not set in environment variables');
    }

    logger.info('Connecting to database for seeding...');
    await mongoose.connect(dbUri);
    logger.info('Database connected.');

    // 1. Safe Seeding System Configurations
    logger.info('Upserting System configurations...');
    let config = await SystemConfig.findOne({});
    if (!config) {
      config = await SystemConfig.create({
        allowRegistrations: true,
        maintenanceMode: false,
        maxUploadSize: 5242880, // 5MB
        defaultTheme: 'dark'
      });
    } else {
      config.allowRegistrations = true;
      config.maxUploadSize = 5242880;
      await config.save();
    }
    logger.info('System configurations upserted.');

    // 2. Safe Seeding Admin User
    logger.info('Upserting Admin user...');
    let admin = await User.findOne({ email: 'admin@portfoliomaker.com' });
    if (!admin) {
      admin = await User.create({
        name: 'System Admin',
        email: 'admin@portfoliomaker.com',
        password: 'adminpassword', // Will be hashed by User schema pre-save
        role: 'ADMIN',
        status: 'ACTIVE',
        emailVerified: true
      });
    }
    logger.info('Admin user verified.');

    // 3. Safe Seeding Template Categories (Developer, Designer, Freelancer, Student, Business)
    logger.info('Upserting Template Categories...');
    
    const categoriesData = [
      { name: 'Developer', slug: 'developer', desc: 'Futuristic HUD terminal views tailored for software developers and systems engineers.' },
      { name: 'Designer', slug: 'designer', desc: 'Minimalist creative portfolios displaying case studies, processes, galleries, and awards.' },
      { name: 'Freelancer', slug: 'freelancer', desc: 'Services and pricing landing pages equipped with tiers, package lists, and client reviews.' },
      { name: 'Student', slug: 'student', desc: 'Classic academic timelines detailing graduation milestones, volunteer logs, sports, and achievements.' },
      { name: 'Business', slug: 'business', desc: 'Corporate portals highlighting products, stats dashboard telemetry, executive profiles, and company summaries.' }
    ];

    const categoryModels = {};
    for (const cat of categoriesData) {
      const model = await TemplateCategory.findOneAndUpdate(
        { slug: cat.slug },
        {
          name: cat.name,
          slug: cat.slug,
          description: cat.desc,
          isActive: true
        },
        { upsert: true, new: true }
      );
      categoryModels[cat.slug] = model;
    }
    logger.info('All 5 Categories verified.');

    // 4. Safe Seeding Templates from templates directories
    logger.info('Upserting 5 Flagship Aether Templates...');

    const templatesToSeed = [
      {
        slug: 'aether-developer',
        name: 'Aether Developer',
        categorySlug: 'developer',
        description: 'Futuristic HUD space developer portfolio featuring custom canvas particle grids, rotating radar scans, and a secure command contact deck.',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=300&auto=format&fit=crop',
        placeholders: [
          { name: 'Full Name', variable: 'personal.fullName', type: 'text' },
          { name: 'Professional Title', variable: 'personal.title', type: 'text' },
          { name: 'Bio Description', variable: 'personal.bio', type: 'textarea' },
          { name: 'Location Details', variable: 'personal.location', type: 'text' },
          { name: 'Contact Email', variable: 'personal.email', type: 'text' },
          { name: 'Phone Number', variable: 'personal.phone', type: 'text' },
          { name: 'GitHub Link', variable: 'socialLinks.github', type: 'text' },
          { name: 'LinkedIn Link', variable: 'socialLinks.linkedin', type: 'text' },
          { name: 'Skills Tags List', variable: 'skills', type: 'array_string' },
          { name: 'Work Experiences', variable: 'experience', type: 'array_object' },
          { name: 'Education History', variable: 'education', type: 'array_object' },
          { name: 'Project Items', variable: 'projects', type: 'array_object' },
          { name: 'Certifications Node', variable: 'certificates', type: 'array_object' }
        ]
      },
      {
        slug: 'aether-designer',
        name: 'Aether Designer',
        categorySlug: 'designer',
        description: 'Elegant cream UI portfolio custom-tailored for UI/UX creators. Highlights design specialization, Behance/Dribbble networks, tools arrays, and visual case studies.',
        thumbnail: 'https://images.unsplash.com/photo-1541462608141-2ff586cc14f2?q=80&w=300&auto=format&fit=crop',
        placeholders: [
          { name: 'Full Name', variable: 'personal.fullName', type: 'text' },
          { name: 'Design Title', variable: 'personal.designTitle', type: 'text' },
          { name: 'Bio Description', variable: 'personal.bio', type: 'textarea' },
          { name: 'Location Details', variable: 'personal.location', type: 'text' },
          { name: 'Contact Email', variable: 'personal.email', type: 'text' },
          { name: 'Behance URL', variable: 'socialLinks.behance', type: 'text' },
          { name: 'Dribbble URL', variable: 'socialLinks.dribbble', type: 'text' },
          { name: 'Design Specialization', variable: 'personal.designSpecialization', type: 'text' },
          { name: 'Design Tools List', variable: 'toolsUsed', type: 'array_string' },
          { name: 'Design Projects', variable: 'designProjects', type: 'array_object' },
          { name: 'Design Process Steps', variable: 'designProcess', type: 'array_object' },
          { name: 'Awards Won', variable: 'awards', type: 'array_object' },
          { name: 'Testimonials', variable: 'testimonials', type: 'array_object' },
          { name: 'Education', variable: 'education', type: 'array_object' }
        ]
      },
      {
        slug: 'aether-freelancer',
        name: 'Aether Freelancer',
        categorySlug: 'freelancer',
        description: 'High-conversion service portal template featuring custom packages columns, client testimonial grids, and quick booking links.',
        thumbnail: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=300&auto=format&fit=crop',
        placeholders: [
          { name: 'Full Name', variable: 'personal.fullName', type: 'text' },
          { name: 'Freelancer Title', variable: 'personal.freelancerTitle', type: 'text' },
          { name: 'Bio Description', variable: 'personal.bio', type: 'textarea' },
          { name: 'Location Details', variable: 'personal.location', type: 'text' },
          { name: 'Contact Email', variable: 'personal.email', type: 'text' },
          { name: 'Upwork URL', variable: 'socialLinks.upwork', type: 'text' },
          { name: 'Fiverr URL', variable: 'socialLinks.fiverr', type: 'text' },
          { name: 'Skills Tags List', variable: 'skills', type: 'array_string' },
          { name: 'Services Offered', variable: 'servicesOffered', type: 'array_object' },
          { name: 'Pricing Packages', variable: 'pricingPackages', type: 'array_object' },
          { name: 'Client Projects', variable: 'clientProjects', type: 'array_object' },
          { name: 'Testimonials', variable: 'testimonials', type: 'array_object' },
          { name: 'Work Process Flow', variable: 'workProcess', type: 'array_object' }
        ]
      },
      {
        slug: 'aether-student',
        name: 'Aether Student',
        categorySlug: 'student',
        description: 'Classic CV timeline grid tailored for graduates. Focuses on academic program, sports activity, achievements, extracurriculars, and volunteer work logs.',
        thumbnail: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=300&auto=format&fit=crop',
        placeholders: [
          { name: 'Full Name', variable: 'personal.fullName', type: 'text' },
          { name: 'Academic Program', variable: 'personal.academicProgram', type: 'text' },
          { name: 'Institution Name', variable: 'personal.institution', type: 'text' },
          { name: 'Graduation Year', variable: 'personal.graduationYear', type: 'text' },
          { name: 'Bio Description', variable: 'personal.bio', type: 'textarea' },
          { name: 'Location Details', variable: 'personal.location', type: 'text' },
          { name: 'Contact Email', variable: 'personal.email', type: 'text' },
          { name: 'LinkedIn URL', variable: 'socialLinks.linkedin', type: 'text' },
          { name: 'Academic Skills', variable: 'skills', type: 'array_string' },
          { name: 'Achievements', variable: 'academicAchievements', type: 'array_string' },
          { name: 'Sports Activities', variable: 'sportsActivities', type: 'array_string' },
          { name: 'Extracurricular Activities', variable: 'extracurricularActivities', type: 'array_string' },
          { name: 'Volunteer Work', variable: 'volunteerWork', type: 'array_object' },
          { name: 'Projects', variable: 'projects', type: 'array_object' },
          { name: 'Education', variable: 'education', type: 'array_object' },
          { name: 'Certifications', variable: 'certificates', type: 'array_object' }
        ]
      },
      {
        slug: 'aether-business',
        name: 'Aether Business',
        categorySlug: 'business',
        description: 'Corporate dashboard style profile. Highlights corporate products, team members, client reviews, KPI telemetry details, and industry metrics.',
        thumbnail: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=300&auto=format&fit=crop',
        placeholders: [
          { name: 'Company Name', variable: 'personal.companyName', type: 'text' },
          { name: 'Business Owner', variable: 'personal.businessOwner', type: 'text' },
          { name: 'Industry Type', variable: 'personal.industry', type: 'text' },
          { name: 'Company Description', variable: 'personal.bio', type: 'textarea' },
          { name: 'Office Address', variable: 'personal.location', type: 'text' },
          { name: 'Contact Email', variable: 'personal.email', type: 'text' },
          { name: 'Contact Phone', variable: 'personal.phone', type: 'text' },
          { name: 'LinkedIn URL', variable: 'socialLinks.linkedin', type: 'text' },
          { name: 'Company Services', variable: 'services', type: 'array_object' },
          { name: 'Products Offered', variable: 'products', type: 'array_object' },
          { name: 'Team Members', variable: 'teamMembers', type: 'array_object' },
          { name: 'Testimonials', variable: 'testimonials', type: 'array_object' },
          { name: 'Business Statistics', variable: 'businessStatistics', type: 'array_object' }
        ]
      }
    ];

    for (const temp of templatesToSeed) {
      const templateDir = path.join(__dirname, 'templates', temp.slug);
      if (!fs.existsSync(templateDir)) {
        logger.error(`Template folder not found for ${temp.slug} under templates/`);
        continue;
      }

      const htmlCode = fs.readFileSync(path.join(templateDir, 'index.html'), 'utf8');
      const cssCode = fs.readFileSync(path.join(templateDir, 'style.css'), 'utf8');
      const javascriptCode = fs.readFileSync(path.join(templateDir, 'script.js'), 'utf8');

      const categoryModel = categoryModels[temp.categorySlug];
      if (!categoryModel) {
        logger.error(`Category not found for slug: ${temp.categorySlug}`);
        continue;
      }

      const upsertedTemplate = await Template.findOneAndUpdate(
        { slug: temp.slug },
        {
          name: temp.name,
          slug: temp.slug,
          category: categoryModel._id,
          description: temp.description,
          thumbnail: temp.thumbnail,
          htmlCode,
          cssCode,
          javascriptCode,
          placeholders: temp.placeholders,
          status: 'ACTIVE',
          createdBy: admin._id
        },
        { upsert: true, new: true }
      );
      logger.info(`Successfully seeded template: ${temp.slug} (ID: ${upsertedTemplate._id})`);
    }

    logger.info('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
