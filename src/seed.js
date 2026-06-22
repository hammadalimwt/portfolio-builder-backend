const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const dns = require('dns');

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

    // 3. Safe Seeding Template Categories
    logger.info('Upserting Template Categories...');
    const devCategory = await TemplateCategory.findOneAndUpdate(
      { slug: 'developer' },
      {
        name: 'Developer',
        slug: 'developer',
        description: 'Clean, technical, and info-rich layouts for software engineers and developers.',
        isActive: true
      },
      { upsert: true, new: true }
    );

    const creativeCategory = await TemplateCategory.findOneAndUpdate(
      { slug: 'creative' },
      {
        name: 'Creative',
        slug: 'creative',
        description: 'Visually striking, image-focused grids for designer and artist portfolios.',
        isActive: true
      },
      { upsert: true, new: true }
    );

    const businessCategory = await TemplateCategory.findOneAndUpdate(
      { slug: 'business' },
      {
        name: 'Business',
        slug: 'business',
        description: 'Elegant portfolios for freelancer agencies, coaches, and consulting projects.',
        isActive: true
      },
      { upsert: true, new: true }
    );
    logger.info('Categories verified.');

    // 4. Safe Seeding Templates
    logger.info('Upserting Templates...');

    // ==========================================
    // Layout A: Developer Minimalist
    // ==========================================
    const devHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{personal.fullName}} | Portfolio</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">{{personal.fullName}}</div>
      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
      <nav id="navMenu">
        <a href="#about">About</a>
        <a href="#skills">Skills</a>
        <a href="#experience">Experience</a>
        <a href="#projects">Projects</a>
      </nav>
    </header>

    <section id="about" class="hero">
      <div class="hero-content">
        <div class="hero-text">
          <h1>Hi, I'm <span class="highlight">{{personal.fullName}}</span></h1>
          <p class="subtitle">{{personal.title}}</p>
          <p class="bio">{{personal.bio}}</p>
          <div class="meta-info">
            <span>📍 {{personal.location}}</span>
            <span>✉️ {{personal.email}}</span>
          </div>
          <div class="socials">
            <a href="{{socialLinks.github}}" target="_blank">GitHub</a>
            <a href="{{socialLinks.linkedin}}" target="_blank">LinkedIn</a>
            <a href="{{socialLinks.twitter}}" target="_blank">Twitter</a>
          </div>
        </div>
        <div class="hero-image">
          <img src="{{personal.profileImage}}" alt="{{personal.fullName}}" onerror="this.parentNode.style.display='none';">
        </div>
      </div>
    </section>

    <section id="skills" class="section">
      <h2>Technical Skills</h2>
      <ul class="skills-list">
        {{#skills}}
        <li class="skill-tag">{{this}}</li>
        {{/skills}}
      </ul>
    </section>

    <section id="experience" class="section">
      <h2>Work Experience</h2>
      <div class="experience-timeline">
        {{#experience}}
        <div class="exp-card">
          <div class="exp-header">
            <h3>{{position}}</h3>
            <span class="exp-date">{{startDate}} - {{endDate}}</span>
          </div>
          <p class="company">{{company}}</p>
          <p class="desc">{{description}}</p>
        </div>
        {{/experience}}
      </div>
    </section>

    <section id="projects" class="section">
      <h2>Featured Projects</h2>
      <div class="projects-grid">
        {{#projects}}
        <div class="project-card">
          <div class="project-image-wrapper">
            <img src="{{image}}" alt="{{name}}" onerror="this.parentNode.style.display='none';">
          </div>
          <div class="project-content">
            <h3>{{name}}</h3>
            <p>{{description}}</p>
            <p class="tech-stack"><strong>Technologies:</strong> {{technologies}}</p>
            <div class="links">
              <a href="{{githubLink}}" target="_blank">Source Code</a>
              <a href="{{liveDemo}}" target="_blank">Live Demo</a>
            </div>
          </div>
        </div>
        {{/projects}}
      </div>
    </section>

    <footer>
      <p>&copy; {{personal.fullName}} | Powered by Portfolio Maker</p>
    </footer>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

    const devCss = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: 'Outfit', sans-serif;
  background-color: #0f172a;
  color: #f8fafc;
  line-height: 1.6;
}
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 20px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30px 0;
  position: relative;
}
.logo {
  font-weight: 800;
  font-size: 1.5rem;
}
nav {
  display: flex;
  align-items: center;
}
nav a {
  color: #94a3b8;
  text-decoration: none;
  margin-left: 20px;
  font-weight: 600;
  transition: color 0.3s;
}
nav a:hover {
  color: #38bdf8;
}

/* Hamburger menu styles */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 100;
}
.menu-toggle .bar {
  width: 100%;
  height: 2px;
  background-color: #f8fafc;
  transition: all 0.3s ease;
}

/* Menu animations */
.menu-toggle.active .bar:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.menu-toggle.active .bar:nth-child(2) {
  opacity: 0;
}
.menu-toggle.active .bar:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

.hero {
  padding: 80px 0;
}
.hero-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
}
.hero-text {
  flex: 1;
}
.hero-image {
  flex-shrink: 0;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #1e293b;
  box-shadow: 0 10px 25px -5px rgba(56, 189, 248, 0.15);
}
.hero-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 15px;
  line-height: 1.1;
}
.highlight {
  background: linear-gradient(to right, #38bdf8, #818cf8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.subtitle {
  font-size: 1.8rem;
  color: #38bdf8;
  margin-bottom: 20px;
  font-weight: 600;
}
.bio {
  font-size: 1.2rem;
  color: #94a3b8;
  max-width: 700px;
  margin-bottom: 30px;
}
.meta-info {
  margin-bottom: 35px;
}
.meta-info span {
  margin-right: 25px;
  color: #94a3b8;
}
.socials a {
  color: #f8fafc;
  background-color: #1e293b;
  padding: 10px 20px;
  text-decoration: none;
  border-radius: 8px;
  margin-right: 15px;
  font-weight: 600;
  transition: all 0.3s;
  display: inline-block;
}
.socials a:hover {
  background-color: #38bdf8;
  transform: translateY(-2px);
}
.section {
  padding: 80px 0;
  border-top: 1px solid #1e293b;
}
h2 {
  font-size: 2.2rem;
  margin-bottom: 40px;
  background: linear-gradient(to right, #ffffff, #94a3b8);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.skills-list {
  display: flex;
  flex-wrap: wrap;
  list-style: none;
}
.skill-tag {
  background-color: #1e293b;
  color: #38bdf8;
  padding: 8px 16px;
  margin: 8px;
  border-radius: 20px;
  font-weight: 600;
  transition: transform 0.2s;
}
.skill-tag:hover {
  transform: translateY(-2px);
}
.exp-card {
  background-color: #1e293b;
  padding: 30px;
  border-radius: 12px;
  margin-bottom: 25px;
  transition: transform 0.3s;
}
.exp-card:hover {
  transform: translateX(5px);
}
.exp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}
.exp-date {
  color: #38bdf8;
  font-weight: 600;
}
.company {
  color: #94a3b8;
  font-weight: 600;
  margin-bottom: 15px;
}
.desc {
  color: #cbd5e1;
}
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}
.project-card {
  background-color: #1e293b;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s;
}
.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px -10px rgba(56, 189, 248, 0.3);
}
.project-image-wrapper {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
  background-color: #0b0f19;
}
.project-image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.project-content {
  padding: 25px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
}
.project-card h3 {
  margin-bottom: 15px;
  color: #f8fafc;
}
.project-card p {
  color: #94a3b8;
  margin-bottom: 15px;
  font-size: 0.95rem;
}
.tech-stack {
  font-size: 0.9rem;
  margin-bottom: 20px;
  color: #cbd5e1 !important;
}
.links a {
  color: #38bdf8;
  text-decoration: none;
  margin-right: 20px;
  font-weight: 600;
  transition: color 0.3s;
}
.links a:hover {
  color: #818cf8;
}
footer {
  text-align: center;
  padding: 40px 0;
  color: #475569;
  border-top: 1px solid #1e293b;
}

/* Responsiveness Media Queries */
@media (max-width: 768px) {
  header {
    padding: 20px 0;
  }
  .menu-toggle {
    display: flex;
  }
  nav {
    display: none;
    position: absolute;
    top: 70px;
    left: -20px;
    right: -20px;
    background-color: #0f172a;
    flex-direction: column;
    padding: 20px;
    border-bottom: 1px solid #1e293b;
    z-index: 99;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);
  }
  nav.active {
    display: flex;
  }
  nav a {
    margin: 10px 0;
    margin-left: 0;
    font-size: 1.1rem;
    width: 100%;
    text-align: center;
  }
  .hero {
    padding: 60px 0;
  }
  .hero-content {
    flex-direction: column-reverse;
    text-align: center;
    gap: 30px;
  }
  .hero-image {
    width: 180px;
    height: 180px;
  }
  h1 {
    font-size: 2.5rem;
  }
  .subtitle {
    font-size: 1.4rem;
  }
  .meta-info span {
    display: block;
    margin: 10px 0;
    margin-right: 0;
  }
  .socials a {
    margin-bottom: 10px;
  }
  .exp-header {
    flex-direction: column;
    gap: 5px;
  }
}`;

    const sharedJs = `const init = () => {
  // Mobile menu toggle
  const menuToggle = document.getElementById('menuToggle');
  const navMenu = document.getElementById('navMenu');

  if (menuToggle && navMenu) {
    menuToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });
  }

  // Smooth scroll for anchors
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
};
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}`;

    await Template.findOneAndUpdate(
      { slug: 'developer-minimalist' },
      {
        name: 'Developer Minimalist',
        slug: 'developer-minimalist',
        category: devCategory._id,
        description: 'A dark, technical template tailored for software engineers. Emphasizes profile description, technologies tags list, work experience milestones, and public repos.',
        thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=300&auto=format&fit=crop',
        htmlCode: devHtml,
        cssCode: devCss,
        javascriptCode: sharedJs,
        placeholders: [
          { name: 'Full Name', variable: 'personal.fullName', type: 'text' },
          { name: 'Professional Title', variable: 'personal.title', type: 'text' },
          { name: 'Bio Description', variable: 'personal.bio', type: 'textarea' },
          { name: 'Location Details', variable: 'personal.location', type: 'text' },
          { name: 'Contact Email', variable: 'personal.email', type: 'text' },
          { name: 'Skills Tags List', variable: 'skills', type: 'array_string' },
          { name: 'Work Experiences', variable: 'experience', type: 'array_object' },
          { name: 'Project Items', variable: 'projects', type: 'array_object' }
        ],
        status: 'ACTIVE',
        createdBy: admin._id
      },
      { upsert: true, new: true }
    );

    // ==========================================
    // Layout B: Creative Designer Grid
    // ==========================================
    const designHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{personal.fullName}} | Creative Portfolio</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="site-wrapper">
    <header>
      <div class="logo">/{{personal.fullName}}</div>
      <button class="menu-toggle" id="menuToggle" aria-label="Toggle Menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
      <nav id="navMenu">
        <a href="#work">Work</a>
        <a href="mailto:{{personal.email}}" class="contact-link">Let's Talk</a>
      </nav>
    </header>

    <section class="intro">
      <div class="intro-grid">
        <div class="intro-text">
          <div class="tag">Creative Explorer</div>
          <h1>{{personal.bio}}</h1>
        </div>
        <div class="intro-image">
          <img src="{{personal.profileImage}}" alt="{{personal.fullName}}" onerror="this.parentNode.style.display='none';">
        </div>
      </div>
      <div class="meta">
        <span>📍 Currently in {{personal.location}}</span>
        <span>🔗 Connect: <a href="{{socialLinks.instagram}}" target="_blank">Instagram</a> / <a href="{{socialLinks.linkedin}}" target="_blank">LinkedIn</a></span>
      </div>
    </section>

    <section id="work" class="work-section">
      <div class="grid-headline">Selected Projects</div>
      <div class="works-grid">
        {{#projects}}
        <div class="work-item">
          <div class="work-img-wrapper">
            <img src="{{image}}" alt="{{name}}" onerror="this.src='https://images.unsplash.com/photo-1541462608141-2ff586cc14f2?q=80&w=400&auto=format&fit=crop';">
          </div>
          <div class="work-info">
            <h3>{{name}}</h3>
            <span>{{technologies}}</span>
            <p>{{description}}</p>
          </div>
        </div>
        {{/projects}}
      </div>
    </section>

    <footer>
      <p>&copy; {{personal.fullName}} | Powered by Portfolio Maker</p>
    </footer>
  </div>
  <script src="script.js"></script>
</body>
</html>`;

    const designCss = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
body {
  font-family: 'Space Grotesk', sans-serif;
  background-color: #faf9f6;
  color: #1a1a1a;
  line-height: 1.5;
}
.site-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}
header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40px 0;
  border-bottom: 2px solid #1a1a1a;
  position: relative;
}
.logo {
  font-size: 1.8rem;
  font-weight: 700;
  letter-spacing: -1px;
}
nav {
  display: flex;
  align-items: center;
  gap: 30px;
}
nav a {
  color: #1a1a1a;
  text-decoration: none;
  font-weight: 600;
  font-size: 1.1rem;
  transition: color 0.2s;
}
nav a:hover {
  color: #e65c00;
}
.contact-link {
  background-color: #1a1a1a;
  color: #faf9f6 !important;
  padding: 12px 24px;
  border-radius: 30px;
  transition: all 0.2s;
  display: inline-block;
}
.contact-link:hover {
  background-color: #e65c00;
  transform: translateY(-2px);
}

/* Hamburger menu styles */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 100;
}
.menu-toggle .bar {
  width: 100%;
  height: 2px;
  background-color: #1a1a1a;
  transition: all 0.3s ease;
}

/* Menu animations */
.menu-toggle.active .bar:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}
.menu-toggle.active .bar:nth-child(2) {
  opacity: 0;
}
.menu-toggle.active .bar:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}

.intro {
  padding: 100px 0;
}
.intro-grid {
  display: grid;
  grid-template-columns: 2.2fr 1fr;
  gap: 60px;
  align-items: center;
  margin-bottom: 50px;
}
.intro-image {
  border: 2px solid #1a1a1a;
  border-radius: 6px;
  overflow: hidden;
  aspect-ratio: 1;
  background-color: #eee;
  box-shadow: 6px 6px 0px #1a1a1a;
}
.intro-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tag {
  text-transform: uppercase;
  font-size: 0.9rem;
  font-weight: 700;
  letter-spacing: 2px;
  color: #e65c00;
  margin-bottom: 20px;
}
h1 {
  font-size: 3.8rem;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -2px;
  margin-bottom: 0;
}
.meta {
  display: flex;
  justify-content: space-between;
  font-size: 1.1rem;
  color: #666;
  border-top: 1px solid #ddd;
  padding-top: 20px;
}
.meta a {
  color: #1a1a1a;
  text-decoration: none;
  font-weight: 600;
}
.meta a:hover {
  text-decoration: underline;
}
.work-section {
  padding: 60px 0;
}
.grid-headline {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 40px;
}
.works-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
}
.work-item {
  display: flex;
  flex-direction: column;
}
.work-img-wrapper {
  background-color: #eee;
  width: 100%;
  aspect-ratio: 4/3;
  overflow: hidden;
  border: 2px solid #1a1a1a;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 4px 4px 0px #1a1a1a;
  transition: all 0.3s ease;
}
.work-img-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s;
}
.work-item:hover .work-img-wrapper {
  box-shadow: 8px 8px 0px #e65c00;
  transform: translate(-4px, -4px);
}
.work-item:hover .work-img-wrapper img {
  transform: scale(1.03);
}
.work-info h3 {
  font-size: 1.5rem;
  margin-bottom: 5px;
}
.work-info span {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #e65c00;
  font-weight: 700;
}
.work-info p {
  color: #666;
  margin-top: 10px;
}
footer {
  text-align: center;
  padding: 80px 0 40px;
  color: #aaa;
  border-top: 2px solid #1a1a1a;
  margin-top: 100px;
}

/* Responsiveness Media Queries */
@media (max-width: 900px) {
  .site-wrapper {
    padding: 0 20px;
  }
  h1 {
    font-size: 3rem;
  }
  .intro-grid {
    gap: 40px;
  }
}

@media (max-width: 768px) {
  header {
    padding: 20px 0;
  }
  .menu-toggle {
    display: flex;
  }
  nav {
    display: none;
    position: absolute;
    top: 80px;
    left: -20px;
    right: -20px;
    background-color: #faf9f6;
    flex-direction: column;
    padding: 20px;
    border-bottom: 2px solid #1a1a1a;
    z-index: 99;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
    align-items: center;
    gap: 15px;
  }
  nav.active {
    display: flex;
  }
  nav a {
    margin: 5px 0;
    font-size: 1.2rem;
  }
  .intro {
    padding: 60px 0;
  }
  .intro-grid {
    grid-template-columns: 1fr;
    gap: 30px;
    text-align: center;
  }
  .intro-image {
    max-width: 250px;
    margin: 0 auto;
  }
  h1 {
    font-size: 2.2rem;
  }
  .meta {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  .works-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
}`;

    await Template.findOneAndUpdate(
      { slug: 'creative-designer-grid' },
      {
        name: 'Creative Designer Grid',
        slug: 'creative-designer-grid',
        category: creativeCategory._id,
        description: 'A light, modern, typography-centric layout with card blocks. Ideal for illustrators, UI/UX designers, and brand strategists.',
        thumbnail: 'https://images.unsplash.com/photo-1541462608141-2ff586cc14f2?q=80&w=300&auto=format&fit=crop',
        htmlCode: designHtml,
        cssCode: designCss,
        javascriptCode: sharedJs,
        placeholders: [
          { name: 'Full Name', variable: 'personal.fullName', type: 'text' },
          { name: 'Contact Email', variable: 'personal.email', type: 'text' },
          { name: 'Headline Bio', variable: 'personal.bio', type: 'textarea' },
          { name: 'Location Details', variable: 'personal.location', type: 'text' },
          { name: 'Instagram profile Link', variable: 'socialLinks.instagram', type: 'text' },
          { name: 'LinkedIn profile Link', variable: 'socialLinks.linkedin', type: 'text' },
          { name: 'Creative Portfolio Projects', variable: 'projects', type: 'array_object' }
        ],
        status: 'ACTIVE',
        createdBy: admin._id
      },
      { upsert: true, new: true }
    );

    logger.info('Templates verified and seeded successfully.');
    logger.info('Database seeding completed!');
    process.exit(0);
  } catch (error) {
    logger.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
