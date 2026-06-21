const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const logger = require('./loggerService');
const AppError = require('../utilities/AppError');

class GeneratorService {
  /**
   * Simple template compiler that replaces variables and loops
   * @param {string} templateCode HTML/CSS/JS template code containing placeholders
   * @param {object} data Portfolio data object
   * @returns {string} Compiled code
   */
  compile(templateCode, data) {
    if (!templateCode) return '';
    
    // Clone data to avoid mutating original
    const compiledData = JSON.parse(JSON.stringify(data || {}));
    if (!compiledData.personal) {
      compiledData.personal = {};
    }
    if (!compiledData.personal.profileImage) {
      compiledData.personal.profileImage = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80';
    }
    if (Array.isArray(compiledData.projects)) {
      compiledData.projects.forEach(p => {
        if (!p.image) {
          p.image = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80';
        }
      });
    }

    let output = templateCode;

    // 1. Compile loops: {{#variable}} ... {{/variable}}
    // Handles arrays of strings or arrays of objects (e.g. skills, experience, projects)
    const loopRegex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;
    output = output.replace(loopRegex, (match, key, content) => {
      const list = compiledData[key];
      if (!Array.isArray(list) || list.length === 0) {
        return '';
      }

      return list.map(item => {
        let itemHtml = content;
        if (typeof item === 'string') {
          // Replace {{this}} with the item string (e.g. skills array of strings)
          itemHtml = itemHtml.replace(/\{\{this\}\}/g, item);
        } else if (typeof item === 'object' && item !== null) {
          // Replace {{property}} with item value
          Object.keys(item).forEach(propKey => {
            let val = item[propKey];
            
            // Format array properties within objects (like project technologies array)
            if (Array.isArray(val)) {
              val = val.join(', ');
            }
            
            const propRegex = new RegExp(`\\{\\{${propKey}\\}\\}`, 'g');
            itemHtml = itemHtml.replace(propRegex, val !== undefined && val !== null ? val : '');
          });
        }
        return itemHtml;
      }).join('');
    });

    // 2. Compile flat fields (e.g. {{personal.fullName}}, {{socialLinks.github}})
    const flatRegex = /\{\{([\w.]+)\}\}/g;
    output = output.replace(flatRegex, (match, pathStr) => {
      const parts = pathStr.split('.');
      let current = compiledData;
      for (let i = 0; i < parts.length; i++) {
        if (current === undefined || current === null) {
          return '';
        }
        current = current[parts[i]];
      }
      return current !== undefined && current !== null ? current : '';
    });

    return output;
  }

  /**
   * Generates a zip buffer for the portfolio
   * @param {object} portfolio Portfolio document
   * @param {object} template Template document
   * @returns {Promise<Buffer>} ZIP buffer
   */
  async generateZipBuffer(portfolio, template) {
    try {
      const zip = new JSZip();

      // Clone portfolio data to mutate image paths for the compilation context
      const portfolioData = JSON.parse(JSON.stringify(portfolio));
      
      const imagesFolder = zip.folder('images');
      
      // Helper function to process image (Base64 or URL) and add to ZIP
      const processImage = async (imageSource, filenamePrefix) => {
        if (!imageSource) return null;
        
        // Handle Base64 Data URIs
        if (imageSource.startsWith('data:image/')) {
          const match = imageSource.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
          if (match) {
            let ext = match[1];
            if (ext === 'jpeg') ext = 'jpg';
            const data = match[2];
            const buffer = Buffer.from(data, 'base64');
            const relativePath = `images/${filenamePrefix}.${ext}`;
            imagesFolder.file(`${filenamePrefix}.${ext}`, buffer);
            return relativePath;
          }
        }
        
        // Handle Remote HTTP/HTTPS URLs
        if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
          try {
            const response = await fetch(imageSource, { signal: AbortSignal.timeout(5000) });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              
              const contentType = response.headers.get('content-type');
              let ext = 'jpg';
              if (contentType) {
                const typeMatch = contentType.match(/image\/([a-zA-Z0-9+]+)/);
                if (typeMatch) {
                  ext = typeMatch[1];
                  if (ext === 'jpeg') ext = 'jpg';
                }
              } else {
                // Fallback to URL extension parsing
                const urlParts = imageSource.split(/[#?]/)[0].split('.');
                const lastPart = urlParts[urlParts.length - 1];
                if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(lastPart.toLowerCase())) {
                  ext = lastPart.toLowerCase();
                  if (ext === 'jpeg') ext = 'jpg';
                }
              }
              
              const relativePath = `images/${filenamePrefix}.${ext}`;
              imagesFolder.file(`${filenamePrefix}.${ext}`, buffer);
              return relativePath;
            }
          } catch (err) {
            logger.warn(`Failed to download image ${imageSource}: ${err.message}`);
          }
        }
        
        return null;
      };

      // 1. Process profile image
      if (!portfolioData.personal) {
        portfolioData.personal = {};
      }
      if (!portfolioData.personal.profileImage) {
        portfolioData.personal.profileImage = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&h=256&q=80';
      }
      const localPath = await processImage(portfolioData.personal.profileImage, 'profile');
      if (localPath) {
        portfolioData.personal.profileImage = localPath;
      }

      // 2. Process project images
      if (Array.isArray(portfolioData.projects)) {
        for (let i = 0; i < portfolioData.projects.length; i++) {
          const project = portfolioData.projects[i];
          if (!project.image) {
            project.image = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80';
          }
          const localPath = await processImage(project.image, `project-${i}`);
          if (localPath) {
            project.image = localPath;
          }
        }
      }

      // Compile templates using the localized portfolio data
      const compiledHtml = this.compile(template.htmlCode, portfolioData);
      const compiledCss = this.compile(template.cssCode, portfolioData);
      const compiledJs = this.compile(template.javascriptCode, portfolioData);

      // Add files to zip
      zip.file('index.html', compiledHtml);
      zip.file('style.css', compiledCss);
      zip.file('script.js', compiledJs);

      // Generate buffer
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      return buffer;
    } catch (error) {
      logger.error(`Zip Generation Error: ${error.message}`);
      throw new AppError('Failed to generate portfolio files zip.', 500);
    }
  }

  /**
   * Write ZIP file locally for local development setup (ignored on Vercel)
   * @param {string} portfolioId Portfolio ID
   * @param {Buffer} buffer Zip file buffer
   * @returns {string|null} local filepath or null if serverless
   */
  writeLocalZip(portfolioId, buffer) {
    if (process.env.VERCEL) {
      // Don't write to disk in serverless vercel
      return null;
    }

    try {
      const publicDir = path.join(__dirname, '../public');
      const downloadsDir = path.join(publicDir, 'downloads');

      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir);
      }
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir);
      }

      const filename = `portfolio-${portfolioId}-${Date.now()}.zip`;
      const filepath = path.join(downloadsDir, filename);

      fs.writeFileSync(filepath, buffer);
      logger.info(`Successfully saved portfolio ZIP locally: ${filepath}`);
      return `/public/downloads/${filename}`;
    } catch (error) {
      logger.warn(`Failed to write local ZIP to disk (safe to ignore if on cloud): ${error.message}`);
      return null;
    }
  }
}

module.exports = new GeneratorService();
