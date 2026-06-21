const Template = require('../models/Template');
const TemplateCategory = require('../models/TemplateCategory');

class TemplateRepository {
  async findById(id) {
    return await Template.findById(id).populate('category');
  }

  async findBySlug(slug) {
    return await Template.findOne({ slug }).populate('category');
  }

  async create(templateData) {
    return await Template.create(templateData);
  }

  async update(id, updateData) {
    return await Template.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    }).populate('category');
  }

  async delete(id) {
    return await Template.findByIdAndDelete(id);
  }

  async findAll(filter = {}, skip = 0, limit = 10, sort = { createdAt: -1 }) {
    return await Template.find(filter)
      .populate('category')
      .sort(sort)
      .skip(skip)
      .limit(limit);
  }

  async count(filter = {}) {
    return await Template.countDocuments(filter);
  }

  // Categories
  async findCategoryById(id) {
    return await TemplateCategory.findById(id);
  }

  async findCategoryBySlug(slug) {
    return await TemplateCategory.findOne({ slug });
  }

  async createCategory(categoryData) {
    return await TemplateCategory.create(categoryData);
  }

  async updateCategory(id, updateData) {
    return await TemplateCategory.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true
    });
  }

  async deleteCategory(id) {
    return await TemplateCategory.findByIdAndDelete(id);
  }

  async findAllCategories(filter = {}) {
    return await TemplateCategory.find(filter).sort({ name: 1 });
  }
}

module.exports = new TemplateRepository();
