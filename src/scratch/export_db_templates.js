const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Template = require('../models/Template');

const exportTemplates = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    if (!dbUri) {
      console.error('MONGODB_URI is not set');
      process.exit(1);
    }
    await mongoose.connect(dbUri);
    console.log('Connected to database.');

    const templates = await Template.find({});
    console.log(`Found ${templates.length} templates in database.`);

    const baseDir = path.join(__dirname, '../templates');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }

    for (const t of templates) {
      const tDir = path.join(baseDir, t.slug);
      if (!fs.existsSync(tDir)) {
        fs.mkdirSync(tDir, { recursive: true });
      }

      fs.writeFileSync(path.join(tDir, 'index.html'), t.htmlCode || '', 'utf8');
      fs.writeFileSync(path.join(tDir, 'style.css'), t.cssCode || '', 'utf8');
      fs.writeFileSync(path.join(tDir, 'script.js'), t.javascriptCode || '', 'utf8');
      console.log(`Exported template ${t.name} (${t.slug}) to ${tDir}`);
    }

    console.log('Export complete.');
    process.exit(0);
  } catch (err) {
    console.error('Error during template export:', err);
    process.exit(1);
  }
};

exportTemplates();
