import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧾 Creating Rich Sale Invoices for Mohammad Reza Hosseini...');

  const customer = await prisma.customer.findFirst({
    where: { nationalId: '0012345678' },
  });
  if (!customer) throw new Error('Customer Mohammad Reza Hosseini not found');

  const warehouse = await prisma.warehouse.findFirst({ where: { isActive: true } });
  if (!warehouse) throw new Error('Warehouse not found');

  const seller = await prisma.user.findUnique({ where: { username: 'kamran.sh' } });
  const location = await prisma.location.findFirst({ where: { warehouseId: warehouse.id } });
  if (!location) throw new Error('Location not found');

  // محصولات
  const products = await prisma.product.findMany();
  const prodBySku = new Map<string, any>();
  products.forEach((p) => prodBySku.set(p.sku, p));

  const pCabMain = prodBySku.get('PRD-CAB-MAIN') || products[0];
  const pCabDirty = prodBySku.get('PRD-CAB-DIRTY') || products[0];
  const pClsMaster = prodBySku.get('PRD-CLS-MASTER') || products[0];
  const pWrdBed = prodBySku.get('PRD-WRD-BED') || products[0];
  const pVanPvc = prodBySku.get('PRD-VAN-PVC') || products[0];
  const pTvwWood = prodBySku.get('PRD-TVW-WOOD') || products[0];

  // یافتن چک‌های صیادی حسینی
  const cheques = await prisma.cheque.findMany({
    where: {
      receiptPayment: {
        receipt: { customerId: customer.id },
      },
    },
  });
  const chqMap = new Map<string, any>();
  cheques.forEach((c) => chqMap.set(c.number, c));

  const invoicesData = [
    {
      note: 'فاکتور رسمی ساخت و اجرای کابینت مدرن آشپزخانه اصلی (پروژه ویلای لواسان - کد ORD-CAB-001)',
      total: 3800000000,
      paid: 3800000000,
      due: 0,
      lines: [
        {
          product: pCabMain,
          qty: 14,
          unitPrice: 180000000,
          note: 'یونیت‌های زمینی و هوایی های‌گلاس دوپله AGT ترک با نوار ۲ میل هنکل و بدنه فرامید',
        },
        {
          product: pCabMain,
          qty: 1,
          unitPrice: 680000000,
          note: 'یونیت جزیره مدرن با کلاف دوبل و ریل‌های مخفی آرام‌بند بلوم اتریش اصل',
        },
        {
          product: pCabMain,
          qty: 6,
          unitPrice: 100000000,
          note: 'صفحه سنگ یکپارچه کورین سامسونگ ضدلک و بدون درز با ابزار دوبل مدرن',
        },
      ],
      payments: [
        { method: 'CARD' as const, amount: 1500000000, note: 'پیش‌پرداخت نقد واریزی به حساب پاسارگاد کاردو' },
        { method: 'CHEQUE' as const, amount: 1150000000, note: 'چک صیادی مرحله اول (شروع CNC و برش)', chqNum: 'CHQ-1001' },
        { method: 'CHEQUE' as const, amount: 750000000, note: 'چک صیادی مرحله دوم (شروع مونتاژ کارگاه)', chqNum: 'CHQ-1002' },
        { method: 'CHEQUE' as const, amount: 400000000, note: 'چک صیادی مرحله سوم (تحویل و رگلاژ نهایی)', chqNum: 'CHQ-1003' },
      ],
    },
    {
      note: 'فاکتور سفارش ساخت کابینت و یونیت‌های مطبخ کثیف (پروژه ویلای لواسان - کد ORD-CAB-002)',
      total: 1400000000,
      paid: 1400000000,
      due: 0,
      lines: [
        {
          product: pCabDirty,
          qty: 8,
          unitPrice: 175000000,
          note: 'یونیت‌های ضدچربی و حرارت با مغز MDF خارجی و روکش پلی‌گلاس ضدرطوبت',
        },
      ],
      payments: [
        { method: 'CARD' as const, amount: 600000000, note: 'پیش‌پرداخت نقد قرارداد مطبخ کثیف' },
        { method: 'CHEQUE' as const, amount: 800000000, note: 'چک صیادی بانک ملت سررسید ۴۵ روزه', chqNum: 'CHQ-2001' },
      ],
    },
    {
      note: 'فاکتور ساخت کلوزت روم مستر و کمد واک‌این شیشه‌ای (پروژه ویلای لواسان - کد ORD-CLS-003)',
      total: 1800000000,
      paid: 1800000000,
      due: 0,
      lines: [
        {
          product: pClsMaster,
          qty: 12,
          unitPrice: 150000000,
          note: 'کمد قدی کلوزت روم با پروفیل‌های مشکی آنودایز، شیشه برنز نشکن و نور مخفی خطی',
        },
      ],
      payments: [
        { method: 'CARD' as const, amount: 800000000, note: 'پیش‌پرداخت نقد قرارداد کلوزت مستر' },
        { method: 'CHEQUE' as const, amount: 500000000, note: 'چک صیادی صادرات قسط اول', chqNum: 'CHQ-3001' },
        { method: 'CHEQUE' as const, amount: 500000000, note: 'چک صیادی صادرات قسط دوم', chqNum: 'CHQ-3002' },
      ],
    },
    {
      note: 'فاکتور کمدهای دیواری اتاق خواب مهمان و کودک (پروژه ویلای لواسان - کد ORD-WRD-004)',
      total: 950000000,
      paid: 950000000,
      due: 0,
      lines: [
        {
          product: pWrdBed,
          qty: 10,
          unitPrice: 95000000,
          note: 'کمدهای دیواری با درب‌های ام‌دی‌اف فرامید سوپرمات، دستگیره مخفی J-Pull و ریل آرام‌بند',
        },
      ],
      payments: [
        { method: 'CARD' as const, amount: 450000000, note: 'پیش‌پرداخت نقد قرارداد کمدهای دیواری' },
        { method: 'CHEQUE' as const, amount: 500000000, note: 'چک صیادی بانک تجارت سررسید ۶۰ روزه', chqNum: 'CHQ-4001' },
      ],
    },
    {
      note: 'فاکتور روشویی و کابین‌های لوکس ضدآب PVC (پروژه ویلای لواسان - کد ORD-VAN-005)',
      total: 650000000,
      paid: 650000000,
      due: 0,
      lines: [
        {
          product: pVanPvc,
          qty: 2,
          unitPrice: 325000000,
          note: 'ست روشویی ضدآب PVC فومیزه ۱۶ میل با کاسه سنگ یکپارچه دهبید و آینه بک‌لایت لمسی',
        },
      ],
      payments: [
        { method: 'CARD' as const, amount: 300000000, note: 'پیش‌پرداخت نقد روشویی‌های لوکس' },
        { method: 'CHEQUE' as const, amount: 350000000, note: 'چک صیادی بانک سامان سررسید ۳۰ روزه', chqNum: 'CHQ-5001' },
      ],
    },
    {
      note: 'فاکتور تی‌وی وال و دکوراتیو چوبی سالن پذیرایی (پروژه ویلای لواسان - کد ORD-TVW-006)',
      total: 750000000,
      paid: 750000000,
      due: 0,
      lines: [
        {
          product: pTvwWood,
          qty: 1,
          unitPrice: 750000000,
          note: 'پنل تی‌وی وال دکوراتیو با اسلپ چوب طبیعی گردو، ترمووود و باکس معلق کنسول',
        },
      ],
      payments: [
        { method: 'CARD' as const, amount: 350000000, note: 'پیش‌پرداخت نقد تی‌وی وال' },
        { method: 'CHEQUE' as const, amount: 400000000, note: 'چک صیادی بانک ملی سررسید ۶۰ روزه', chqNum: 'CHQ-6001' },
      ],
    },
  ];

  for (let idx = 0; idx < invoicesData.length; idx++) {
    const inv = invoicesData[idx];

    // ۱. ایجاد فاکتور فروش
    const createdInvoice = await prisma.saleInvoice.create({
      data: {
        customerId: customer.id,
        warehouseId: warehouse.id,
        userId: seller?.id || null,
        subtotal: inv.total,
        discount: 0,
        total: inv.total,
        paidAmount: inv.paid,
        dueAmount: inv.due,
        status: 'CONFIRMED',
        note: inv.note,
        createdAt: new Date(Date.now() - (idx + 1) * 3600000), // چند ساعت قبل
      },
    });

    console.log(`✅ Created Invoice #${createdInvoice.number} for ${inv.total.toLocaleString()} Rials`);

    // ۲. ایجاد ردیف‌های اقلام فاکتور (InventoryLog)
    for (const line of inv.lines) {
      await prisma.inventoryLog.create({
        data: {
          invoiceId: createdInvoice.id,
          productId: line.product.id,
          locationId: location.id,
          quantity: -line.qty, // برای فروش منفی است
          action: 'SALE',
          unitPrice: line.unitPrice,
          lineDiscount: 0,
          lineNote: line.note,
          userId: seller?.id || null,
        },
      });
    }

    // ۳. ایجاد ردیف‌های پرداخت (Payment) و اتصال به چک‌های صیادی
    for (const pay of inv.payments) {
      const pRow = await prisma.payment.create({
        data: {
          invoiceId: createdInvoice.id,
          method: pay.method,
          amount: pay.amount,
          note: pay.note,
        },
      });

      if (pay.chqNum) {
        const existingChq = chqMap.get(pay.chqNum);
        if (existingChq) {
          // اتصال چک به این پرداخت فاکتور
          await prisma.cheque.update({
            where: { id: existingChq.id },
            data: { paymentId: pRow.id },
          });
        }
      }
    }
  }

  console.log('🎉 6 Invoices for Customer Mohammad Reza Hosseini successfully created with full lines and payments!');
}

main()
  .catch((e) => {
    console.error('❌ Error creating invoices:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
