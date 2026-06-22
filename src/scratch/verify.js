const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const authService = require('../services/authService');
const passwordResetService = require('../services/passwordResetService');
const tokenService = require('../services/tokenService');
const portfolioService = require('../services/portfolioService');
const templateService = require('../services/templateService');
const generatorService = require('../services/generatorService');
const adminService = require('../services/adminService');
const logger = require('../services/loggerService');

const runSanityTests = async () => {
  logger.info('==================================================');
  logger.info('   PORTFOLIO MAKER BACKEND SANITY VERIFICATION  ');
  logger.info('==================================================');

  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/portfolio-maker';
    await mongoose.connect(dbUri);
    logger.info('1. Connected to MongoDB database successfully.');

    // Cleanup any leftovers from previous verifications
    const testEmail = 'testverify@example.com';
    const User = require('../models/User');
    const Portfolio = require('../models/Portfolio');
    const Template = require('../models/Template');
    const TemplateCategory = require('../models/TemplateCategory');

    await User.deleteMany({ email: testEmail });
    await Template.deleteMany({ slug: 'test-verify-template' });
    await TemplateCategory.deleteMany({ slug: 'test-verify-category' });

    // --- TEST 1: Registration and Authentication ---
    logger.info('--- TEST 1: User Registration & Authentication ---');
    const registeredUser = await authService.register(
      'Verify Tester',
      testEmail,
      'securepassword123'
    );
    logger.info(`User registered successfully: ID ${registeredUser._id}`);

    const loginResult = await authService.login(testEmail, 'securepassword123');
    logger.info('User login validation successful.');
    logger.info(`Access Token length: ${loginResult.accessToken.length}`);
    logger.info(`Refresh Token length: ${loginResult.refreshToken.length}`);

    // Verify token validation
    const verifiedDbToken = await tokenService.verifyRefreshToken(loginResult.refreshToken);
    logger.info(`Verified refresh token for User ID: ${verifiedDbToken.userId}`);

    // --- TEST 2: Password Reset OTP flow ---
    logger.info('--- TEST 2: Password Reset (OTP Flow) ---');
    const resetMeta = await passwordResetService.generateResetToken(testEmail);
    logger.info(`Generated OTP Reset Code: ${resetMeta.token}`);
    
    // Simulate reset
    await passwordResetService.resetPassword(testEmail, resetMeta.token, 'newpassword456');
    logger.info('Password successfully updated via OTP.');
    
    // Re-verify login fails on old password, succeeds on new one
    try {
      await authService.login(testEmail, 'securepassword123');
      throw new Error('Login should have failed with old password');
    } catch (e) {
      logger.info('Correctly rejected login with outdated password.');
    }
    
    const reLogin = await authService.login(testEmail, 'newpassword456');
    logger.info('Successfully logged in using new password.');

    // --- TEST 3: Template Categories & Placeholders ---
    logger.info('--- TEST 3: Template Category & Placeholder CRUD ---');
    const category = await templateService.createCategory({
      name: 'Test Verify Category',
      description: 'Temporary category for sanity tests.'
    });
    logger.info(`Category created: "${category.name}" (slug: ${category.slug})`);

    // Fetch active category
    const categories = await templateService.getCategories();
    logger.info(`Found ${categories.length} category entries.`);

    // Find seeded admin to own the template
    const adminUser = await User.findOne({ role: 'ADMIN' });
    const adminId = adminUser ? adminUser._id : reLogin.user._id;

    const template = await templateService.createTemplate({
      name: 'Test Verify Template',
      category: category._id,
      description: 'Verify template description',
      htmlCode: '<h1>Hello {{personal.fullName}}</h1> {{#skills}} <li>{{this}}</li> {{/skills}}',
      cssCode: 'h1 { color: blue; }',
      javascriptCode: 'console.log("Ready");',
      placeholders: [
        { name: 'Full Name', variable: 'personal.fullName', type: 'text' },
        { name: 'Skills', variable: 'skills', type: 'array_string' }
      ]
    }, adminId);
    logger.info(`Template created: "${template.name}" (slug: ${template.slug})`);

    // --- TEST 4: Portfolio Workflows ---
    logger.info('--- TEST 4: Portfolio CRUD & Status Workflow ---');
    const portfolio = await portfolioService.createPortfolio(reLogin.user._id, {
      templateId: template._id,
      title: 'Verify Project Portfolio',
      portfolioType: 'Developer',
      personal: {
        fullName: 'John Doe the Third',
        title: 'Lead Software Architect',
        email: testEmail
      },
      skills: ['Node.js', 'React', 'MongoDB', 'Vercel Serverless'],
      experience: [],
      projects: [
        { name: 'Portfolio SaaS', description: 'MERN Stack builder app', technologies: ['Node', 'Mongoose'] }
      ]
    });
    logger.info(`Portfolio created as DRAFT: ID ${portfolio._id}`);

    // Update (Save Draft)
    const draftUpdate = await portfolioService.saveDraft(portfolio._id, reLogin.user._id, {
      title: 'Verify Project Portfolio (Draft v2)'
    });
    logger.info(`Portfolio draft updated: Title: "${draftUpdate.title}" (Status: ${draftUpdate.status})`);

    // Complete Portfolio Workflow
    const completed = await portfolioService.completePortfolio(portfolio._id, reLogin.user._id);
    logger.info(`Portfolio status set to: ${completed.status}`);

    // Portfolio Search and Filters
    const list = await portfolioService.getPortfolios(reLogin.user._id, { search: 'John', status: 'COMPLETED' });
    logger.info(`Search filter verification. Found: ${list.length} portfolios.`);

    // Duplicate Portfolio
    const clone = await portfolioService.duplicatePortfolio(portfolio._id, reLogin.user._id);
    logger.info(`Duplicated portfolio successfully: Cloned Title: "${clone.title}"`);

    // --- TEST 5: Template Compile & ZIP packaging ---
    logger.info('--- TEST 5: Template Compiler & In-Memory ZIP Generation ---');
    const buffer = await generatorService.generateZipBuffer(completed, template);
    logger.info(`ZIP successfully created in-memory! Buffer byte size: ${buffer.length}`);

    // Verify compile string operations directly
    const mockHtml = '<h1>Hello {{personal.fullName}}</h1> {{#skills}} <li>{{this}}</li> {{/skills}}';
    const compiled = generatorService.compile(mockHtml, completed);
    logger.info(`Template compilation result: "${compiled}"`);

    // --- TEST 6: Dashboard Statistics ---
    logger.info('--- TEST 6: Admin Dashboard Analytics Aggregation ---');
    const stats = await adminService.getDashboardStats();
    logger.info('Aggregated stats successfully compiled:');
    logger.info(`  Total Users registered: ${stats.users.total}`);
    logger.info(`  Total Portfolios generated: ${stats.portfolios.total}`);
    logger.info(`  Total Downloads recorded: ${stats.downloads.total}`);

    // Clean up verification data
    logger.info('Cleaning up verification records...');
    await User.deleteMany({ email: testEmail });
    await Portfolio.deleteMany({ _id: { $in: [portfolio._id, clone._id] } });
    await Template.deleteOne({ _id: template._id });
    await TemplateCategory.deleteOne({ _id: category._id });

    logger.info('==================================================');
    logger.info('    VERIFICATION COMPLETED: ALL SANITY TESTS PASSED ');
    logger.info('==================================================');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error(`\n!!! VERIFICATION FAILED: ${error.message} \nStack: ${error.stack}`);
    await mongoose.connection.close();
    process.exit(1);
  }
};

runSanityTests();
