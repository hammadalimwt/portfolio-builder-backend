const getPaginationOptions = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };

  return { page, limit, skip, sort };
};

const formatPaginationResult = (totalItems, page, limit, items) => {
  const totalPages = Math.ceil(totalItems / limit);
  return {
    items,
    pagination: {
      totalItems,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

module.exports = {
  getPaginationOptions,
  formatPaginationResult
};
