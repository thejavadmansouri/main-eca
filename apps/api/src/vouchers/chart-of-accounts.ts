import { FixedAccount } from '@prisma/client';

export type AccountNature = 'DEBIT' | 'CREDIT';
export type AccountCategory = 'BALANCE_SHEET' | 'PROFIT_AND_LOSS';

export interface AccountMoeinDefinition {
  moeinCode: string;
  moeinName: string;
  fixedAccount: FixedAccount;
  nature: AccountNature;
  category: AccountCategory;
  description: string;
}

export interface AccountKolDefinition {
  kolCode: string;
  kolName: string;
  nature: AccountNature;
  category: AccountCategory;
  moeins: AccountMoeinDefinition[];
}

export interface AccountGroupDefinition {
  groupCode: string;
  groupName: string;
  nature: AccountNature;
  category: AccountCategory;
  kols: AccountKolDefinition[];
}

/**
 * درخت کدینگ استاندارد حسابداری سه سطحی (گروه، کل، معین) مطابق با استانداردهای حسابداری ایران
 * این ساختار حساب‌های ثابت (FixedAccount) را به ساختار استاندارد دفاتر مالی ایران نگاشت می‌کند.
 */
export const CHART_OF_ACCOUNTS: AccountGroupDefinition[] = [
  {
    groupCode: '1',
    groupName: 'دارایی‌های جاری',
    nature: 'DEBIT',
    category: 'BALANCE_SHEET',
    kols: [
      {
        kolCode: '101',
        kolName: 'موجودی نقد و بانک',
        nature: 'DEBIT',
        category: 'BALANCE_SHEET',
        moeins: [
          {
            moeinCode: '10101',
            moeinName: 'صندوق',
            fixedAccount: FixedAccount.CASH,
            nature: 'DEBIT',
            category: 'BALANCE_SHEET',
            description: 'وجوه نقد، تنخواه‌گردان و صندوق‌های فروشگاه/انبار',
          },
          {
            moeinCode: '10102',
            moeinName: 'حساب‌های بانکی',
            fixedAccount: FixedAccount.BANK,
            nature: 'DEBIT',
            category: 'BALANCE_SHEET',
            description: 'موجودی حساب‌های جاری و کوتاه‌مدت بانکی',
          },
        ],
      },
      {
        kolCode: '102',
        kolName: 'اسناد دریافتنی تجاری',
        nature: 'DEBIT',
        category: 'BALANCE_SHEET',
        moeins: [
          {
            moeinCode: '10201',
            moeinName: 'چک‌های دریافتی نزد صندوق',
            fixedAccount: FixedAccount.CHEQUES,
            nature: 'DEBIT',
            category: 'BALANCE_SHEET',
            description: 'چک‌های صیادی و عادی در جریان وصول دریافتی از مشتریان',
          },
        ],
      },
      {
        kolCode: '103',
        kolName: 'حساب‌های دریافتنی تجاری',
        nature: 'DEBIT',
        category: 'BALANCE_SHEET',
        moeins: [
          {
            moeinCode: '10301',
            moeinName: 'حساب مشتریان',
            fixedAccount: FixedAccount.CUSTOMERS,
            nature: 'DEBIT',
            category: 'BALANCE_SHEET',
            description: 'مطالبات از مشتریان بابت فروش نسیه کالا و خدمات',
          },
        ],
      },
      {
        kolCode: '104',
        kolName: 'موجودی کالا و مواد',
        nature: 'DEBIT',
        category: 'BALANCE_SHEET',
        moeins: [
          {
            moeinCode: '10401',
            moeinName: 'موجودی انبار کالا',
            fixedAccount: FixedAccount.INVENTORY,
            nature: 'DEBIT',
            category: 'BALANCE_SHEET',
            description: 'موجودی فیزیکی کالاهای انبار با ارزش تاریخی میانگین توزین‌شده',
          },
        ],
      },
    ],
  },
  {
    groupCode: '3',
    groupName: 'بدهی‌های جاری',
    nature: 'CREDIT',
    category: 'BALANCE_SHEET',
    kols: [
      {
        kolCode: '301',
        kolName: 'حساب‌های پرداختنی تجاری',
        nature: 'CREDIT',
        category: 'BALANCE_SHEET',
        moeins: [
          {
            moeinCode: '30101',
            moeinName: 'حساب تأمین‌کنندگان',
            fixedAccount: FixedAccount.SUPPLIERS,
            nature: 'CREDIT',
            category: 'BALANCE_SHEET',
            description: 'بدهی به تأمین‌کنندگان کالا و قطعات بابت فاکتورهای خرید',
          },
        ],
      },
      {
        kolCode: '302',
        kolName: 'سایر بستانکاران و اسناد پرداختنی',
        nature: 'CREDIT',
        category: 'BALANCE_SHEET',
        moeins: [
          {
            moeinCode: '30201',
            moeinName: 'بستانکاری و بازپرداخت مشتریان',
            fixedAccount: FixedAccount.REFUND_PAYABLE,
            nature: 'CREDIT',
            category: 'BALANCE_SHEET',
            description: 'مانده طلب مشتریان ناشی از مرجوعی، پیش‌دریافت یا واریزی مازاد',
          },
        ],
      },
    ],
  },
  {
    groupCode: '6',
    groupName: 'درآمدها و فروش',
    nature: 'CREDIT',
    category: 'PROFIT_AND_LOSS',
    kols: [
      {
        kolCode: '601',
        kolName: 'درآمد فروش ناخالص',
        nature: 'CREDIT',
        category: 'PROFIT_AND_LOSS',
        moeins: [
          {
            moeinCode: '60101',
            moeinName: 'فروش کالا و قطعات',
            fixedAccount: FixedAccount.SALES,
            nature: 'CREDIT',
            category: 'PROFIT_AND_LOSS',
            description: 'درآمد حاصل از فروش قطعات، کالاها و خدمات به نرخ فاکتور',
          },
        ],
      },
      {
        kolCode: '602',
        kolName: 'برگشت از فروش و تخفیفات',
        nature: 'DEBIT',
        category: 'PROFIT_AND_LOSS',
        moeins: [
          {
            moeinCode: '60201',
            moeinName: 'برگشت از فروش',
            fixedAccount: FixedAccount.SALES_RETURN,
            nature: 'DEBIT',
            category: 'PROFIT_AND_LOSS',
            description: 'مبلغ کالاهای مرجوع شده توسط خریداران',
          },
          {
            moeinCode: '60202',
            moeinName: 'تخفیفات اعطایی فروش',
            fixedAccount: FixedAccount.DISCOUNT,
            nature: 'DEBIT',
            category: 'PROFIT_AND_LOSS',
            description: 'تخفیفات ردیفی و پای فاکتور اعطاشده به مشتریان',
          },
        ],
      },
      {
        kolCode: '603',
        kolName: 'سایر درآمدهای عملیاتی',
        nature: 'CREDIT',
        category: 'PROFIT_AND_LOSS',
        moeins: [
          {
            moeinCode: '60301',
            moeinName: 'درآمد فروش مدت‌دار و سود اقساط',
            fixedAccount: FixedAccount.FINANCE_CHARGE,
            nature: 'CREDIT',
            category: 'PROFIT_AND_LOSS',
            description: 'مابه‌التفاوت نرخ فروش مدت‌دار نقدی و اقساطی/چکی',
          },
        ],
      },
    ],
  },
  {
    groupCode: '7',
    groupName: 'بهای تمام‌شده کالای فروش‌رفته',
    nature: 'DEBIT',
    category: 'PROFIT_AND_LOSS',
    kols: [
      {
        kolCode: '701',
        kolName: 'بهای تمام‌شده کالای فروش‌رفته',
        nature: 'DEBIT',
        category: 'PROFIT_AND_LOSS',
        moeins: [
          {
            moeinCode: '70101',
            moeinName: 'بهای تمام‌شده کالا و قطعات فروخته‌شده',
            fixedAccount: FixedAccount.COGS,
            nature: 'DEBIT',
            category: 'PROFIT_AND_LOSS',
            description: 'ارزش تاریخی کالاهای خارج‌شده از انبار بر اساس FIFO یا میانگین موزون',
          },
        ],
      },
    ],
  },
];

/** مپ سریع بر اساس کلید FixedAccount */
export const ACCOUNT_MAPPING: Record<
  FixedAccount,
  {
    groupCode: string;
    groupName: string;
    kolCode: string;
    kolName: string;
    moeinCode: string;
    moeinName: string;
    nature: AccountNature;
    category: AccountCategory;
    description: string;
  }
> = (() => {
  const map: Partial<
    Record<
      FixedAccount,
      {
        groupCode: string;
        groupName: string;
        kolCode: string;
        kolName: string;
        moeinCode: string;
        moeinName: string;
        nature: AccountNature;
        category: AccountCategory;
        description: string;
      }
    >
  > = {};

  for (const group of CHART_OF_ACCOUNTS) {
    for (const kol of group.kols) {
      for (const moein of kol.moeins) {
        map[moein.fixedAccount] = {
          groupCode: group.groupCode,
          groupName: group.groupName,
          kolCode: kol.kolCode,
          kolName: kol.kolName,
          moeinCode: moein.moeinCode,
          moeinName: moein.moeinName,
          nature: moein.nature,
          category: moein.category,
          description: moein.description,
        };
      }
    }
  }

  return map as Record<
    FixedAccount,
    {
      groupCode: string;
      groupName: string;
      kolCode: string;
      kolName: string;
      moeinCode: string;
      moeinName: string;
      nature: AccountNature;
      category: AccountCategory;
      description: string;
    }
  >;
})();
