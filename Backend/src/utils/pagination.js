export const getPagination = (req) => {
    const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
    const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
    const offset = (page - 1) * limit;

    const category = req.query.category ? Number(req.query.category) : null;
    const sortBy = req.query.sortby || "default";

    return { page, limit, offset, category, sortBy };
};
