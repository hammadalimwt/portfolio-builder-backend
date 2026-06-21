const User = require('../models/User');

class UserRepository {
  async findById(id) {
    return await User.findById(id);
  }

  // Fetch user including the hidden avatarPublicId (needed when replacing avatar)
  async findByIdWithAvatarId(id) {
    return await User.findById(id).select('+avatarPublicId');
  }

  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email });
    if (includePassword) {
      query.select('+password');
    }
    return await query;
  }

  async create(userData) {
    return await User.create(userData);
  }

  async update(id, updateData) {
    return await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
  }

  async delete(id) {
    return await User.findByIdAndDelete(id);
  }

  async findAll(filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) {
    return await User.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter = {}) {
    return await User.countDocuments(filter);
  }
}

module.exports = new UserRepository();
