const DownloadHistory = require('../models/DownloadHistory');

class DownloadRepository {
  async findById(id) {
    return await DownloadHistory.findById(id)
      .populate('userId', 'name email')
      .populate('portfolioId', 'title portfolioType')
      .populate('templateId', 'name slug');
  }

  async create(downloadData) {
    return await DownloadHistory.create(downloadData);
  }

  async findAll(filter = {}, skip = 0, limit = 10, sort = { downloadDate: -1 }) {
    return await DownloadHistory.find(filter)
      .populate('userId', 'name email')
      .populate('portfolioId', 'title portfolioType')
      .populate('templateId', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter = {}) {
    return await DownloadHistory.countDocuments(filter);
  }

  async getAggregatesByTemplate() {
    return await DownloadHistory.aggregate([
      {
        $group: {
          _id: '$templateId',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $lookup: {
          from: 'templates',
          localField: '_id',
          foreignField: '_id',
          as: 'template'
        }
      },
      {
        $unwind: '$template'
      },
      {
        $project: {
          _id: 1,
          count: 1,
          name: '$template.name',
          slug: '$template.slug'
        }
      }
    ]);
  }
}

module.exports = new DownloadRepository();
