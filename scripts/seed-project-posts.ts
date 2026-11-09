import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.projectPost.count();
  if (count > 0) {
    console.log(`Already have ${count} project posts.`);
    return;
  }

  const post1 = await prisma.projectPost.create({
    data: {
      title: "نصب کابینت سوپرلوکس پولیشی و جزیره دو تکه نیاوران",
      description: "اجرای کامل بدنه با MDF سفید صابونی آرین سینا، درب‌های رنگ پولیش پلی‌اورتان سفید شیری، ریل‌های تندم بلوم اتریش و نورپردازی خطی مخفی هوشمند.",
      installerName: "استاد حمید رضایی (سرپرست تیم نصب)",
      category: "CABINET",
      likesCount: 14,
      photos: [
        "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1200&q=80",
      ],
      comments: {
        create: [
          {
            author: "مهندس فرزاد معتمدی",
            role: "سرپرست تولید و CNC",
            text: "دقت شیارهای درب نئوکلاسیک و گونیایی باکس‌ها در محل پروژه عالی اجرا شده، خدا قوت به تیم نصب.",
          },
          {
            author: "علی کمالی",
            role: "کنترل کیفی QC",
            text: "رگلاژ لولاها و عدم تابیدگی درب‌ها تایید شد. نمره کنترل کیفیت: ۱۰۰ از ۱۰۰.",
          },
        ],
      },
    },
  });

  const post2 = await prisma.projectPost.create({
    data: {
      title: "واک‌این کلوزت و کمدهای دیواری فرامید ولنجک",
      description: "طراحی و اجرای ۲۴ مترمربع فضای رختکن با ورق‌های کتان فرامید مات، اکسسوری‌های آویز کراوات و شلوار آرام‌بند، همراه با آینه‌های قدی بک‌لایت.",
      installerName: "مرتضی صالحی",
      category: "CLOSET",
      likesCount: 9,
      photos: [
        "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
      ],
      comments: {
        create: [
          {
            author: "مدیر بازرگانی",
            role: "مدیر فروش",
            text: "کارفرما جناب حسینی بسیار راضی بودند و تسویه نهایی مرحله سوم نیز در حسابداری ثبت شد.",
          },
        ],
      },
    },
  });

  console.log("Seeded project posts:", post1.id, post2.id);
}

main().finally(() => prisma.$disconnect());
