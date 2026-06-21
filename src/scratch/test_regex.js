const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const Template = require('../models/Template');

const run = async () => {
  try {
    const dbUri = process.env.MONGODB_URI;
    await mongoose.connect(dbUri);
    console.log('Connected.');
    const t = await Template.findOne({ slug: 'aether-tech-premium' });
    if (!t) {
      console.log('Template not found.');
      process.exit(1);
    }
    console.log('HTML size:', t.htmlCode.length);
    console.log('CSS size:', t.cssCode.length);
    console.log('JS size:', t.javascriptCode.length);
    
    let html = t.htmlCode;
    console.log('Replacing CSS...');
    console.time('css-replace');
    html = html.replace(
      /<link[^>]*href=["']style\.css["'][^>]*>/i,
      `<style>\n${t.cssCode}\n</style>`
    );
    console.timeEnd('css-replace');

    console.log('Replacing JS...');
    console.time('js-replace');
    html = html.replace(
      /<script[^>]*src=["']script\.js["'][^>]*>([\s\S]*?)<\/script>/i,
      `<script>\n${t.javascriptCode}\n</script>`
    );
    console.timeEnd('js-replace');
    
    console.log('Completed all replacements successfully!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
