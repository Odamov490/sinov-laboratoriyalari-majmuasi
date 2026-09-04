const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Builds standard list/get/create/update/remove handlers for a Prisma model.
 * @param {string} modelName - Prisma client model property, e.g. 'laboratory'
 * @param {object} opts
 *  - include: default relations to include
 *  - searchFields: string[] fields to apply "q" search across (case-insensitive contains)
 *  - softDelete: boolean - if true, DELETE sets deletedAt instead of removing row
 *  - orderBy: default ordering
 *  - buildData(body, { isUpdate }): optional transform from req.body to the
 *    Prisma `data` payload — needed when a field must become a nested write
 *    (e.g. an array of related IDs turned into `connect`/`set`)
 */
function crudFactory(modelName, opts = {}) {
  const model = prisma[modelName];
  if (!model) throw new Error(`Unknown Prisma model: ${modelName}`);
  const { include, searchFields = [], softDelete = false, orderBy = { createdAt: 'desc' }, buildData } = opts;

  const baseWhere = () => (softDelete ? { deletedAt: null } : {});

  const list = asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 20, q } = req.query;
    const take = Math.min(Number(pageSize) || 20, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = { ...baseWhere() };
    if (q && searchFields.length) {
      where.OR = searchFields.map((field) => ({
        [field]: { contains: q, mode: 'insensitive' },
      }));
    }

    const [items, total] = await Promise.all([
      model.findMany({ where, include, orderBy, skip, take }),
      model.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), pageSize: take });
  });

  const getOne = asyncHandler(async (req, res) => {
    const item = await model.findFirst({
      where: { id: req.params.id, ...baseWhere() },
      include,
    });
    if (!item) return res.status(404).json({ error: 'Ma\'lumot topilmadi.' });
    res.json(item);
  });

  const create = asyncHandler(async (req, res) => {
    const data = buildData ? buildData(req.body, { isUpdate: false }) : req.body;
    const item = await model.create({ data, include });
    res.status(201).json(item);
  });

  const update = asyncHandler(async (req, res) => {
    const data = buildData ? buildData(req.body, { isUpdate: true }) : req.body;
    const item = await model.update({
      where: { id: req.params.id },
      data,
      include,
    });
    res.json(item);
  });

  const remove = asyncHandler(async (req, res) => {
    if (softDelete) {
      await model.update({ where: { id: req.params.id }, data: { deletedAt: new Date() } });
    } else {
      await model.delete({ where: { id: req.params.id } });
    }
    res.status(204).send();
  });

  return { list, getOne, create, update, remove };
}

module.exports = crudFactory;
