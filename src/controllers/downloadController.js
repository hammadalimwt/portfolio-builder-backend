const portfolioService = require('../services/portfolioService');
const templateService = require('../services/templateService');
const generatorService = require('../services/generatorService');
const downloadRepository = require('../repositories/downloadRepository');
const { getPaginationOptions, formatPaginationResult } = require('../utilities/paginationHelper');
const { sendSuccess } = require('../utilities/responseHelper');
const AppError = require('../utilities/AppError');
const asyncHandler = require('../utilities/asyncHandler');
const useragent = require('useragent');

const generateZip = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  const userId = req.user.id;

  // 1. Fetch portfolio and verify ownership
  const portfolio = await portfolioService.getPortfolioById(portfolioId, userId);
  
  // 2. Fetch associated template
  const template = await templateService.getTemplateById(portfolio.templateId);

  // 3. Generate ZIP buffer in memory
  const buffer = await generatorService.generateZipBuffer(portfolio, template);

  // 4. Save locally if not on serverless (optional, helper handles checks internally)
  const localRelativePath = generatorService.writeLocalZip(portfolioId, buffer);

  // 5. Generate download URL (fully compatible with Vercel)
  const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  const downloadUrl = `${baseUrl}/api/v1/generator/download/${portfolioId}`;

  // 6. Update portfolio status
  await portfolioService.markDownloaded(portfolioId, userId, localRelativePath || downloadUrl);

  return sendSuccess(res, 'ZIP generated successfully.', {
    downloadUrl,
    localPath: localRelativePath
  });
});

const downloadZip = asyncHandler(async (req, res) => {
  const { portfolioId } = req.params;
  
  // Fetch portfolio (we bypass owner check here to allow download url to be hit, 
  // or we can verify via token. Since we want it easily accessible, we allow it, 
  // but let's double check if we need authentication. The specifications say 
  // 'Download generated ZIP files' is a USER permission, so let's verify if req.user 
  // is present (since we can put this route behind protect middleware).
  // Yes! The route is `/generator/download/:portfolioId` and will be behind protect.
  const userId = req.user.id;
  const portfolio = await portfolioService.getPortfolioById(portfolioId, userId);
  const template = await templateService.getTemplateById(portfolio.templateId);

  // Compile ZIP
  const buffer = await generatorService.generateZipBuffer(portfolio, template);

  // Track download analytics
  const rawUserAgent = req.headers['user-agent'] || '';
  const agent = useragent.parse(rawUserAgent);
  
  // Capture real client IP (handling reverse proxies like Vercel/Cloudflare)
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
  
  const deviceInfo = {
    os: agent.os.toString(),
    browser: agent.toAgent(),
    device: agent.device.toString()
  };

  // Record Download History
  await downloadRepository.create({
    userId,
    portfolioId,
    templateId: template._id,
    ipAddress,
    userAgent: rawUserAgent,
    deviceInfo
  });

  // Increment template downloads
  template.totalDownloads += 1;
  await template.save();

  // Send ZIP attachment
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="portfolio-${portfolio._id}.zip"`);
  return res.send(buffer);
});

const getDownloadHistory = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = getPaginationOptions(req.query);

  // Filter history based on role (users only see their own, admins see all)
  const filter = {};
  if (req.user.role !== 'ADMIN') {
    filter.userId = req.user.id;
  } else if (req.query.userId) {
    filter.userId = req.query.userId;
  }

  const history = await downloadRepository.findAll(filter, skip, limit, sort);
  const total = await downloadRepository.count(filter);

  const result = formatPaginationResult(total, page, limit, history);
  return sendSuccess(res, 'Download history retrieved successfully.', result);
});

const deleteDownloadHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const query = { _id: id };
  if (req.user.role !== 'ADMIN') {
    query.userId = userId;
  }

  const result = await require('../models/DownloadHistory').deleteOne(query);

  if (result.deletedCount === 0) {
    throw new AppError('Download history record not found or unauthorized access.', 404);
  }

  return sendSuccess(res, 'Download history record deleted successfully.');
});

module.exports = {
  generateZip,
  downloadZip,
  getDownloadHistory,
  deleteDownloadHistory
};
