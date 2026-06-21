const templateListItemDTO = (template) => {
  if (!template) return null;
  return {
    id: template._id,
    name: template.name,
    slug: template.slug,
    category: template.category, // Can be populated
    description: template.description,
    thumbnail: template.thumbnail,
    status: template.status,
    totalDownloads: template.totalDownloads,
    placeholdersCount: template.placeholders?.length || 0,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
};

const templateDetailDTO = (template) => {
  if (!template) return null;
  return {
    id: template._id,
    name: template.name,
    slug: template.slug,
    category: template.category,
    description: template.description,
    thumbnail: template.thumbnail,
    htmlCode: template.htmlCode,
    cssCode: template.cssCode,
    javascriptCode: template.javascriptCode,
    placeholders: (template.placeholders || []).map(p => ({
      id: p._id,
      name: p.name,
      variable: p.variable,
      type: p.type
    })),
    status: template.status,
    totalDownloads: template.totalDownloads,
    createdBy: template.createdBy,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt
  };
};

module.exports = {
  templateListItemDTO,
  templateDetailDTO
};
