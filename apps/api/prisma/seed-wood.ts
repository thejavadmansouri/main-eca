import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🪵 Seeding Wood & Furniture Industry (FlexERP model) data...');

  // 1. یافتن یا ایجاد محصول تولیدی چوب (کابینت / کمد دیواری)
  let woodProduct = await prisma.product.findFirst({
    where: { sku: 'PRD-WOOD-CAB01' },
  });

  if (!woodProduct) {
    woodProduct = await prisma.product.create({
      data: {
        name: 'یونیت زمینی کابینت آشپزخانه هایگلاس (دو درب با کشو)',
        sku: 'PRD-WOOD-CAB01',
        description: 'کابینت MDF با روکش هایگلاس سفید براق و یراق‌آلات بلوم، نوار ۲ میلیمتر',
        unit: 'دست',
      },
    });
    console.log('✅ Created wood product:', woodProduct.name);
  }

  // 2. یافتن یا ایجاد فرمول ساخت (BOM)
  let bom = await prisma.billOfMaterials.findFirst({
    where: { productId: woodProduct.id },
  });

  if (!bom) {
    bom = await prisma.billOfMaterials.create({
      data: {
        code: 'BOM-WOOD-001',
        name: 'فرمول ساخت یونیت زمینی هایگلاس',
        productId: woodProduct.id,
        quantity: 1,
        unit: 'دست',
        version: 1,
        isActive: true,
      },
    });
    console.log('✅ Created BOM:', bom.code);
  }

  // 3. یافتن یا ایجاد سفارش تولید کارگاهی
  let prodOrder = await prisma.productionOrder.findFirst({
    where: { code: 'MO-1404-0001' },
  });

  if (!prodOrder) {
    prodOrder = await prisma.productionOrder.create({
      data: {
        code: 'MO-1404-0001',
        productId: woodProduct.id,
        bomId: bom.id,
        targetQuantity: 5,
        completedQuantity: 0,
        status: 'IN_PROGRESS',
        priority: 2,
        dueDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      },
    });
    console.log('✅ Created production order:', prodOrder.code);
  }

  // 4. ثبت قطعات دقیق برش و نوار PVC (Cutting List)
  const cuttingParts = [
    {
      partName: 'بدنه سمت راست یونیت',
      materialType: 'MDF ۱۶ میل سفید صابونی آرین سینا',
      lengthMm: 720,
      widthMm: 560,
      thicknessMm: 16,
      quantity: 5,
      grainDirection: 'LENGTHWISE',
      edgeL1: '2mm سفید',
      edgeL2: '1mm سفید',
      edgeW1: 'بدون نوار',
      edgeW2: 'بدون نوار',
      barcode: 'CUT-00001',
      isCut: true,
      isEdged: true,
      isCncDone: true,
      isAssembled: false,
      status: 'CNC_DONE',
      notes: 'شیار پشت‌بند ۸ میلیمتر با عمق ۵ میلیمتر در فاصله ۱۵ از لبه',
    },
    {
      partName: 'بدنه سمت چپ یونیت',
      materialType: 'MDF ۱۶ میل سفید صابونی آرین سینا',
      lengthMm: 720,
      widthMm: 560,
      thicknessMm: 16,
      quantity: 5,
      grainDirection: 'LENGTHWISE',
      edgeL1: '2mm سفید',
      edgeL2: '1mm سفید',
      edgeW1: 'بدون نوار',
      edgeW2: 'بدون نوار',
      barcode: 'CUT-00002',
      isCut: true,
      isEdged: true,
      isCncDone: false,
      isAssembled: false,
      status: 'EDGED',
      notes: 'سوراخ‌کاری ریل تاندوم‌باکس بلوم در ارتفاع ۴۰',
    },
    {
      partName: 'کف یونیت زمینی',
      materialType: 'MDF ۱۶ میل سفید صابونی',
      lengthMm: 868,
      widthMm: 560,
      thicknessMm: 16,
      quantity: 5,
      grainDirection: 'WIDTHWISE',
      edgeL1: '2mm سفید',
      edgeL2: 'بدون نوار',
      edgeW1: '1mm سفید',
      edgeW2: '1mm سفید',
      barcode: 'CUT-00003',
      isCut: true,
      isEdged: false,
      isCncDone: false,
      isAssembled: false,
      status: 'CUT',
      notes: 'سوراخ پایه رگلاژی در ۴ گوشه به فاصله ۵ سانتی‌متر',
    },
    {
      partName: 'درب چپ کابینت (هایگلاس ترک)',
      materialType: 'هایگلاس AGT کد ۶۰۱ سفید متالیک',
      lengthMm: 716,
      widthMm: 446,
      thicknessMm: 18,
      quantity: 5,
      grainDirection: 'LENGTHWISE',
      edgeL1: '2mm همرنگ متالیک',
      edgeL2: '2mm همرنگ متالیک',
      edgeW1: '2mm همرنگ متالیک',
      edgeW2: '2mm همرنگ متالیک',
      barcode: 'CUT-00004',
      isCut: false,
      isEdged: false,
      isCncDone: false,
      isAssembled: false,
      status: 'PENDING',
      notes: 'سوراخ لولا گازور آرام‌بند ۳۵ میلیمتر به فاصله ۱۰۰ از بالا و پایین',
    },
    {
      partName: 'درب راست کابینت (هایگلاس ترک)',
      materialType: 'هایگلاس AGT کد ۶۰۱ سفید متالیک',
      lengthMm: 716,
      widthMm: 446,
      thicknessMm: 18,
      quantity: 5,
      grainDirection: 'LENGTHWISE',
      edgeL1: '2mm همرنگ متالیک',
      edgeL2: '2mm همرنگ متالیک',
      edgeW1: '2mm همرنگ متالیک',
      edgeW2: '2mm همرنگ متالیک',
      barcode: 'CUT-00005',
      isCut: false,
      isEdged: false,
      isCncDone: false,
      isAssembled: false,
      status: 'PENDING',
      notes: 'سوراخ لولا گازور آرام‌بند ۳۵ میلیمتر',
    },
  ];

  for (const part of cuttingParts) {
    await prisma.cuttingListItem.upsert({
      where: { barcode: part.barcode },
      update: {
        partName: part.partName,
        materialType: part.materialType,
        lengthMm: part.lengthMm,
        widthMm: part.widthMm,
        thicknessMm: part.thicknessMm,
        quantity: part.quantity,
        grainDirection: part.grainDirection,
        edgeL1: part.edgeL1,
        edgeL2: part.edgeL2,
        edgeW1: part.edgeW1,
        edgeW2: part.edgeW2,
        isCut: part.isCut,
        isEdged: part.isEdged,
        isCncDone: part.isCncDone,
        isAssembled: part.isAssembled,
        status: part.status,
        notes: part.notes,
      },
      create: {
        ...part,
        productionOrderId: prodOrder.id,
      },
    });
  }
  console.log(`✅ Seeded ${cuttingParts.length} cutting parts.`);

  // 5. ثبت لیبل پروفیل و شیشه
  const woodProfiles = [
    {
      barcode: 'GLS-00001',
      itemType: 'GLASS',
      title: 'شیشه ۴ میل دودی فلوت ابزار لول براق',
      dimensions: '710 × 440 mm',
      quantity: 2,
      unit: 'جام',
      supplierName: 'شیشه‌بری جام‌نما (تأمین‌کننده طرف قرارداد)',
      status: 'ORDERED',
      notes: 'سکوریت نشکن جهت قاب آلومینیومی درب کلوزت',
    },
    {
      barcode: 'PRF-00001',
      itemType: 'PROFILE',
      title: 'پروفیل دستگیره مخفی شاخه‌ای J شامپاینی آنادایز',
      dimensions: '3000 mm (۳ متری)',
      quantity: 4,
      unit: 'شاخه',
      supplierName: 'آلومینیوم اکستروژن پارس',
      status: 'CUT',
      notes: 'برش با اره فارسی‌بر آلومینیوم در طول‌های ۸۶۸ میلیمتر',
    },
  ];

  for (const prof of woodProfiles) {
    await prisma.woodOrderProfile.upsert({
      where: { barcode: prof.barcode },
      update: {
        itemType: prof.itemType,
        title: prof.title,
        dimensions: prof.dimensions,
        quantity: prof.quantity,
        unit: prof.unit,
        supplierName: prof.supplierName,
        status: prof.status,
        notes: prof.notes,
      },
      create: {
        ...prof,
        productionOrderId: prodOrder.id,
      },
    });
  }
  console.log(`✅ Seeded ${woodProfiles.length} wood profiles & glass items.`);

  // 6. ثبت لاگ‌های نمونه اسکن خط تولید (Shop-Floor Scan Monitor)
  const scanLogs = [
    {
      barcode: 'CUT-00001',
      productionOrderId: prodOrder.id,
      operatorName: 'علی رضایی (اره‌کار)',
      stationCode: 'SAW',
      action: 'اسکن موفق در ایستگاه SAW: وضعیت به CUT تغییر یافت',
      isSuccess: true,
      scannedAt: new Date(Date.now() - 35 * 60 * 1000),
    },
    {
      barcode: 'CUT-00001',
      productionOrderId: prodOrder.id,
      operatorName: 'مهدی کریمی (لبه‌چسبان)',
      stationCode: 'EDGE',
      action: 'اسکن موفق در ایستگاه EDGE: نوار ۲ میلیمتر اعمال شد',
      isSuccess: true,
      scannedAt: new Date(Date.now() - 20 * 60 * 1000),
    },
    {
      barcode: 'CUT-00001',
      productionOrderId: prodOrder.id,
      operatorName: 'حسن موسوی (اپراتور CNC)',
      stationCode: 'CNC',
      action: 'اسکن موفق در ایستگاه CNC: شیار و سوراخ‌کاری تکمیل شد',
      isSuccess: true,
      scannedAt: new Date(Date.now() - 5 * 60 * 1000),
    },
  ];

  for (const log of scanLogs) {
    await prisma.productionScanLog.create({
      data: log,
    });
  }
  console.log(`✅ Seeded ${scanLogs.length} shop-floor scan logs.`);

  // 7. ثبت حواله و پروژه نصب در محل (Installation Order)
  const installOrder = await prisma.installationOrder.upsert({
    where: { orderNumber: 'INST-1404-0001' },
    update: {},
    create: {
      orderNumber: 'INST-1404-0001',
      productionOrderId: prodOrder.id,
      customerName: 'مهندس حسینی — پروژه ویلایی لواسان',
      contactPhone: '09121234567',
      projectAddress: 'لواسان، میدان ناران، خ صنوبر، ویلای شماره ۱۲',
      driverName: 'اکبر اسدی (خاور مسقف مجهز به پتو و فوم)',
      installerLead: 'استاد رحیمی و تیم نصب کابینت',
      scheduledDate: new Date(Date.now() + 4 * 24 * 3600 * 1000),
      status: 'SCHEDULED',
      completionNotes: 'آسانسور حمل بار ندارد؛ نیاز به ۳ کارگر کمکی برای طبقه دوم',
    },
  });
  console.log('✅ Seeded installation order:', installOrder.orderNumber);

  console.log('🎉 Wood industry seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding wood industry:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
