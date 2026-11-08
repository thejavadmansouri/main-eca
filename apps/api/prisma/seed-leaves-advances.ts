import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌿 Seeding realistic Leaves and Salary Advances for Kardo OS Personnel...');

  // پیدا کردن کاربران و مدیران
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  const employees = await prisma.employee.findMany({
    include: { user: true },
  });

  if (employees.length === 0) {
    console.log('⚠️ No employees found to seed leaves and advances.');
    return;
  }

  const empByCode = new Map<string, any>();
  const empByLastName = new Map<string, any>();
  for (const emp of employees) {
    empByCode.set(emp.personnelCode, emp);
    empByLastName.set(emp.lastName, emp);
  }

  // پرسنل کلیدی
  const reza = empByLastName.get('باقری') || employees[0];
  const behrouz = empByLastName.get('نجارزاده') || employees[1] || employees[0];
  const majid = empByLastName.get('کاظمی') || employees[2] || employees[0];
  const ali = empByLastName.get('قنبری') || employees[3] || employees[0];
  const sara = empByLastName.get('احمدی') || employees[4] || employees[0];

  console.log(`Found employees: ${reza.firstName} ${reza.lastName}, ${behrouz.firstName} ${behrouz.lastName}, ${majid.firstName} ${majid.lastName}, ${ali.firstName} ${ali.lastName}`);

  // نمونه عکس گواهی پزشکی برای استعلاجی
  const sampleMedicalCert = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280" viewBox="0 0 400 280"><rect width="400" height="280" fill="%23fdfaf6" stroke="%2338a169" stroke-width="4"/><text x="200" y="45" font-family="Tahoma" font-size="16" font-weight="bold" fill="%2322543d" text-anchor="middle">گواهی استراحت پزشکی و ارتوپدی</text><line x1="40" y1="65" x2="360" y2="65" stroke="%23cbd5e0" stroke-width="2"/><text x="350" y="105" font-family="Tahoma" font-size="13" fill="%232d3748" text-anchor="end">بیمار: آقای مجید کاظمی (نصاب کابینت)</text><text x="350" y="140" font-family="Tahoma" font-size="12" fill="%234a5568" text-anchor="end">تشخیص: کشیدگی تاندون مچ دست راست و لومباگو</text><text x="350" y="175" font-family="Tahoma" font-size="12" fill="%23e53e3e" font-weight="bold" text-anchor="end">توصیه: استراحت مطلق به مدت ۳ روز کاری</text><text x="350" y="210" font-family="Tahoma" font-size="11" fill="%23718096" text-anchor="end">تاریخ صدور: ۱۴۰۳/۱۱/۱۵ - نظام پزشکی: ۷۸۲۹۱</text><circle cx="80" cy="220" r="30" fill="none" stroke="%233182ce" stroke-width="3"/><text x="80" y="225" font-family="Tahoma" font-size="10" font-weight="bold" fill="%233182ce" text-anchor="middle">مهر پزشک</text></svg>';

  // ۱. ثبت مرخصی‌ها
  const sampleLeaves = [
    {
      employeeId: reza.id,
      leaveType: 'DAILY',
      startDate: new Date('2026-11-02T08:00:00Z'),
      endDate: new Date('2026-11-03T17:00:00Z'),
      days: 2,
      hours: 0,
      reason: 'امور اداری و شخصی خارج از استان',
      status: 'APPROVED',
      approvedById: adminUser?.id,
      approvedAt: new Date('2026-11-01T14:30:00Z'),
      managerNotes: 'موافقت شد. هماهنگی با شیفت صبح کارگاه برش انجام شده است.',
    },
    {
      employeeId: behrouz.id,
      leaveType: 'HOURLY',
      startDate: new Date('2026-11-06T10:00:00Z'),
      endDate: new Date('2026-11-06T13:00:00Z'),
      days: 0,
      hours: 3,
      reason: 'مراجعه به بانک و ثبت چک صیادی',
      status: 'APPROVED',
      approvedById: adminUser?.id,
      approvedAt: new Date('2026-11-06T09:15:00Z'),
      managerNotes: 'تایید شد.',
    },
    {
      employeeId: majid.id,
      leaveType: 'SICK',
      startDate: new Date('2026-11-07T08:00:00Z'),
      endDate: new Date('2026-11-09T17:00:00Z'),
      days: 3,
      hours: 0,
      reason: 'گرفتگی تاندون مچ دست و کمردرد ناشی از حمل صفحات MDF',
      medicalCertUrl: sampleMedicalCert,
      status: 'PENDING',
      managerNotes: null,
    },
    {
      employeeId: sara.id,
      leaveType: 'DAILY',
      startDate: new Date('2026-11-04T08:00:00Z'),
      endDate: new Date('2026-11-04T17:00:00Z'),
      days: 1,
      hours: 0,
      reason: 'امور درمانی و چکاپ سالانه',
      status: 'APPROVED',
      approvedById: adminUser?.id,
      approvedAt: new Date('2026-11-03T16:00:00Z'),
      managerNotes: 'موافقت شد. خانم کاظمی مسئولیت هماهنگی را به عهده دارند.',
    },
  ];

  for (const l of sampleLeaves) {
    const existing = await prisma.employeeLeave.findFirst({
      where: {
        employeeId: l.employeeId,
        startDate: l.startDate,
        leaveType: l.leaveType,
      },
    });
    if (!existing) {
      await prisma.employeeLeave.create({
        data: l,
      });
      console.log(`✅ Created leave: ${l.leaveType} for employee ${l.employeeId}`);
    }
  }

  // ۲. ثبت مساعده‌ها
  const sampleAdvances = [
    {
      employeeId: ali.id,
      amount: 20000000, // 20M Rials
      periodYear: 1403,
      periodMonth: 11,
      reason: 'مساعده بابت هزینه‌های درمانی دندانپزشکی',
      paymentMethod: 'TRANSFER',
      trackingCode: 'TRK-88491-PAYA',
      status: 'PAID',
      paidDate: new Date('2026-11-03T11:20:00Z'),
      approvedById: adminUser?.id,
      approvedAt: new Date('2026-11-02T16:00:00Z'),
    },
    {
      employeeId: reza.id,
      amount: 15000000, // 15M Rials
      periodYear: 1403,
      periodMonth: 11,
      reason: 'مساعده نیمه ماه بابت خرید لوازم منزل',
      paymentMethod: 'CARD',
      trackingCode: 'SHETAB-55219',
      status: 'PAID',
      paidDate: new Date('2026-11-04T14:10:00Z'),
      approvedById: adminUser?.id,
      approvedAt: new Date('2026-11-04T10:00:00Z'),
    },
    {
      employeeId: behrouz.id,
      amount: 10000000, // 10M Rials
      periodYear: 1403,
      periodMonth: 11,
      reason: 'تقاضای مساعده ضروری',
      paymentMethod: 'CARD',
      status: 'PENDING',
    },
    {
      employeeId: majid.id,
      amount: 12000000, // 12M Rials
      periodYear: 1403,
      periodMonth: 11,
      reason: 'مساعده بابت تعمیرات خودروی حمل ابزار',
      paymentMethod: 'TRANSFER',
      trackingCode: null,
      status: 'APPROVED',
      approvedById: adminUser?.id,
      approvedAt: new Date('2026-11-06T15:30:00Z'),
    },
  ];

  for (const a of sampleAdvances) {
    const existing = await prisma.salaryAdvance.findFirst({
      where: {
        employeeId: a.employeeId,
        periodYear: a.periodYear,
        periodMonth: a.periodMonth,
        amount: a.amount,
      },
    });
    if (!existing) {
      await prisma.salaryAdvance.create({
        data: a,
      });
      console.log(`💰 Created salary advance: ${a.amount} Rials for employee ${a.employeeId}`);
    }
  }

  console.log('🎉 Successfully seeded rich Leaves and Salary Advances!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding leaves and advances:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
