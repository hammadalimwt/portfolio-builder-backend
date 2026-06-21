const portfolioService = require('../services/portfolioService');
const { getPaginationOptions, formatPaginationResult } = require('../utilities/paginationHelper');
const { sendSuccess } = require('../utilities/responseHelper');
const { portfolioDetailDTO, portfolioListItemDTO } = require('../dtos/portfolio.dto');
const asyncHandler = require('../utilities/asyncHandler');

const createPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.createPortfolio(req.user.id, req.body);
  return sendSuccess(res, 'Portfolio created successfully.', { portfolio: portfolioDetailDTO(portfolio) }, 201);
});

const getPortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.getPortfolioById(req.params.id, req.user.id);
  return sendSuccess(res, 'Portfolio retrieved successfully.', { portfolio: portfolioDetailDTO(portfolio) });
});

const updatePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.updatePortfolio(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Portfolio updated successfully.', { portfolio: portfolioDetailDTO(portfolio) });
});

const deletePortfolio = asyncHandler(async (req, res) => {
  await portfolioService.deletePortfolio(req.params.id, req.user.id);
  return sendSuccess(res, 'Portfolio deleted successfully.');
});

const duplicatePortfolio = asyncHandler(async (req, res) => {
  const clone = await portfolioService.duplicatePortfolio(req.params.id, req.user.id);
  return sendSuccess(res, 'Portfolio duplicated successfully.', { portfolio: portfolioDetailDTO(clone) }, 201);
});

const listPortfolios = asyncHandler(async (req, res) => {
  const { skip, limit, page, sort } = getPaginationOptions(req.query);
  
  // Extract filters
  const filterParams = {
    search: req.query.search || '',
    status: req.query.status || '',
    portfolioType: req.query.portfolioType || ''
  };

  const portfolios = await portfolioService.getPortfolios(req.user.id, filterParams, skip, limit, sort);
  const total = await portfolioService.getPortfoliosCount(req.user.id, filterParams);

  const formatted = portfolios.map(p => portfolioListItemDTO(p));
  const result = formatPaginationResult(total, page, limit, formatted);

  return sendSuccess(res, 'Portfolios retrieved successfully.', result);
});

const saveDraft = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.saveDraft(req.params.id, req.user.id, req.body);
  return sendSuccess(res, 'Portfolio draft saved successfully.', { portfolio: portfolioDetailDTO(portfolio) });
});

const completePortfolio = asyncHandler(async (req, res) => {
  const portfolio = await portfolioService.completePortfolio(req.params.id, req.user.id);
  return sendSuccess(res, 'Portfolio marked as completed.', { portfolio: portfolioDetailDTO(portfolio) });
});

module.exports = {
  createPortfolio,
  getPortfolio,
  updatePortfolio,
  deletePortfolio,
  duplicatePortfolio,
  listPortfolios,
  saveDraft,
  completePortfolio
};
