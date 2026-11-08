import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Enterprise Simulation & Personnel Seed...');

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. اطمینان از وجود انبار و واحدهای سازمانی (Departments)
  // ─────────────────────────────────────────────────────────────────────────────
  let warehouse = await prisma.warehouse.findFirst({
    where: { isActive: true },
  });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        name: 'انبار و کارخانه مرکزی کاردو',
        code: 'WH01',
        isActive: true,
      },
    });
  }

  const depts = [
    {
      code: 'DEP-SALES',
      name: 'واحد بازرگانی و فروش',
      description: 'فروش، قراردادها، برآورد و بازاریابی پروژه‌ها',
      managerName: 'مهندس کامران شایسته',
    },
    {
      code: 'DEP-FIN',
      name: 'واحد مالی و خزانه‌داری',
      description: 'حسابداری، خزانه‌داری، چک‌های صیادی و حقوق دستمزد',
      managerName: 'خانم نیلوفر راد',
    },
    {
      code: 'DEP-CRM',
      name: 'واحد دبیرخانه و امور مشتریان',
      description: 'هماهنگی بازدید و اندازه‌گیری، پیگیری CRM و رضایت مشتریان',
      managerName: 'خانم سارا افشار',
    },
    {
      code: 'DEP-PROD',
      name: 'واحد تولید و کارگاه چوب',
      description: 'خطوط برش، CNC، نوار لبه، مونتاژ، رنگ و بسته‌بندی کارگاه',
      managerName: 'استاد بهروز نجارزاده',
    },
    {
      code: 'DEP-SVC',
      name: 'واحد نصب و خدمات پس از فروش',
      description: 'اکیپ‌های اعزامی نصب در محل، رگلاژ، گارانتی و تحویل',
      managerName: 'آقای مجید کاظمی',
    },
    {
      code: 'DEP-LOG',
      name: 'واحد ترابری و لجستیک کاردو',
      description: 'ناوگان باربری مخصوص حمل کابینت و دکوراسیون چوبی',
      managerName: 'آقای علی قنبری',
    },
  ];

  const departmentMap = new Map<string, string>();
  for (const d of depts) {
    const dep = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description, managerName: d.managerName },
      create: d,
    });
    departmentMap.set(d.code, dep.id);
  }
  console.log('✅ Departments upserted successfully.');

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ایجاد کاربران و پرسنل رسمی شرکت (Users & Employees & Contracts)
  // ─────────────────────────────────────────────────────────────────────────────
  const defaultPasswordHash = await argon2.hash('123456');

  const staffProfiles = [
    {
      username: 'kamran.sh',
      fullName: 'مهندس کامران شایسته',
      role: 'SALES' as const,
      personnelCode: 'EMP-101',
      jobTitle: 'مدیر فروش و بازرگانی کاردو',
      departmentCode: 'DEP-SALES',
      mobile: '09122001122',
      nationalId: '0054321001',
      maritalStatus: 'MARRIED',
      childrenCount: 1,
      baseDailySalary: 4500000, // ۴.۵ میلیون ریال روزانه
      responsibilityAllowance: 45000000, // ۴۵ میلیون ریال حق مسئولیت
      specialAllowance: 30000000,
      notificationTitle: 'تایید ۶ پروژه جدید ویلای لواسان',
      notificationMsg: 'قراردادهای ۶ پروژه تفکیکی مهندس حسینی با موفقیت صادر گردید.',
    },
    {
      username: 'niloufar.rad',
      fullName: 'خانم نیلوفر راد',
      role: 'MANAGER' as const,
      personnelCode: 'EMP-102',
      jobTitle: 'حسابدار ارشد و مدیر خزانه‌داری',
      departmentCode: 'DEP-FIN',
      mobile: '09123002233',
      nationalId: '0054321002',
      maritalStatus: 'SINGLE',
      childrenCount: 0,
      baseDailySalary: 4200000,
      responsibilityAllowance: 35000000,
      specialAllowance: 25000000,
      notificationTitle: 'دریافت چک‌های صیادی ۶ پروژه',
      notificationMsg: 'کلیه چک‌های صیادی و پیش‌پرداخت‌های مهندس حسینی در خزانه‌داری ثبت گردید.',
    },
    {
      username: 'sara.afshar',
      fullName: 'خانم سارا افشار',
      role: 'SALES' as const,
      personnelCode: 'EMP-103',
      jobTitle: 'مسئول دفتر و هماهنگ‌کننده CRM و اندازه‌گیری',
      departmentCode: 'DEP-CRM',
      mobile: '09124003344',
      nationalId: '0054321003',
      maritalStatus: 'SINGLE',
      childrenCount: 0,
      baseDailySalary: 3200000,
      responsibilityAllowance: 15000000,
      specialAllowance: 15000000,
      notificationTitle: '۵ نوبت اندازه‌گیری و بازدید لیزری',
      notificationMsg: 'هماهنگی نوبت‌های اندازه‌گیری کردان، ظفر، قیطریه، اندرزگو و ونک انجام شد.',
    },
    {
      username: 'behrouz.wood',
      fullName: 'استاد بهروز نجارزاده',
      role: 'STAFF' as const,
      personnelCode: 'EMP-104',
      jobTitle: 'استادکار ارشد و سرپرست کارگاه چوب',
      departmentCode: 'DEP-PROD',
      mobile: '09125004455',
      nationalId: '0054321004',
      maritalStatus: 'MARRIED',
      childrenCount: 2,
      baseDailySalary: 4800000,
      responsibilityAllowance: 40000000,
      specialAllowance: 35000000,
      notificationTitle: '۱۰ پروژه فعال در خطوط کارگاه',
      notificationMsg: 'ایستگاه‌های برش، CNC، لبه‌چسبان، مونتاژ و رنگ در وضعیت آماده و شیفت فعال هستند.',
    },
    {
      username: 'reza.cnc',
      fullName: 'آقای رضا باقری',
      role: 'STAFF' as const,
      personnelCode: 'EMP-105',
      jobTitle: 'اپراتور ارشد دستگاه کات و CNC',
      departmentCode: 'DEP-PROD',
      mobile: '09126005566',
      nationalId: '0054321005',
      maritalStatus: 'SINGLE',
      childrenCount: 0,
      baseDailySalary: 3800000,
      responsibilityAllowance: 10000000,
      specialAllowance: 20000000,
      notificationTitle: 'برنامه برش و ماشین‌کاری امروز',
      notificationMsg: 'برش قطعات مطبخ کثیف و CNC کمدهای اتاق مهمان آماده اجرا است.',
    },
    {
      username: 'majid.install',
      fullName: 'آقای مجید کاظمی',
      role: 'STAFF' as const,
      personnelCode: 'EMP-106',
      jobTitle: 'سرپرست تیم اکیپ‌های نصب و اعزام',
      departmentCode: 'DEP-SVC',
      mobile: '09127006677',
      nationalId: '0054321006',
      maritalStatus: 'MARRIED',
      childrenCount: 1,
      baseDailySalary: 4100000,
      responsibilityAllowance: 30000000,
      specialAllowance: 25000000,
      notificationTitle: '۱۰ ماموریت تحویل و نصب امروز',
      notificationMsg: 'اکیپ‌های نصب جهت پروژه‌های لواسان، فرمانیه، میرداماد و ولنجک اعزام شدند.',
    },
    {
      username: 'ali.driver',
      fullName: 'آقای علی قنبری',
      role: 'STAFF' as const,
      personnelCode: 'EMP-107',
      jobTitle: 'راننده ارشد ناوگان کاردو',
      departmentCode: 'DEP-LOG',
      mobile: '09128007788',
      nationalId: '0054321007',
      maritalStatus: 'MARRIED',
      childrenCount: 2,
      baseDailySalary: 3500000,
      responsibilityAllowance: 15000000,
      specialAllowance: 15000000,
      notificationTitle: 'بارگیری محموله‌های کاردو',
      notificationMsg: 'خاور ایسوزو مسقف موکت‌کاری شده جهت بارگیری در سکوی شماره ۱ آماده است.',
    },
  ];

  const userMap = new Map<string, string>();

  // دوره حقوق و دستمزد
  let period = await prisma.payrollPeriod.findFirst({
    where: { year: 1404, month: 8 },
  });
  if (!period) {
    period = await prisma.payrollPeriod.create({
      data: {
        year: 1404,
        month: 8,
        title: 'حقوق و مزایای آبان ۱۴۰۴',
        status: 'FINALIZED',
      },
    });
  }

  for (const s of staffProfiles) {
    // ایجاد یا به‌روزرسانی کاربر
    let user = await prisma.user.findUnique({ where: { username: s.username } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: s.username,
          password: defaultPasswordHash,
          fullName: s.fullName,
          role: s.role,
          canManageSite: s.role === 'MANAGER',
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: s.fullName,
          role: s.role,
        },
      });
    }
    userMap.set(s.username, user.id);

    // ایجاد یا به‌روزرسانی پرونده کارمند
    const [firstName, ...lastParts] = s.fullName.split(' ');
    const lastName = lastParts.join(' ');
    const deptId = departmentMap.get(s.departmentCode) || null;

    let employee = await prisma.employee.findUnique({
      where: { personnelCode: s.personnelCode },
    });

    if (!employee) {
      employee = await prisma.employee.create({
        data: {
          personnelCode: s.personnelCode,
          firstName,
          lastName,
          nationalId: s.nationalId,
          mobile: s.mobile,
          maritalStatus: s.maritalStatus,
          childrenCount: s.childrenCount,
          jobTitle: s.jobTitle,
          departmentId: deptId,
          userId: user.id,
          hireDate: new Date('2024-03-21'),
        },
      });
    } else {
      employee = await prisma.employee.update({
        where: { id: employee.id },
        data: {
          jobTitle: s.jobTitle,
          departmentId: deptId,
          userId: user.id,
        },
      });
    }

    // ایجاد حکم کارگزینی
    const contractNumber = `CNT-${s.personnelCode}`;
    await prisma.employeeContract.upsert({
      where: { contractNumber },
      update: {
        baseDailySalary: s.baseDailySalary,
        baseMonthlySalary: s.baseDailySalary * 30,
        responsibilityAllowance: s.responsibilityAllowance,
        specialAllowance: s.specialAllowance,
      },
      create: {
        contractNumber,
        employeeId: employee.id,
        contractType: 'FIXED_TERM',
        decreeType: 'INITIAL',
        decreeTitle: `حکم کارگزینی ${s.jobTitle} - سال ۱۴۰۴`,
        startDate: new Date('2024-03-21'),
        baseDailySalary: s.baseDailySalary,
        baseMonthlySalary: s.baseDailySalary * 30,
        housingAllowance: 9000000,
        groceryAllowance: 14000000,
        maritalAllowance: s.maritalStatus === 'MARRIED' ? 5000000 : 0,
        childAllowancePerChild: 7166184,
        responsibilityAllowance: s.responsibilityAllowance,
        specialAllowance: s.specialAllowance,
        notes: 'مشمول قانون کار و تامین اجتماعی به همراه بیمه تکمیلی درمان و ایاب ذهاب.',
      },
    });

    // ثبت فیش حقوقی در دوره جاری
    const baseSal = s.baseDailySalary * 30;
    const gross =
      baseSal +
      9000000 +
      14000000 +
      (s.maritalStatus === 'MARRIED' ? 5000000 : 0) +
      s.childrenCount * 7166184 +
      s.responsibilityAllowance +
      s.specialAllowance;
    const workerIns = Math.round(gross * 0.07);
    const employerIns = Math.round(gross * 0.23);
    const incomeTax = Math.round(Math.max(0, (gross - 120000000) * 0.1));
    const deductions = workerIns + incomeTax;
    const net = gross - deductions;

    const existingSlip = await prisma.payrollSlip.findFirst({
      where: { periodId: period.id, employeeId: employee.id },
    });
    if (!existingSlip) {
      await prisma.payrollSlip.create({
        data: {
          periodId: period.id,
          employeeId: employee.id,
          workingDays: 30,
          baseSalaryEarned: baseSal,
          housingAllowance: 9000000,
          groceryAllowance: 14000000,
          childAllowance: s.childrenCount * 7166184,
          maritalAllowance: s.maritalStatus === 'MARRIED' ? 5000000 : 0,
          bonusAndPerks: s.responsibilityAllowance + s.specialAllowance,
          totalGrossSalary: gross,
          workerInsurance: workerIns,
          employerInsurance: employerIns,
          incomeTax,
          totalDeductions: deductions,
          netPayable: net,
          totalEmployerCost: gross + employerIns,
          status: 'PAID',
        },
      });
    }

    // ارسال اعلان کارتابل برای هر کاربر
    await prisma.staffNotification.create({
      data: {
        recipientId: user.id,
        title: s.notificationTitle,
        message: s.notificationMsg,
        type: 'INFO',
        linkUrl: '/admin/profile',
      },
    });
  }
  console.log('✅ 7 Key Enterprise Personnel, Contracts, Slips & Notifications created.');

  // پرونده ناوگان برای آقای علی قنبری
  await prisma.driver.upsert({
    where: { code: 'DRV-101' },
    update: {
      fullName: 'علی قنبری',
      mobile: '09128007788',
      plateNumber: '۴۴-۱۲۳ج۸۵',
      vehicleType: 'خاور ایسوزو مسقف موکت‌کاری شده ویژه حمل کابینت',
      licenseNumber: '۹۸۷۶۵۴۳۲',
      isActive: true,
      notes: 'دارای اتاقک مسقف و ضربه‌گیرهای ابری و تسمه‌های مهار بار.',
    },
    create: {
      code: 'DRV-101',
      fullName: 'علی قنبری',
      mobile: '09128007788',
      plateNumber: '۴۴-۱۲۳ج۸۵',
      vehicleType: 'خاور ایسوزو مسقف موکت‌کاری شده ویژه حمل کابینت',
      licenseNumber: '۹۸۷۶۵۴۳۲',
      isActive: true,
      notes: 'دارای اتاقک مسقف و ضربه‌گیرهای ابری و تسمه‌های مهار بار.',
    },
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. مشتری محمدرضا حسینی (ویلا لواسان)
  // ─────────────────────────────────────────────────────────────────────────────
  let customer = await prisma.customer.findFirst({
    where: {
      OR: [
        { nationalId: '0012345678' },
        { phones: { some: { phone: '09121112233' } } },
      ],
    },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        firstName: 'محمدرضا',
        lastName: 'حسینی',
        nationalId: '0012345678',
        address: 'تهران، لواسان، بلوار باستی، کوچه یاس، پلاک ۱۴، ویلای حسینی',
        phones: {
          create: {
            phone: '09121112233',
            label: 'موبایل اصلی',
          },
        },
      },
    });
  } else {
    customer = await prisma.customer.update({
      where: { id: customer.id },
      data: {
        firstName: 'محمدرضا',
        lastName: 'حسینی',
        nationalId: '0012345678',
        address: 'تهران، لواسان، بلوار باستی، کوچه یاس، پلاک ۱۴، ویلای حسینی',
      },
    });
  }
  console.log(`✅ Customer Mohammad Reza Hosseini: ${customer.id}`);

  // یافتن یا ایجاد محصولات پایه چوب و دکوراسیون
  const woodProductsData = [
    { sku: 'PRD-CAB-MAIN', name: 'کابینت آشپزخانه مدرن هایگلاس و فرامید', unit: 'متر طول' },
    { sku: 'PRD-CAB-DIRTY', name: 'کابینت و یونیت‌های مطبخ کثیف ضدچربی', unit: 'متر طول' },
    { sku: 'PRD-CLS-MASTER', name: 'کلوزت روم مستر و کمد واک‌این شیشه‌ای', unit: 'متر مربع' },
    { sku: 'PRD-WRD-BED', name: 'کمدهای دیواری اتاق مهمان و کودک فرامید', unit: 'متر مربع' },
    { sku: 'PRD-VAN-PVC', name: 'روشویی و باکس‌های لوکس PVC ضدآب', unit: 'دست' },
    { sku: 'PRD-TVW-WOOD', name: 'تی‌وی وال و دکوراتیو چوبی سالن پذیرایی', unit: 'متر مربع' },
  ];

  const productMap = new Map<string, string>();
  const bomMap = new Map<string, string>();

  for (const wp of woodProductsData) {
    let p = await prisma.product.findFirst({ where: { sku: wp.sku } });
    if (!p) {
      p = await prisma.product.create({
        data: {
          sku: wp.sku,
          name: wp.name,
          unit: wp.unit,
        },
      });
    }
    productMap.set(wp.sku, p.id);

    // BOM
    let b = await prisma.billOfMaterials.findFirst({ where: { productId: p.id } });
    if (!b) {
      b = await prisma.billOfMaterials.create({
        data: {
          code: `BOM-${wp.sku}`,
          name: `فرمول استاندارد ساخت ${wp.name}`,
          productId: p.id,
          quantity: 1,
          unit: wp.unit,
        },
      });
    }
    bomMap.set(wp.sku, b.id);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. ایجاد ۶ پروژه تفکیکی، قرارداد، پیش‌پرداخت، چک‌های صیادی و رهگیری برای مهندس حسینی
  // ─────────────────────────────────────────────────────────────────────────────
  const hosseiniProjects = [
    {
      code: 'ORD-CAB-001',
      contractNum: 'CNT-1404-001',
      prodSku: 'PRD-CAB-MAIN',
      title: 'کابینت مدرن آشپزخانه اصلی (دوپله مات AGT ترک و کورین)',
      stage: 'ASSEMBLY',
      progress: 65,
      totalAmount: 3800000000, // ۳۸۰ میلیون تومان (ریال)
      advanceAmount: 1500000000, // ۱۵۰ میلیون تومان نقد
      cheques: [
        {
          num: 'CHQ-1001',
          sayad: '1404889911223344',
          amount: 1150000000,
          bank: 'بانک پاسارگاد',
          branch: 'شعبه لواسان',
          dueDays: 30,
        },
        {
          num: 'CHQ-1002',
          sayad: '1404889911223355',
          amount: 750000000,
          bank: 'بانک پاسارگاد',
          branch: 'شعبه لواسان',
          dueDays: 60,
        },
        {
          num: 'CHQ-1003',
          sayad: '1404889911223366',
          amount: 400000000,
          bank: 'بانک پاسارگاد',
          branch: 'شعبه لواسان',
          dueDays: 90,
        },
      ],
      stageUpdates: [
        {
          station: 'CUTTING',
          title: 'برش پانل‌های هایگلاس AGT و بدنه فرامید',
          notes: 'برش دقیق CNC با تیغ الماسه و چک زاویه‌سنج با موفقیت انجام شد.',
          photos: [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          ],
        },
        {
          station: 'EDGE_BANDING',
          title: 'نوار پی‌وی‌سی ۲ میل ضدآب با چسب حرارتی هنکل',
          notes: 'لبه‌چسبانی با فینیش بدون درز و چسبندگی ۱۰۰ درصدی قطعات.',
          photos: [
            'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
          ],
        },
        {
          station: 'CNC',
          title: 'ماشین‌کاری جای لولا گازور و شیار ریل بلوم',
          notes: 'سوراخکاری استاندارد ۳۲ با دقت دهم میلیمتر نهایی گردید.',
          photos: [
            'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
          ],
        },
        {
          station: 'ASSEMBLY',
          title: 'مونتاژ یونیت‌های اصلی و ریل‌گذاری کشوها',
          notes: 'مونتاژ بدنه با پیچ الیت و نصب ریل‌های مخفی بلوم اصل اتریش.',
          photos: [
            'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
          ],
        },
      ],
      parts: [
        { name: 'یونیت زمینی سینک دولگنه', material: 'MDF فرامید ۱۶ میل', length: 900, width: 600, qty: 1, barcode: 'CUT-HOS-001' },
        { name: 'یونیت گاز صفحه‌ای توکار', material: 'MDF فرامید ۱۶ میل', length: 900, width: 600, qty: 1, barcode: 'CUT-HOS-002' },
        { name: 'درب‌های های‌گلاس سوپرمات AGT', material: 'AGT ترک ۱۸ میل', length: 720, width: 445, qty: 8, barcode: 'CUT-HOS-003' },
        { name: 'باکس جزیره آشپزخانه مدرن', material: 'MDF کتان طوسی فرامید', length: 2400, width: 900, qty: 1, barcode: 'CUT-HOS-004' },
      ],
      instOrderNum: 'INST-1404-0001',
      instStatus: 'SCHEDULED',
    },
    {
      code: 'ORD-CAB-002',
      contractNum: 'CNT-1404-002',
      prodSku: 'PRD-CAB-DIRTY',
      title: 'کابینت و یونیت‌های مطبخ کثیف (مقاوم در برابر حرارت و رطوبت)',
      stage: 'CUTTING',
      progress: 20,
      totalAmount: 1400000000, // ۱۴۰ میلیون تومان
      advanceAmount: 600000000,
      cheques: [
        {
          num: 'CHQ-2001',
          sayad: '1404778822334455',
          amount: 800000000,
          bank: 'بانک ملت',
          branch: 'شعبه تجریش',
          dueDays: 45,
        },
      ],
      stageUpdates: [
        {
          station: 'CUTTING',
          title: 'شروع کات ورق‌های ضدرطوبت پلی‌گلاس',
          notes: 'ورق‌های ضدحرارت و چربی با نقشه اپتیمایز برش خورد.',
          photos: [
            'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
          ],
        },
      ],
      parts: [
        { name: 'بدنه یونیت فر و مایکروویو مطبخ', material: 'MDF مغز خارجی ۱۶ میل', length: 2100, width: 600, qty: 1, barcode: 'CUT-HOS-010' },
        { name: 'دیواره محافظ حرارتی هود صنعتی', material: 'پلی‌گلاس مقاوم ۱۸ میل', length: 900, width: 600, qty: 2, barcode: 'CUT-HOS-011' },
      ],
      instOrderNum: 'INST-1404-0002',
      instStatus: 'SCHEDULED',
    },
    {
      code: 'ORD-CLS-003',
      contractNum: 'CNT-1404-003',
      prodSku: 'PRD-CLS-MASTER',
      title: 'کلوزت روم مستر و کمد واک‌این شیشه‌ای (پروفیل مشکی آنودایز)',
      stage: 'EDGE_BANDING',
      progress: 35,
      totalAmount: 1800000000, // ۱۸۰ میلیون تومان
      advanceAmount: 800000000,
      cheques: [
        {
          num: 'CHQ-3001',
          sayad: '1404667733445566',
          amount: 500000000,
          bank: 'بانک صادرات',
          branch: 'شعبه نیاوران',
          dueDays: 30,
        },
        {
          num: 'CHQ-3002',
          sayad: '1404667733445577',
          amount: 500000000,
          bank: 'بانک صادرات',
          branch: 'شعبه نیاوران',
          dueDays: 60,
        },
      ],
      stageUpdates: [
        {
          station: 'EDGE_BANDING',
          title: 'نوارکاری لبه‌های بدنه دکوراتیو کلوزت',
          notes: 'اجرای نوار پی‌وی‌سی مشکی سوپرمات با دستگاه اتوماتیک.',
          photos: [
            'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=800&q=80',
          ],
        },
      ],
      parts: [
        { name: 'باکس طبقات آویز لباس مستر', material: 'ام‌دی‌اف گردویی والیس ۱۶ میل', length: 2400, width: 600, qty: 2, barcode: 'CUT-HOS-020' },
        { name: 'کشوهای زیورآلات با تقسیم‌بندی مخمل', material: 'MDF ۱۰ میل با فوم مخمل', length: 500, width: 450, qty: 4, barcode: 'CUT-HOS-021' },
      ],
      instOrderNum: 'INST-1404-0003',
      instStatus: 'SCHEDULED',
    },
    {
      code: 'ORD-WRD-004',
      contractNum: 'CNT-1404-004',
      prodSku: 'PRD-WRD-BED',
      title: 'کمدهای دیواری اتاق خواب مهمان و کودک (ام‌دی‌اف فرامید مات)',
      stage: 'CNC',
      progress: 45,
      totalAmount: 950000000, // ۹۵ میلیون تومان
      advanceAmount: 450000000,
      cheques: [
        {
          num: 'CHQ-4001',
          sayad: '1404556644556677',
          amount: 500000000,
          bank: 'بانک تجارت',
          branch: 'شعبه باستی',
          dueDays: 60,
        },
      ],
      stageUpdates: [
        {
          station: 'CNC',
          title: 'فرزکاری دستگیره مخفی J-Pull روی درب‌ها',
          notes: 'اجرای پروفیل شاخه‌ای و شیار دستگیره با دقت صدم میلیمتر.',
          photos: [
            'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80',
          ],
        },
      ],
      parts: [
        { name: 'درب قدی کمد اتاق مهمان با شیار دستگیره', material: 'فرامید شیری مات ۱۶ میل', length: 2350, width: 550, qty: 4, barcode: 'CUT-HOS-030' },
      ],
      instOrderNum: 'INST-1404-0004',
      instStatus: 'SCHEDULED',
    },
    {
      code: 'ORD-VAN-005',
      contractNum: 'CNT-1404-005',
      prodSku: 'PRD-VAN-PVC',
      title: 'روشویی و کابین‌های لوکس ضدآب PVC (سنگ طبیعی دهبید)',
      stage: 'QC_PACKING',
      progress: 85,
      totalAmount: 650000000, // ۶۵ میلیون تومان
      advanceAmount: 300000000,
      cheques: [
        {
          num: 'CHQ-5001',
          sayad: '1404445555667788',
          amount: 350000000,
          bank: 'بانک سامان',
          branch: 'شعبه زعفرانیه',
          dueDays: 30,
        },
      ],
      stageUpdates: [
        {
          station: 'QC_PACKING',
          title: 'کنترل آب‌بندی، اتصال سنگ و بسته‌بندی با فوم حبابدار',
          notes: 'تست تست نفوذناپذیری آب و سلامت صفحه سنگ طبیعی تایید شد.',
          photos: [
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
          ],
        },
      ],
      parts: [
        { name: 'کابین زمینی ضدآب PVC فومیزه', material: 'فومیزه سفید ۱۶ میل ضدآب', length: 1100, width: 520, qty: 2, barcode: 'CUT-HOS-040' },
      ],
      instOrderNum: 'INST-1404-0005',
      instStatus: 'SCHEDULED',
    },
    {
      code: 'ORD-TVW-006',
      contractNum: 'CNT-1404-006',
      prodSku: 'PRD-TVW-WOOD',
      title: 'تی‌وی وال و دکوراتیو چوبی سالن پذیرایی (ترمووود و لاین نوری)',
      stage: 'FINISHING',
      progress: 70,
      totalAmount: 750000000, // ۷۵ میلیون تومان
      advanceAmount: 350000000,
      cheques: [
        {
          num: 'CHQ-6001',
          sayad: '1404334466778899',
          amount: 400000000,
          bank: 'بانک ملی',
          branch: 'شعبه مرکزی لواسان',
          dueDays: 60,
        },
      ],
      stageUpdates: [
        {
          station: 'FINISHING',
          title: 'رنگ‌آمیزی پلی‌اورتان مات ضدخش و سنباده‌کاری نهایی',
          notes: 'پاشش رنگ پلی‌اورتان ۳ لایه در اتاق رنگ مخصوص بدون ذره‌ای گردوغبار.',
          photos: [
            'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80',
          ],
        },
      ],
      parts: [
        { name: 'پنل دکوراتیو اسلپ چوب گردو', material: 'ترمووود و روکش طبیعی گردو', length: 2800, width: 1400, qty: 1, barcode: 'CUT-HOS-050' },
      ],
      instOrderNum: 'INST-1404-0006',
      instStatus: 'SCHEDULED',
    },
  ];

  for (const hp of hosseiniProjects) {
    const prodId = productMap.get(hp.prodSku)!;
    const bomId = bomMap.get(hp.prodSku)!;

    // 1. سفارش تولید
    let prodOrder = await prisma.productionOrder.findUnique({
      where: { code: hp.code },
    });

    if (!prodOrder) {
      prodOrder = await prisma.productionOrder.create({
        data: {
          code: hp.code,
          productId: prodId,
          bomId,
          targetQuantity: 1,
          completedQuantity: hp.progress >= 100 ? 1 : 0,
          status: hp.progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
          customerName: 'محمدرضا حسینی',
          endClientName: 'مهندس محمدرضا حسینی',
          projectTitle: hp.title,
          assignedInstaller: 'مجید کاظمی',
          installerPhone: '09127006677',
          currentStage: hp.stage,
          progressPercent: hp.progress,
          trackingToken: `trk-${hp.code.toLowerCase()}`,
          warehouseId: warehouse.id,
          dueDate: new Date(Date.now() + 14 * 86400000),
        },
      });
    } else {
      prodOrder = await prisma.productionOrder.update({
        where: { id: prodOrder.id },
        data: {
          customerName: 'محمدرضا حسینی',
          endClientName: 'مهندس محمدرضا حسینی',
          projectTitle: hp.title,
          assignedInstaller: 'مجید کاظمی',
          installerPhone: '09127006677',
          currentStage: hp.stage,
          progressPercent: hp.progress,
          trackingToken: `trk-${hp.code.toLowerCase()}`,
        },
      });
    }

    // 2. قطعات برش (Cutting list)
    for (const part of hp.parts) {
      await prisma.cuttingListItem.upsert({
        where: { barcode: part.barcode },
        update: {
          partName: part.name,
          materialType: part.material,
          lengthMm: part.length,
          widthMm: part.width,
          quantity: part.qty,
        },
        create: {
          productionOrderId: prodOrder.id,
          barcode: part.barcode,
          partName: part.name,
          materialType: part.material,
          lengthMm: part.length,
          widthMm: part.width,
          thicknessMm: 16,
          quantity: part.qty,
          isCut: true,
          status: 'CUT',
        },
      });
    }

    // 3. عکس‌ها و گزارش‌های کارگاهی (Stage updates)
    for (const su of hp.stageUpdates) {
      const existingUpdate = await prisma.productionStageUpdate.findFirst({
        where: { productionOrderId: prodOrder.id, stationCode: su.station },
      });
      if (!existingUpdate) {
        await prisma.productionStageUpdate.create({
          data: {
            productionOrderId: prodOrder.id,
            stationCode: su.station,
            title: su.title,
            notes: su.notes,
            photos: su.photos,
            operatorName: 'بهروز نجارزاده',
          },
        });
      }
    }

    // 4. قرارداد پروژه تفکیکی (Project Contract)
    let contract = await prisma.projectContract.findUnique({
      where: { contractNumber: hp.contractNum },
    });

    if (!contract) {
      contract = await prisma.projectContract.create({
        data: {
          contractNumber: hp.contractNum,
          productionOrderId: prodOrder.id,
          totalAmount: hp.totalAmount,
          paidAmount: hp.advanceAmount,
          warrantyMonths: 18,
          status: 'ACTIVE',
          signedAt: new Date(),
          terms: 'تعهد ساخت و تحویل طبق نقشه‌های تأییدشده سه‌بعدی. کلیه یراق‌آلات بلوم دارای ۱۸ ماه ضمانت تعویض کاردو می‌باشند.',
        },
      });
    }

    // 5. مراحل پرداخت (Milestones)
    await prisma.projectMilestone.deleteMany({ where: { contractId: contract.id } });
    // مرحله ۱: پیش‌پرداخت نقد
    const m1 = await prisma.projectMilestone.create({
      data: {
        contractId: contract.id,
        stepNumber: 1,
        title: 'پیش‌پرداخت عقد قرارداد و نقشه‌های ساخت',
        percentage: Math.round((hp.advanceAmount / hp.totalAmount) * 100),
        amount: hp.advanceAmount,
        status: 'PAID',
        paidAmount: hp.advanceAmount,
        paidAt: new Date(),
      },
    });

    // مرحله ۲ به بعد: چک‌های صیادی
    let stepIdx = 2;
    for (const chq of hp.cheques) {
      await prisma.projectMilestone.create({
        data: {
          contractId: contract.id,
          stepNumber: stepIdx++,
          title: `قسط مرحله‌ای با چک صیادی (${chq.bank})`,
          percentage: Math.round((chq.amount / hp.totalAmount) * 100),
          amount: chq.amount,
          status: 'PENDING',
          dueDate: new Date(Date.now() + chq.dueDays * 86400000),
        },
      });
    }

    // 6. ثبت مالی پیش‌پرداخت (Receipt & ReceiptPayment)
    const receipt = await prisma.receipt.create({
      data: {
        customerId: customer.id,
        amount: hp.advanceAmount,
        method: 'CARD',
        note: `پیش‌پرداخت نقد/واریزی بابت قرارداد ${hp.contractNum} (${hp.title})`,
        payments: {
          create: {
            amount: hp.advanceAmount,
            method: 'CARD',
          },
        },
      },
    });

    await prisma.projectPayment.create({
      data: {
        contractId: contract.id,
        milestoneId: m1.id,
        amount: hp.advanceAmount,
        method: 'TRANSFER',
        trackingCode: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
        verifiedBy: 'نیلوفر راد (خزانه‌داری)',
        notes: `تایید فیش واریزی در حساب بانک پاسارگاد کاردو`,
      },
    });

    // 7. ثبت تک‌تک چک‌های صیادی در خزانه‌داری متصل به پرونده مشتری حسینی
    for (const chq of hp.cheques) {
      const chqDueDate = new Date(Date.now() + chq.dueDays * 86400000);

      // ایجاد سطر دریافت چک در حسابداری
      const chqReceipt = await prisma.receipt.create({
        data: {
          customerId: customer.id,
          amount: chq.amount,
          method: 'CHEQUE',
          note: `دریافت چک صیادی بابت قرارداد ${hp.contractNum}`,
        },
      });

      const receiptPayment = await prisma.receiptPayment.create({
        data: {
          receiptId: chqReceipt.id,
          amount: chq.amount,
          method: 'CHEQUE',
        },
      });

      // ثبت چک در جدول Cheque
      await prisma.cheque.upsert({
        where: { receiptPaymentId: receiptPayment.id },
        update: {
          number: chq.num,
          sayadId: chq.sayad,
          chequeType: 'RECEIVABLE',
          amount: chq.amount,
          bankName: chq.bank,
          branch: chq.branch,
          holderName: 'محمدرضا حسینی',
          drawerNationalId: '0012345678',
          dueDate: chqDueDate,
          status: 'IN_HAND',
          note: `بابت پروژه ${hp.title} - شماره قرارداد ${hp.contractNum}`,
        },
        create: {
          receiptPaymentId: receiptPayment.id,
          number: chq.num,
          sayadId: chq.sayad,
          chequeType: 'RECEIVABLE',
          amount: chq.amount,
          bankName: chq.bank,
          branch: chq.branch,
          holderName: 'محمدرضا حسینی',
          drawerNationalId: '0012345678',
          dueDate: chqDueDate,
          status: 'IN_HAND',
          note: `بابت پروژه ${hp.title} - شماره قرارداد ${hp.contractNum}`,
        },
      });

      // همچنین ثبت پرداخت قرارداد
      await prisma.projectPayment.create({
        data: {
          contractId: contract.id,
          amount: chq.amount,
          method: 'CHEQUE',
          chequeNumber: chq.sayad,
          chequeBank: chq.bank,
          chequeDueDate: chqDueDate,
          verifiedBy: 'نیلوفر راد (خزانه‌داری)',
          notes: `چک صیادی شماره ${chq.num} - صیاد: ${chq.sayad}`,
        },
      });
    }

    // 8. ثبت سفارش اعزام و نصب (InstallationOrder)
    await prisma.installationOrder.upsert({
      where: { orderNumber: hp.instOrderNum },
      update: {
        productionOrderId: prodOrder.id,
        customerId: customer.id,
        customerName: 'محمدرضا حسینی',
        contactPhone: '09121112233',
        projectAddress: 'تهران، لواسان، بلوار باستی، کوچه یاس، پلاک ۱۴، ویلای حسینی',
        driverName: 'علی قنبری',
        installerLead: 'مجید کاظمی',
        status: hp.instStatus,
        scheduledDate: new Date(Date.now() + 7 * 86400000),
      },
      create: {
        orderNumber: hp.instOrderNum,
        productionOrderId: prodOrder.id,
        customerId: customer.id,
        customerName: 'محمدرضا حسینی',
        contactPhone: '09121112233',
        projectAddress: 'تهران، لواسان، بلوار باستی، کوچه یاس، پلاک ۱۴، ویلای حسینی',
        driverName: 'علی قنبری',
        installerLead: 'مجید کاظمی',
        status: hp.instStatus,
        scheduledDate: new Date(Date.now() + 7 * 86400000),
      },
    });
  }
  console.log('✅ 6 distinct projects for Customer Hosseini successfully seeded with Cheques & Contracts.');

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. تکمیل ظرفیت تولید کارخانه تا ۱۰ پروژه فعال در ایستگاه‌های مختلف (High-Throughput Simulation)
  // ─────────────────────────────────────────────────────────────────────────────
  const additionalProjects = [
    {
      code: 'ORD-CAB-007',
      title: 'کابینت نئوکلاسیک پلی‌اورتان فرمانیه',
      customerName: 'دکتر علیرضا شریفی',
      installer: 'مهرداد کریمی',
      stage: 'CUTTING',
      progress: 15,
      prodSku: 'PRD-CAB-MAIN',
    },
    {
      code: 'ORD-CAB-008',
      title: 'کابینت سوپرلوکس پولیشی نیاوران',
      customerName: 'مهندس سامان پیروز',
      installer: 'مجید کاظمی',
      stage: 'EDGE_BANDING',
      progress: 30,
      prodSku: 'PRD-CAB-MAIN',
    },
    {
      code: 'ORD-CLS-009',
      title: 'کلوزت و کمدهای واک‌این ولنجک',
      customerName: 'خانم دکتر مهناز معتمدی',
      installer: 'پیمان حسنی',
      stage: 'CNC',
      progress: 50,
      prodSku: 'PRD-CLS-MASTER',
    },
    {
      code: 'ORD-DEC-010',
      title: 'پارتیشن و دکوراسیون چوبی اداری سعادت‌آباد',
      customerName: 'شرکت مهندسی مهستان',
      installer: 'مجید کاظمی',
      stage: 'READY_TO_INSTALL',
      progress: 90,
      prodSku: 'PRD-TVW-WOOD',
    },
  ];

  for (const ap of additionalProjects) {
    const prodId = productMap.get(ap.prodSku)!;
    const bomId = bomMap.get(ap.prodSku)!;

    await prisma.productionOrder.upsert({
      where: { code: ap.code },
      update: {
        customerName: ap.customerName,
        endClientName: ap.customerName,
        projectTitle: ap.title,
        assignedInstaller: ap.installer,
        currentStage: ap.stage,
        progressPercent: ap.progress,
        trackingToken: `trk-${ap.code.toLowerCase()}`,
      },
      create: {
        code: ap.code,
        productId: prodId,
        bomId,
        targetQuantity: 1,
        status: 'IN_PROGRESS',
        customerName: ap.customerName,
        endClientName: ap.customerName,
        projectTitle: ap.title,
        assignedInstaller: ap.installer,
        currentStage: ap.stage,
        progressPercent: ap.progress,
        trackingToken: `trk-${ap.code.toLowerCase()}`,
        warehouseId: warehouse.id,
        dueDate: new Date(Date.now() + 10 * 86400000),
      },
    });
  }
  console.log('✅ 10 Active Production Projects now in workshop lines across all stations.');

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. ایجاد ۱۰ ماموریت تحویل و نصب فعال ناوگان لجستیک (10 Dispatch & Deliveries)
  // ─────────────────────────────────────────────────────────────────────────────
  const tenInstallations = [
    {
      orderNumber: 'INST-1404-0001',
      customerName: 'محمدرضا حسینی',
      phone: '09121112233',
      address: 'تهران، لواسان، بلوار باستی، کوچه یاس، پلاک ۱۴، ویلای حسینی',
      driver: 'علی قنبری',
      installer: 'مجید کاظمی',
      status: 'SCHEDULED',
      notes: 'کابینت مدرن آشپزخانه اصلی - برنامه‌ریزی اعزام اول وقت',
    },
    {
      orderNumber: 'INST-1404-0002',
      customerName: 'دکتر علیرضا شریفی',
      phone: '09122223344',
      address: 'تهران، فرمانیه، خیابان سنبل، پلاک ۱۸، برج رز',
      driver: 'علی قنبری',
      installer: 'مهرداد کریمی',
      status: 'LOADED',
      notes: 'بارگیری در سکوی شماره ۲ کارخانه - آماده حرکت',
    },
    {
      orderNumber: 'INST-1404-0003',
      customerName: 'شرکت مهندسی مهستان',
      phone: '09123334455',
      address: 'تهران، سعادت‌آباد، میدان کاج، خیابان مروارید، ساختمان صبا',
      driver: 'محمد احمدی',
      installer: 'مجید کاظمی',
      status: 'IN_TRANSIT',
      notes: 'کامیون در مسیر اتوبان یادگار امام - اعزام تکنسین‌ها',
    },
    {
      orderNumber: 'INST-1404-0004',
      customerName: 'خانم دکتر معتمدی',
      phone: '09124445566',
      address: 'تهران، ولنجک، خیابان سیزدهم، مجتمع ساسان',
      driver: 'علی قنبری',
      installer: 'پیمان حسنی',
      status: 'INSTALLING',
      notes: 'تکنسین‌ها در حال رگلاژ درب‌های شیشه‌ای و باکس‌های واک‌این',
    },
    {
      orderNumber: 'INST-1404-0005',
      customerName: 'دکتر بابک طاهری',
      phone: '09125556677',
      address: 'تهران، الهیه، خیابان فرشته، بن‌بست پایا',
      driver: 'علی قنبری',
      installer: 'مجید کاظمی',
      status: 'INSTALLING',
      notes: 'نصب روشویی‌های لوکس ضدآب و تست شیرآلات و سنگ دهبید',
    },
    {
      orderNumber: 'INST-1404-0006',
      customerName: 'مهندس کامران صدر',
      phone: '09126667788',
      address: 'تهران، میرداماد، میدان مادر، خیابان وزیری‌پور',
      driver: 'محمد احمدی',
      installer: 'مجید کاظمی',
      status: 'COMPLETED',
      notes: 'پروژه با رضایت ۱۰۰٪ تحویل و برگه گارانتی ۱۸ ماهه امضا گردید.',
    },
    {
      orderNumber: 'INST-1404-0007',
      customerName: 'مهندس آرش ابراهیمی',
      phone: '09127778899',
      address: 'تهران، اقدسیه، گلستان شمالی، برج بهشت',
      driver: 'علی قنبری',
      installer: 'مهرداد کریمی',
      status: 'LOADED',
      notes: 'بسته‌بندی یونیت‌های پنت‌هاوس با ضربه‌گیر و پلاستیک حبابدار',
    },
    {
      orderNumber: 'INST-1404-0008',
      customerName: 'خانم مهندس کاشانی',
      phone: '09128889900',
      address: 'تهران، یوسف‌آباد، خیابان شصت و چهارم، پلاک ۵',
      driver: 'علی قنبری',
      installer: 'پیمان حسنی',
      status: 'SCHEDULED',
      notes: 'اعزام اکیپ نصب تی‌وی وال و لاین نوری برای فردا صبح ساعت ۹',
    },
    {
      orderNumber: 'INST-1404-0009',
      customerName: 'دکتر رستمی (داروخانه)',
      phone: '09129990011',
      address: 'تهران، میدان ونک، ابتدای ملاصدرا، پلاک ۱۲',
      driver: 'محمد احمدی',
      installer: 'مجید کاظمی',
      status: 'IN_TRANSIT',
      notes: 'حمل قفسه‌بندی‌های مدولار و کانتر پذیرش مشتری',
    },
    {
      orderNumber: 'INST-1404-0010',
      customerName: 'دکتر نادر رادفر',
      phone: '09121010101',
      address: 'تهران، شهرک غرب، فاز ۱، خیابان مهستان',
      driver: 'علی قنبری',
      installer: 'مجید کاظمی',
      status: 'COMPLETED',
      notes: 'نصب کابینت مدرن دوپله و تسویه نهایی چک تضمین کیفیت',
    },
  ];

  for (const inst of tenInstallations) {
    await prisma.installationOrder.upsert({
      where: { orderNumber: inst.orderNumber },
      update: {
        customerName: inst.customerName,
        contactPhone: inst.phone,
        projectAddress: inst.address,
        driverName: inst.driver,
        installerLead: inst.installer,
        status: inst.status,
        completionNotes: inst.notes,
      },
      create: {
        orderNumber: inst.orderNumber,
        customerName: inst.customerName,
        contactPhone: inst.phone,
        projectAddress: inst.address,
        driverName: inst.driver,
        installerLead: inst.installer,
        status: inst.status,
        scheduledDate: new Date(),
        actualCompletedDate: inst.status === 'COMPLETED' ? new Date() : null,
        completionNotes: inst.notes,
        customerSignature: inst.status === 'COMPLETED',
      },
    });
  }
  console.log('✅ 10 Daily Dispatch & Deliveries successfully scheduled/active in logistics.');

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. ۵ وقت اندازه‌گیری و بازدید لیزری در محل (5 On-Site Measurement & Survey Appointments)
  // ─────────────────────────────────────────────────────────────────────────────
  const measurementVisits = [
    {
      orderNumber: 'SRV-1404-001',
      customerName: 'مهندس پویا بهرامی',
      phone: '09123456789',
      address: 'البرز، کردان، دهکده ویلایی کاکتوس، قطعه ۲۴',
      notes: 'برداشت لیزری و اندازه‌گیری پلان آشپزخانه دوبلکس و کلوزت روم (۴۵ متر طول)',
      surveyor: 'سارا افشار (هماهنگ‌کننده) / مجید کاظمی (تکنسین فنی)',
    },
    {
      orderNumber: 'SRV-1404-002',
      customerName: 'خانم دکتر پریسا حسنی',
      phone: '09124567890',
      address: 'تهران، ظفر، خیابان نفت شمالی، پلاک ۴۲، واحد ۵',
      notes: 'بازدید تأسیساتی، چک لوله‌کشی آب و گاز و برداشت ابعاد جزیره و مطبخ',
      surveyor: 'سارا افشار (هماهنگ‌کننده) / مجید کاظمی (تکنسین فنی)',
    },
    {
      orderNumber: 'SRV-1404-003',
      customerName: 'آقای داریوش فرهمند',
      phone: '09125678901',
      address: 'تهران، قیطریه، پارک قیطریه، خیابان روشنایی',
      notes: 'اندازه‌گیری ابعاد تی‌وی وال، باکس‌های نوری و بازسازی کمدهای ریلی',
      surveyor: 'سارا افشار (هماهنگ‌کننده) / مهرداد کریمی',
    },
    {
      orderNumber: 'SRV-1404-004',
      customerName: 'مهندس آرین نامدار',
      phone: '09126789012',
      address: 'تهران، بلوار اندرزگو، خیابان سلیمی شمالی، برج باغ یاس',
      notes: 'برداشت نقشه‌های سه‌بعدی پنت‌هاوس: آشپزخانه کثیف، لاندری و کلوزت مستر',
      surveyor: 'سارا افشار (هماهنگ‌کننده) / مجید کاظمی (تکنسین فنی)',
    },
    {
      orderNumber: 'SRV-1404-005',
      customerName: 'شرکت بازرگانی آریا (شوروم)',
      phone: '09127890123',
      address: 'تهران، میدان ونک، خیابان گاندی، ساختمان تجارت آریا',
      notes: 'کارشناسی فنی و برداشت ابعاد کانتر رسپشن، پارتیشن و دکوراتیو چوبی',
      surveyor: 'سارا افشار (هماهنگ‌کننده) / پیمان حسنی',
    },
  ];

  for (const mv of measurementVisits) {
    await prisma.installationOrder.upsert({
      where: { orderNumber: mv.orderNumber },
      update: {
        customerName: mv.customerName,
        contactPhone: mv.phone,
        projectAddress: mv.address,
        installerLead: mv.surveyor,
        status: 'SCHEDULED',
        completionNotes: `[نوبت کارشناسی و اندازه‌گیری لیزری] ${mv.notes}`,
      },
      create: {
        orderNumber: mv.orderNumber,
        customerName: mv.customerName,
        contactPhone: mv.phone,
        projectAddress: mv.address,
        installerLead: mv.surveyor,
        status: 'SCHEDULED',
        scheduledDate: new Date(),
        completionNotes: `[نوبت کارشناسی و اندازه‌گیری لیزری] ${mv.notes}`,
      },
    });

    // ثبت پیام در کانال عمومی جهت اطلاع واحد هماهنگی
    const saraUserId = userMap.get('sara.afshar');
    if (saraUserId) {
      await prisma.staffNotification.create({
        data: {
          recipientId: saraUserId,
          title: `نوبت اندازه‌گیری لیزری: ${mv.customerName}`,
          message: `${mv.address} - ${mv.notes}`,
          type: 'TASK',
          linkUrl: '/worker/installations',
        },
      });
    }
  }
  console.log('✅ 5 On-site Laser Measurement & Survey Appointments successfully scheduled.');

  console.log('🎉 Enterprise Simulation & Personnel Seed COMPLETED 100% SUCCESSFULLY!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding simulation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
