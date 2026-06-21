const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');
const TemplateCategory = require('../models/TemplateCategory');
const User = require('../models/User');
const Portfolio = require('../models/Portfolio');

const replaceTemplate = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error('MONGODB_URI is not set');
      process.exit(1);
    }
    await mongoose.connect(dbUri);
    console.log('Connected to database.');

    // 1. Find Developer Category
    const devCategory = await TemplateCategory.findOne({ slug: 'developer' });
    if (!devCategory) {
      console.error('Developer category not found in database! Please run seed first.');
      process.exit(1);
    }

    // 2. Find Admin User to assign createdBy
    const adminUser = await User.findOne({ role: 'ADMIN' });
    const adminId = adminUser ? adminUser._id : new mongoose.Types.ObjectId('6a3319bfd06ca9dfd73337a2'); // fallback

    // 3. Read template files
    const templateDir = path.join(__dirname, '../templates/aether-tech-premium');
    const htmlCode = fs.readFileSync(path.join(templateDir, 'index.html'), 'utf8');
    const cssCode = fs.readFileSync(path.join(templateDir, 'style.css'), 'utf8');
    const javascriptCode = fs.readFileSync(path.join(templateDir, 'script.js'), 'utf8');

    console.log('Read index.html, style.css, and script.js successfully.');

    // 4. Create new template database entry (Aether Tech Premium)
    const newTemplate = await Template.findOneAndUpdate(
      { slug: 'aether-tech-premium' },
      {
        name: 'Aether Tech Premium',
        slug: 'aether-tech-premium',
        category: devCategory._id,
        description: 'A high-end, futuristic developer portfolio featuring a cybernetic HUD interface, centered rotating radar profile scans, a floating glassmorphic bottom navigation deck, server-rack timeline logs, and an interactive secure transmit terminal.',
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&auto=format&fit=crop',
        htmlCode,
        cssCode,
        javascriptCode,
        placeholders: [
          { name: 'Full Name', variable: 'personal.fullName', type: 'text' },
          { name: 'Professional Title', variable: 'personal.title', type: 'text' },
          { name: 'Bio Description', variable: 'personal.bio', type: 'textarea' },
          { name: 'Location Details', variable: 'personal.location', type: 'text' },
          { name: 'Contact Email', variable: 'personal.email', type: 'text' },
          { name: 'Phone Number', variable: 'personal.phone', type: 'text' },
          { name: 'Skills Tags List', variable: 'skills', type: 'array_string' },
          { name: 'Work Experiences', variable: 'experience', type: 'array_object' },
          { name: 'Education History', variable: 'education', type: 'array_object' },
          { name: 'Project Items', variable: 'projects', type: 'array_object' },
          { name: 'Certifications Node', variable: 'certificates', type: 'array_object' }
        ],
        status: 'ACTIVE',
        createdBy: adminId
      },
      { upsert: true, new: true }
    );
    console.log(`Successfully created/updated Aether Tech Premium template in database (ID: ${newTemplate._id})`);

    // 5. Update existing portfolios using the old Sigma MERN Developer template to use the new Aether Tech Premium
    const oldTemplate = await Template.findOne({ slug: 'mern-developer-sigma' });
    if (oldTemplate) {
      const updateResult = await Portfolio.updateMany(
        { templateId: oldTemplate._id },
        { $set: { templateId: newTemplate._id } }
      );
      console.log(`Updated ${updateResult.modifiedCount} portfolios from Sigma template to Aether template.`);

      // 6. Delete old Sigma MERN Developer template from database
      await Template.deleteOne({ _id: oldTemplate._id });
      console.log('Successfully deleted Sigma MERN Developer template from database.');
    } else {
      console.log('Sigma MERN Developer template not found in database (nothing to delete).');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during template replacement:', err);
    process.exit(1);
  }
};

replaceTemplate();
