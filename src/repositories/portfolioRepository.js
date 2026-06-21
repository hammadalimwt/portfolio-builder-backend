const Portfolio = require('../models/Portfolio');

class PortfolioRepository {
  async findById(id) {
    return await Portfolio.findById(id);
  }

  async findByIdAndUser(id, userId) {
    return await Portfolio.findOne({ _id: id, userId });
  }

  async create(portfolioData) {
    return await Portfolio.create(portfolioData);
  }

  async update(id, userId, updateData) {
    return await Portfolio.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async delete(id, userId) {
    return await Portfolio.findOneAndDelete({ _id: id, userId });
  }

  async findAll(filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) {
    return await Portfolio.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter = {}) {
    return await Portfolio.countDocuments(filter);
  }
}

module.exports = new PortfolioRepository();
