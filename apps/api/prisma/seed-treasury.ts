import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏦 Seeding Treasury & Sayad Cheques data...');

  // ۱. حساب‌های خزانه‌داری (بانک‌ها، صندوق‌ها، تنخواه)
  const accountsData = [
    {
      name: 'بانک ملت — حساب جاری جام (شعبه مرکزی)',
      type: 'BANK',
      accountNumber: '4820194821',
      iban: 'IR480120000000004820194821',
      bankName: 'بانک ملت',
      branchName: 'شعبه مرکزی نیاوران (کد ۶۵۴)',
      balance: 3850000000, // ریال (۳۸۵ میلیون تومان)
      posTerminalId: 'POS-MLT-9821',
      notes: 'حساب اصلی واریز وجوه فروش و وصول چک‌ها',
    },
    {
      name: 'بانک سامان — حساب کارت‌خوان فروشگاه',
      type: 'BANK',
      accountNumber: '821093481',
      iban: 'IR820560000000008210934810',
      bankName: 'بانک سامان',
      branchName: 'شعبه میرداماد',
      balance: 1425000000, // ریال (۱۴۲.۵ میلیون تومان)
      posTerminalId: 'POS-SMN-4421',
      notes: 'متصل به دستگاه‌های POS فروشگاهی صندوق',
    },
    {
      name: 'بانک صادرات — جاری دسته‌چک‌های پرداختی',
      type: 'BANK',
      accountNumber: '0204918239001',
      iban: 'IR020190000000204918239001',
      bankName: 'بانک صادرات',
      branchName: 'شعبه ونک',
      balance: 980000000, // ریال
      notes: 'جهت صدور چک‌های خرید متریال کارخانه',
    },
    {
      name: 'صندوق نقدی مرکزی شرکت',
      type: 'CASH_DESK',
      balance: 150000000, // ۱۵ میلیون تومان نقد
      notes: 'صندوق گاوصندوق دفتر مرکزی',
    },
    {
      name: 'تنخواه‌گردان کارخانه و خط تولید',
      type: 'PETTY_CASH',
      balance: 80000000, // ۸ میلیون تومان
      notes: 'هزینه‌های جاری کارگاه، باربری خرد و ابزارآلات',
    },
  ];

  const createdAccounts: any[] = [];
  for (const acc of accountsData) {
    const existing = await prisma.treasuryAccount.findFirst({
      where: { name: acc.name },
    });
    if (existing) {
      createdAccounts.push(existing);
    } else {
      const created = await prisma.treasuryAccount.create({ data: acc });
      createdAccounts.push(created);
    }
  }
  console.log(`✅ Seeded ${createdAccounts.length} Treasury Accounts.`);

  const mellatAccount = createdAccounts[0];

  // ۲. چک‌های صیادی پیشرفته (Sayad Cheques)
  const now = new Date();
  const chequesData = [
    {
      number: '481920',
      sayadId: '1209384756102938',
      chequeType: 'RECEIVABLE',
      amount: 450000000, // ۴۵ میلیون تومان
      bankName: 'بانک ملی ایران',
      branch: 'شعبه تجریش',
      holderName: 'مهندس محمدرضا شریفی',
      drawerNationalId: '0019283746',
      dueDate: new Date(now.getTime() + 3 * 24 * 3600 * 1000), // سررسید ۳ روز دیگر
      status: 'IN_HAND' as const,
      note: 'بابت قسط اول پروژه کمد دیواری نیاوران',
    },
    {
      number: '928371',
      sayadId: '7721839401928374',
      chequeType: 'RECEIVABLE',
      amount: 820000000, // ۸۲ میلیون تومان
      bankName: 'بانک پاسارگاد',
      branch: 'شعبه سعادت‌آباد',
      holderName: 'شرکت ساختمانی آرمان بنا',
      drawerNationalId: '10103948291',
      dueDate: new Date(now.getTime() + 1 * 24 * 3600 * 1000), // سررسید فردا
      status: 'DEPOSITED' as const,
      targetAccountId: mellatAccount.id,
      note: 'واگذار شده به بانک ملت جهت وصول فردا',
    },
    {
      number: '102938',
      sayadId: '5519283746192837',
      chequeType: 'RECEIVABLE',
      amount: 350000000, // ۳۵ میلیون تومان
      bankName: 'بانک تجارت',
      branch: 'شعبه ستارخان',
      holderName: 'علیرضا حسینی',
      drawerNationalId: '0071928374',
      dueDate: new Date(now.getTime() - 2 * 24 * 3600 * 1000), // ۲ روز قبل
      status: 'CASHED' as const,
      targetAccountId: mellatAccount.id,
      settledAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
      note: 'وصول موفق به حساب جاری بانک ملت',
    },
    {
      number: '662819',
      sayadId: '9918273645102938',
      chequeType: 'RECEIVABLE',
      amount: 600000000, // ۶۰ میلیون تومان
      bankName: 'بانک ملت',
      branch: 'شعبه قلهک',
      holderName: 'حامد اسدی (آریا چوب)',
      drawerNationalId: '0062839182',
      dueDate: new Date(now.getTime() - 5 * 24 * 3600 * 1000),
      status: 'BOUNCED' as const,
      bouncedAt: new Date(now.getTime() - 4 * 24 * 3600 * 1000),
      bounceReason: 'کسر موجودی در تاریخ سررسید (گواهی عدم پرداخت شماره ۸۹۲۱)',
      note: 'در حال پیگیری حقوقی و تماس با صاحب حساب',
    },
    {
      number: '339182',
      sayadId: '4410293847561928',
      chequeType: 'RECEIVABLE',
      amount: 520000000, // ۵۲ میلیون تومان
      bankName: 'بانک سامان',
      branch: 'شعبه اقدسیه',
      holderName: 'دکتر فرشید کاظمی',
      drawerNationalId: '0059182736',
      dueDate: new Date(now.getTime() + 14 * 24 * 3600 * 1000),
      status: 'PASSED' as const,
      endorsedTo: 'شرکت ورق‌های صنعتی آرین سینا (تأمین‌کننده ام‌دی‌اف)',
      endorsedAt: new Date(now.getTime() - 1 * 24 * 3600 * 1000),
      note: 'خرج شد بابت خرید تریلی پالت MDF سفید ۱۶ میل',
    },
  ];

  for (const ch of chequesData) {
    const existing = await prisma.cheque.findFirst({
      where: { number: ch.number },
    });
    if (!existing) {
      await prisma.cheque.create({
        data: ch,
      });
    }
  }
  console.log(`✅ Seeded ${chequesData.length} Sayad Cheques.`);

  // ۳. تراکنش انتقال بین‌حسابی
  const existingTr = await prisma.treasuryTransaction.findFirst({
    where: { transactionNumber: 'TR-1404-0001' },
  });

  if (!existingTr && createdAccounts.length >= 2) {
    await prisma.treasuryTransaction.create({
      data: {
        transactionNumber: 'TR-1404-0001',
        type: 'TRANSFER',
        sourceAccountId: createdAccounts[0].id,
        targetAccountId: createdAccounts[3].id,
        amount: 200000000, // ۲۰ میلیون تومان
        trackingCode: 'MLT-TR-98214',
        transactionDate: new Date(),
        description: 'تأمین نقدینگی صندوق شرکت از حساب جاری بانک ملت',
      },
    });
    console.log('✅ Seeded Treasury Transfer transaction TR-1404-0001.');
  }

  console.log('🎉 Treasury and Sayad Cheques seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding treasury:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
