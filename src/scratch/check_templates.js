const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const Template = require('../models/Template');
const TemplateCategory = require('../models/TemplateCategory');

const checkTemplates = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error('MONGODB_URI is not set');
      process.exit(1);
    }
    await mongoose.connect(dbUri);
    console.log('Connected to database.');

    const templates = await Template.find({}).populate('category');
    console.log(`Found ${templates.length} templates:`);
    templates.forEach(t => {
      console.log(`- Name: "${t.name}"`);
      console.log(`  Slug: "${t.slug}"`);
      console.log(`  Category: "${t.category ? t.category.name : 'None'}"`);
      console.log(`  Created By: ${t.createdBy}`);
      console.log('--------------------------------------------------');
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkTemplates();
