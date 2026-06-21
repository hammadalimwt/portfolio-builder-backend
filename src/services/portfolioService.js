const portfolioRepository = require('../repositories/portfolioRepository');
const templateService = require('./templateService');
const AppError = require('../utilities/AppError');
const logger = require('./loggerService');

class PortfolioService {
  async createPortfolio(userId, portfolioData) {
    // Validate template exists and is active
    await templateService.getTemplateById(portfolioData.templateId, true);
    
    const portfolio = await portfolioRepository.create({
      ...portfolioData,
      userId,
      status: 'DRAFT'
    });

    logger.info(`Portfolio created successfully: ID ${portfolio._id} for User ${userId}`);
    return portfolio;
  }

  async getPortfolioById(id, userId) {
    const portfolio = await portfolioRepository.findByIdAndUser(id, userId);
    if (!portfolio) {
      throw new AppError('Portfolio not found or unauthorized access.', 404);
    }
    return portfolio;
  }

  async updatePortfolio(id, userId, updateData) {
    // If templateId is changing, validate new template
    if (updateData.templateId) {
      await templateService.getTemplateById(updateData.templateId, true);
    }

    const portfolio = await portfolioRepository.update(id, userId, updateData);
    if (!portfolio) {
      throw new AppError('Portfolio not found or unauthorized access.', 404);
    }

    logger.info(`Portfolio updated: ID ${id} for User ${userId}`);
    return portfolio;
  }

  async deletePortfolio(id, userId) {
    const portfolio = await portfolioRepository.delete(id, userId);
    if (!portfolio) {
      throw new AppError('Portfolio not found or unauthorized access.', 404);
    }
    logger.info(`Portfolio deleted: ID ${id} for User ${userId}`);
    return portfolio;
  }

  async duplicatePortfolio(id, userId) {
    const original = await this.getPortfolioById(id, userId);
    
    // Create cloned object, removing _id and timestamps
    const cloneData = original.toObject();
    delete cloneData._id;
    delete cloneData.createdAt;
    delete cloneData.updatedAt;
    delete cloneData.zipPath;
    delete cloneData.generatedAt;
    
    cloneData.title = `Copy of ${cloneData.title}`;
    cloneData.status = 'DRAFT';

    const clone = await portfolioRepository.create(cloneData);
    logger.info(`Duplicated portfolio ${id} as new portfolio ${clone._id} for User ${userId}`);
    return clone;
  }

  // Search, Filter, Sort, Pagination
  async getPortfolios(userId, filterParams, skip = 0, limit = 10, sort = { createdAt: -1 }) {
    const filter = { userId };

    if (filterParams.status) {
      filter.status = filterParams.status;
    }
    if (filterParams.portfolioType) {
      filter.portfolioType = filterParams.portfolioType;
    }
    if (filterParams.search) {
      const searchRegex = new RegExp(filterParams.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { 'personal.fullName': searchRegex }
      ];
    }

    return await portfolioRepository.findAll(filter, skip, limit, sort);
  }

  async getPortfoliosCount(userId, filterParams) {
    const filter = { userId };

    if (filterParams.status) {
      filter.status = filterParams.status;
    }
    if (filterParams.portfolioType) {
      filter.portfolioType = filterParams.portfolioType;
    }
    if (filterParams.search) {
      const searchRegex = new RegExp(filterParams.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { 'personal.fullName': searchRegex }
      ];
    }

    return await portfolioRepository.count(filter);
  }

  // Workflows
  async saveDraft(id, userId, updateData) {
    const data = { ...updateData, status: 'DRAFT' };
    return await this.updatePortfolio(id, userId, data);
  }

  async completePortfolio(id, userId) {
    const portfolio = await this.getPortfolioById(id, userId);
    
    // Simple verification check before marking complete
    if (!portfolio.personal || !portfolio.personal.fullName) {
      throw new AppError('Portfolio personal information (fullName) must be provided to complete the portfolio.', 400);
    }

    portfolio.status = 'COMPLETED';
    await portfolio.save();
    logger.info(`Portfolio status set to COMPLETED: ID ${id}`);
    return portfolio;
  }

  async markDownloaded(id, userId, zipPath) {
    const portfolio = await this.getPortfolioById(id, userId);
    portfolio.status = 'DOWNLOADED';
    portfolio.zipPath = zipPath;
    portfolio.generatedAt = new Date();
    await portfolio.save();
    logger.info(`Portfolio marked as DOWNLOADED: ID ${id}`);
    return portfolio;
  }
}

module.exports = new PortfolioService();
