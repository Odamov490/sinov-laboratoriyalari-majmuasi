const prisma = require('../config/prisma');
const { asyncHandler } = require('../middleware/errorHandler');

const getInfoPage = asyncHandler(async (req, res) => {
  const item = await prisma.infoPage.findUnique({ where: { slug: req.params.slug } });
  if (!item) return res.status(404).json({ error: "Sahifa topilmadi." });
  res.json(item);
});

const updateInfoPage = asyncHandler(async (req, res) => {
  const {
    titleUz, titleRu, titleEn,
    contentUz, contentRu, contentEn,
    document502Url, document43Url,
    guideTitleUz, guideTitleRu, guideTitleEn,
    guideContentUz, guideContentRu, guideContentEn,
    comparisonDeclarationUz, comparisonDeclarationRu, comparisonDeclarationEn,
    comparisonCertificateUz, comparisonCertificateRu, comparisonCertificateEn,
    faqUz, faqRu, faqEn,
  } = req.body;
  const data = {
    titleUz, titleRu, titleEn,
    contentUz, contentRu, contentEn,
    document502Url, document43Url,
    guideTitleUz, guideTitleRu, guideTitleEn,
    guideContentUz, guideContentRu, guideContentEn,
    comparisonDeclarationUz, comparisonDeclarationRu, comparisonDeclarationEn,
    comparisonCertificateUz, comparisonCertificateRu, comparisonCertificateEn,
    faqUz, faqRu, faqEn,
  };
  const item = await prisma.infoPage.upsert({
    where: { slug: req.params.slug },
    update: data,
    create: { slug: req.params.slug, ...data },
  });
  res.json(item);
});

module.exports = { getInfoPage, updateInfoPage };
