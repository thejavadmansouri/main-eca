import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// SVG placeholder images for production stages
function generateStageSvg(stageTitle: string, stepName: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
    <defs>
      <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:${color};stop-opacity:1" />
        <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#grad)" rx="16"/>
    <rect x="20" y="20" width="560" height="360" rx="12" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
    <circle cx="80" cy="80" r="32" fill="rgba(255,255,255,0.15)"/>
    <text x="80" y="88" font-family="sans-serif" font-size="24" fill="#ffffff" text-anchor="middle">📸</text>
    <text x="130" y="75" font-family="sans-serif" font-size="20" font-weight="bold" fill="#ffffff">کارخانه صنایع چوب کاردو</text>
    <text x="130" y="98" font-family="sans-serif" font-size="14" fill="#cbd5e1">مستندسازی کنترل کیفیت و روند تولید</text>
    
    <rect x="40" y="140" width="520" height="150" rx="10" fill="rgba(0,0,0,0.3)"/>
    <text x="300" y="195" font-family="sans-serif" font-size="22" font-weight="bold" fill="#38bdf8" text-anchor="middle">${stageTitle}</text>
    <text x="300" y="235" font-family="sans-serif" font-size="16" fill="#e2e8f0" text-anchor="middle">${stepName}</text>
    
    <text x="50" y="340" font-family="monospace" font-size="12" fill="#94a3b8">کاردو OS — مانیتورینگ خط تولید</text>
    <text x="550" y="340" font-family="sans-serif" font-size="12" fill="#22c55e" text-anchor="end">✓ تأییدیه اپراتور و سرپرست</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

async function main() {
  const orders = await prisma.productionOrder.findMany();
  console.log(`Checking ${orders.length} orders for stage updates...`);

  const STAGES_DATA: Record<string, { title: string; desc: string; color: string; operator: string }[]> = {
    CUTTING: [
      {
        title: "برش دقیق ورق‌های ام‌دی‌اف و هایگلاس",
        desc: "برش تمام قطعات یونیت و بدنه با دستگاه کات دقیق هولزمایر طبق نقشه پارت‌لیست بدون ذره‌ای لب‌پریدگی انجام شد.",
        color: "#2563eb",
        operator: "استاد اصغر نجاتی (اپراتور کات)",
      },
    ],
    EDGE_BANDING: [
      {
        title: "نوارکاری لبه‌ها با چسب حرارتی ضدآب PUR",
        desc: "لبه‌های تمام قطعات با نوار ۲ میلی‌متر PVC و حرارت ۱۹۰ درجه با فینیشینگ پولیش نوار دستگاه هولزر تکمیل گردید.",
        color: "#0891b2",
        operator: "مرتضی صالحی (اپراتور لبه‌چسبان)",
      },
    ],
    CNC: [
      {
        title: "سوراخ‌کاری و ماشین‌کاری CNC یراق‌آلات بلوم",
        desc: "سوراخ‌های الیت، جای لولاهای آرام‌بند و شیارهای مخفی نوار نوری طبق فایل خروجی CAD/CAM روی دستگاه CNC اجرا شد.",
        color: "#7c3aed",
        operator: "مهندس فرزاد معتمدی (اپراتور CNC)",
      },
    ],
    ASSEMBLY: [
      {
        title: "مونتاژ مقدماتی و کنترل گونیایی باکس‌ها",
        desc: "اسکلت باکس‌های زمینی و هوایی با پیچ‌های کانفرمات ۵ سانتی متصل و گونیایی تمام یونیت‌ها با گونیای دیجیتال کنترل شد.",
        color: "#d97706",
        operator: "اکبر حبیبی (سرپرست مونتاژ)",
      },
    ],
    FINISHING: [
      {
        title: "رنگ‌پاشی و فینیشینگ سوپر براق پلی‌اورتان",
        desc: "سه لایه آستر و دو لایه رنگ پلی‌اورتان ضدخش در اتاق رنگ ایزوله پاشیده و به مدت ۴۸ ساعت در کوره پخت تثبیت شد.",
        color: "#db2777",
        operator: "استاد رحیم پیروز (سرپرست رنگ)",
      },
    ],
    QC_PACKING: [
      {
        title: "بازرسی کنترل کیفی و بسته‌بندی حباب‌دار ۵ لایه",
        desc: "تک‌تک قطعات و درب‌ها از نظر سلامت سطح و ابعاد بازرسی شدند و داخل فوم ضربه‌گیر و کارتن مقاوم بسته‌بندی گردیدند.",
        color: "#16a34a",
        operator: "علی کمالی (کنترل کیفی QC)",
      },
    ],
    READY_TO_INSTALL: [
      {
        title: "بارگیری و اعزام خودرو مخصوص حمل دکوراسیون",
        desc: "تمام پالت‌ها و بسته‌ها داخل کامیونت موکت‌بندی‌شده بارگیری و به همراه سرپرست نصب به آدرس پروژه اعزام شد.",
        color: "#ea580c",
        operator: "قاسم عسگری (لجستیک و حمل)",
      },
    ],
  };

  const STAGE_ORDER = [
    'CUTTING',
    'EDGE_BANDING',
    'CNC',
    'ASSEMBLY',
    'FINISHING',
    'QC_PACKING',
    'READY_TO_INSTALL',
    'INSTALLED',
  ];

  for (const order of orders) {
    // شماره تماس مشتری اگر خالی بود
    if (!order.customerPhone) {
      await prisma.productionOrder.update({
        where: { id: order.id },
        data: { customerPhone: '09121234567' },
      });
    }

    const currentStage = order.currentStage || 'CUTTING';
    const currentIdx = STAGE_ORDER.indexOf(currentStage);
    const stagesToSeed = STAGE_ORDER.slice(0, Math.max(1, currentIdx + 1));

    for (const stage of stagesToSeed) {
      if (stage === 'INSTALLED') continue;

      const existing = await prisma.productionStageUpdate.findFirst({
        where: {
          productionOrderId: order.id,
          stationCode: stage,
        },
      });

      if (!existing && STAGES_DATA[stage]) {
        const item = STAGES_DATA[stage][0];
        const photo1 = generateStageSvg(item.title, `مستند اول: ایستگاه ${stage}`, item.color);
        const photo2 = generateStageSvg(item.title, `مستند دوم: جزئیات کیفیت قطعه`, item.color);

        await prisma.productionStageUpdate.create({
          data: {
            productionOrderId: order.id,
            stationCode: stage,
            title: item.title,
            notes: item.desc,
            photos: [photo1, photo2],
            operatorName: item.operator,
            createdAt: new Date(Date.now() - (STAGE_ORDER.length - STAGE_ORDER.indexOf(stage)) * 3600000 * 24),
          },
        });
        console.log(`+ Added stage update [${stage}] to order ${order.code}`);
      }
    }
  }

  console.log("Seeding stage updates complete!");
}

main().finally(() => prisma.$disconnect());
