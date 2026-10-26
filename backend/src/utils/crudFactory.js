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
 *    (e.g. an array of related IDs turned into `connect`/`set`), or when
 *    creation needs a server-computed value (e.g. a sequential document
 *    code) that requires its own DB query. May return a Promise.
 *  - labScoped: boolean - records belong to a laboratory (`laboratoryId`).
 *    The list is filtered by `?laboratoryId=<id>`. A non-SUPER_ADMIN user bound to a lab
 *    (User.labId) is confined to that lab: they only see, create and edit
 *    its records, whatever laboratoryId the request carries.
 */

// The lab a user is confined to, or null if they may see every lab. Read
// from the DB rather than the JWT, which doesn't carry labId and would go
// stale when an admin reassigns the user.
async function confinedLabId(req) {
  if (!req.user || req.user.role === 'SUPER_ADMIN') return null;
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, select: { labId: true } });
  return user?.labId || null;
}

function crudFactory(modelName, opts = {}) {
  const model = prisma[modelName];
  if (!model) throw new Error(`Unknown Prisma model: ${modelName}`);
  const { include, searchFields = [], softDelete = false, orderBy = { createdAt: 'desc' }, buildData, labScoped = false } = opts;

  const baseWhere = () => (softDelete ? { deletedAt: null } : {});

  // Extra where-clause restricting a lab-bound user to their own lab's rows.
  const labWhere = async (req) => {
    if (!labScoped) return {};
    const labId = await confinedLabId(req);
    return labId ? { laboratoryId: labId } : {};
  };

  // Pins laboratoryId on the write payload for a lab-bound user.
  const scopeData = async (req, data) => {
    if (!labScoped) return data;
    const labId = await confinedLabId(req);
    return labId ? { ...data, laboratoryId: labId } : data;
  };

  // A lab-bound user may only edit/delete their own lab's rows; to them,
  // other labs' rows simply don't exist (404).
  const isOwned = async (req) => {
    const scope = await labWhere(req);
    if (!Object.keys(scope).length) return true;
    const owned = await model.findFirst({ where: { id: req.params.id, ...scope }, select: { id: true } });
    return Boolean(owned);
  };

  const list = asyncHandler(async (req, res) => {
    const { page = 1, pageSize = 20, q } = req.query;
    const take = Math.min(Number(pageSize) || 20, 3000);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = { ...baseWhere() };
    if (labScoped) {
      const confined = await confinedLabId(req);
      const requested = req.query.laboratoryId;
      if (confined) where.laboratoryId = confined;
      else if (requested) where.laboratoryId = String(requested);
    }
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
      where: { id: req.params.id, ...baseWhere(), ...(await labWhere(req)) },
      include,
    });
    if (!item) return res.status(404).json({ error: 'Ma\'lumot topilmadi.' });
    res.json(item);
  });

  const create = asyncHandler(async (req, res) => {
    const built = buildData ? await buildData(req.body, { isUpdate: false }) : req.body;
    const data = await scopeData(req, built);
    const item = await model.create({ data, include });
    res.status(201).json(item);
  });

  const update = asyncHandler(async (req, res) => {
    if (!(await isOwned(req))) return res.status(404).json({ error: 'Ma\'lumot topilmadi.' });
    const built = buildData ? await buildData(req.body, { isUpdate: true }) : req.body;
    const data = await scopeData(req, built);
    const item = await model.update({
      where: { id: req.params.id },
      data,
      include,
    });
    res.json(item);
  });

  const remove = asyncHandler(async (req, res) => {
    if (!(await isOwned(req))) return res.status(404).json({ error: 'Ma\'lumot topilmadi.' });
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
