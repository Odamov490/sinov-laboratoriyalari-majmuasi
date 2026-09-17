const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

// TestIndicator/Product themselves are plain crudFactory resources (see
// adminRoutes.js). This file covers the nested pieces the constructor page
// needs: a product's questions/options, and the indicator<->product
// assignments (baseline vs. conditional-on-an-option).

// Full product tree in one request, for the constructor page.
const getProductBuilder = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: {
      laboratory: true,
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } },
      },
      indicators: {
        include: { indicator: { include: { laboratory: true } }, conditionOption: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  });
  if (!product) return res.status(404).json({ error: 'Mahsulot topilmadi.' });
  res.json(product);
});

const createQuestion = asyncHandler(async (req, res) => {
  const { questionUz, questionRu, questionEn, order } = req.body;
  const item = await prisma.productQuestion.create({
    data: {
      productId: req.params.id,
      questionUz,
      questionRu,
      questionEn,
      order: Number(order) || 0,
    },
    include: { options: { orderBy: { order: 'asc' } } },
  });
  res.status(201).json(item);
});

const updateQuestion = asyncHandler(async (req, res) => {
  const { questionUz, questionRu, questionEn, order } = req.body;
  const item = await prisma.productQuestion.update({
    where: { id: req.params.questionId },
    data: {
      questionUz,
      questionRu,
      questionEn,
      order: order === undefined ? undefined : Number(order),
    },
    include: { options: { orderBy: { order: 'asc' } } },
  });
  res.json(item);
});

// Deleting a question cascades to its options and their indicator
// assignments at the database level (see migration 20260917120000).
const deleteQuestion = asyncHandler(async (req, res) => {
  await prisma.productQuestion.delete({ where: { id: req.params.questionId } });
  res.status(204).send();
});

const createOption = asyncHandler(async (req, res) => {
  const { labelUz, labelRu, labelEn, order } = req.body;
  const item = await prisma.productQuestionOption.create({
    data: {
      questionId: req.params.questionId,
      labelUz,
      labelRu,
      labelEn,
      order: Number(order) || 0,
    },
  });
  res.status(201).json(item);
});

const updateOption = asyncHandler(async (req, res) => {
  const { labelUz, labelRu, labelEn, order } = req.body;
  const item = await prisma.productQuestionOption.update({
    where: { id: req.params.optionId },
    data: { labelUz, labelRu, labelEn, order: order === undefined ? undefined : Number(order) },
  });
  res.json(item);
});

// Deleting an option cascades to its indicator assignments at the database
// level (see migration 20260917120000).
const deleteOption = asyncHandler(async (req, res) => {
  await prisma.productQuestionOption.delete({ where: { id: req.params.optionId } });
  res.status(204).send();
});

const listProductIndicators = asyncHandler(async (req, res) => {
  const items = await prisma.productIndicatorAssignment.findMany({
    where: { productId: req.params.id },
    include: { indicator: { include: { laboratory: true } }, conditionOption: { include: { question: true } } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(items);
});

const addProductIndicator = asyncHandler(async (req, res) => {
  const { indicatorId, conditionOptionId } = req.body;
  const item = await prisma.productIndicatorAssignment.create({
    data: {
      productId: req.params.id,
      indicatorId,
      conditionOptionId: conditionOptionId || null,
    },
    include: { indicator: true, conditionOption: { include: { question: true } } },
  });
  res.status(201).json(item);
});

const removeProductIndicator = asyncHandler(async (req, res) => {
  await prisma.productIndicatorAssignment.delete({ where: { id: req.params.assignmentId } });
  res.status(204).send();
});

module.exports = {
  getProductBuilder,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  createOption,
  updateOption,
  deleteOption,
  listProductIndicators,
  addProductIndicator,
  removeProductIndicator,
};
