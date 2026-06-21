const userRepository = require('../repositories/userRepository');
const portfolioRepository = require('../repositories/portfolioRepository');
const downloadRepository = require('../repositories/downloadRepository');
const templateService = require('./templateService');
const logger = require('./loggerService');
const AppError = require('../utilities/AppError');

class AdminService {
  // User administration
  async getAllUsers(filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) {
    return await userRepository.findAll(filter, skip, limit, sort);
  }

  async getUsersCount(filter = {}) {
    return await userRepository.count(filter);
  }

  async getUserDetails(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  async updateUserStatus(id, status) {
    if (!['ACTIVE', 'BLOCKED'].includes(status)) {
      throw new AppError('Invalid status value.', 400);
    }
    const user = await userRepository.update(id, { status });
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    logger.info(`Admin updated status of User ${id} to ${status}`);
    return user;
  }

  async deleteUser(id) {
    const user = await userRepository.delete(id);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    logger.info(`Admin deleted User ${id}`);
    return user;
  }

  // Dashboard & Analytics
  async getDashboardStats() {
    const totalUsers = await userRepository.count();
    const activeUsers = await userRepository.count({ status: 'ACTIVE' });
    const blockedUsers = await userRepository.count({ status: 'BLOCKED' });

    const totalPortfolios = await portfolioRepository.count();
    const draftPortfolios = await portfolioRepository.count({ status: 'DRAFT' });
    const completedPortfolios = await portfolioRepository.count({ status: 'COMPLETED' });
    const downloadedPortfolios = await portfolioRepository.count({ status: 'DOWNLOADED' });

    const totalDownloads = await downloadRepository.count();

    const popularTemplates = await downloadRepository.getAggregatesByTemplate();

    const templateRepository = require('../repositories/templateRepository');
    const templatesCount = await templateRepository.count();

    const recentUsersRaw = await userRepository.findAll({}, 0, 5, { createdAt: -1 });
    const { userResponseDTO } = require('../dtos/auth.dto');
    const recentUsers = recentUsersRaw.map(u => userResponseDTO(u));

    return {
      usersCount: totalUsers,
      portfoliosCount: totalPortfolios,
      downloadsCount: totalDownloads,
      templatesCount,
      recentUsers,
      users: {
        total: totalUsers,
        active: activeUsers,
        blocked: blockedUsers
      },
      portfolios: {
        total: totalPortfolios,
        draft: draftPortfolios,
        completed: completedPortfolios,
        downloaded: downloadedPortfolios
      },
      downloads: {
        total: totalDownloads
      },
      popularTemplates
    };
  }
}

module.exports = new AdminService();
