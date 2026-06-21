const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');

const updateTemplates = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error('MONGODB_URI is not set');
      process.exit(1);
    }
    await mongoose.connect(dbUri);
    console.log('Connected to database.');

    const templatesDir = path.join(__dirname, '../templates');
    const folders = fs.readdirSync(templatesDir).filter(f => fs.statSync(path.join(templatesDir, f)).isDirectory());

    console.log(`Found ${folders.length} template folders on disk.`);

    for (const folder of folders) {
      const htmlPath = path.join(templatesDir, folder, 'index.html');
      const cssPath = path.join(templatesDir, folder, 'style.css');
      const jsPath = path.join(templatesDir, folder, 'script.js');

      if (!fs.existsSync(htmlPath) || !fs.existsSync(cssPath)) {
        console.warn(`Skipping ${folder}: index.html or style.css missing.`);
        continue;
      }

      const htmlCode = fs.readFileSync(htmlPath, 'utf8');
      const cssCode = fs.readFileSync(cssPath, 'utf8');
      const javascriptCode = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';

      const res = await Template.findOneAndUpdate(
        { slug: folder },
        { htmlCode, cssCode, javascriptCode },
        { new: true }
      );

      if (res) {
        console.log(`Updated database template for ${res.name} (slug: ${folder})`);
      } else {
        console.log(`Warning: Template slug '${folder}' not found in database. Skipping update.`);
      }
    }

    console.log('Database templates update complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during template update:', err);
    process.exit(1);
  }
};

updateTemplates();
