const templateRepository = require('../repositories/templateRepository');
const AppError = require('../utilities/AppError');
const logger = require('./loggerService');

class TemplateService {
  // Public APIs
  async getPublicTemplates(filter = {}, skip = 0, limit = 10, sort = { totalDownloads: -1 }) {
    const activeFilter = { ...filter, status: 'ACTIVE' };
    return await templateRepository.findAll(activeFilter, skip, limit, sort);
  }

  async getPublicTemplatesCount(filter = {}) {
    const activeFilter = { ...filter, status: 'ACTIVE' };
    return await templateRepository.count(activeFilter);
  }

  async getPopularTemplates(limit = 5) {
    return await templateRepository.findAll({ status: 'ACTIVE' }, 0, limit, { totalDownloads: -1 });
  }

  async getTemplateById(id, activeOnly = false) {
    const template = await templateRepository.findById(id);
    if (!template) {
      throw new AppError('Template not found.', 404);
    }
    if (activeOnly && template.status === 'INACTIVE') {
      throw new AppError('This template is currently inactive.', 400);
    }
    return template;
  }

  // Categories CRUD
  async getCategories(filter = {}) {
    return await templateRepository.findAllCategories(filter);
  }

  async getCategoryById(id) {
    const cat = await templateRepository.findCategoryById(id);
    if (!cat) throw new AppError('Category not found.', 404);
    return cat;
  }

  async createCategory(categoryData) {
    const slug = categoryData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await templateRepository.findCategoryBySlug(slug);
    if (existing) {
      throw new AppError('Category with a similar name already exists.', 400);
    }
    return await templateRepository.createCategory({ ...categoryData, slug });
  }

  async updateCategory(id, updateData) {
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await templateRepository.findCategoryBySlug(updateData.slug);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Category with a similar name already exists.', 400);
      }
    }
    const category = await templateRepository.updateCategory(id, updateData);
    if (!category) throw new AppError('Category not found.', 404);
    return category;
  }

  async deleteCategory(id) {
    // Check if templates exist in this category
    const templatesCount = await templateRepository.count({ category: id });
    if (templatesCount > 0) {
      throw new AppError('Cannot delete category. It has templates associated with it.', 400);
    }
    const deleted = await templateRepository.deleteCategory(id);
    if (!deleted) throw new AppError('Category not found.', 404);
    return deleted;
  }

  // Admin Template CRUD
  async createTemplate(templateData, adminId) {
    const slug = templateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const existing = await templateRepository.findBySlug(slug);
    if (existing) {
      throw new AppError('Template with this name already exists.', 400);
    }
    
    // Check category exists
    const category = await templateRepository.findCategoryById(templateData.category);
    if (!category) {
      throw new AppError('Invalid category ID.', 400);
    }

    return await templateRepository.create({
      ...templateData,
      slug,
      createdBy: adminId
    });
  }

  async updateTemplate(id, updateData) {
    if (updateData.name) {
      updateData.slug = updateData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const existing = await templateRepository.findBySlug(updateData.slug);
      if (existing && existing._id.toString() !== id) {
        throw new AppError('Template with this name already exists.', 400);
      }
    }
    if (updateData.category) {
      const category = await templateRepository.findCategoryById(updateData.category);
      if (!category) throw new AppError('Invalid category ID.', 400);
    }

    const template = await templateRepository.update(id, updateData);
    if (!template) throw new AppError('Template not found.', 404);
    return template;
  }

  async deleteTemplate(id) {
    const deleted = await templateRepository.delete(id);
    if (!deleted) throw new AppError('Template not found.', 404);
    return deleted;
  }

  // Admin Placeholders management
  async addPlaceholder(templateId, placeholderData) {
    const template = await this.getTemplateById(templateId);
    
    // Check if variable already exists
    const exists = template.placeholders.some(p => p.variable === placeholderData.variable);
    if (exists) {
      throw new AppError(`Placeholder variable "${placeholderData.variable}" already exists.`, 400);
    }

    template.placeholders.push(placeholderData);
    await template.save();
    return template;
  }

  async updatePlaceholders(templateId, placeholdersArray) {
    const template = await this.getTemplateById(templateId);
    template.placeholders = placeholdersArray;
    await template.save();
    return template;
  }
}

module.exports = new TemplateService();
