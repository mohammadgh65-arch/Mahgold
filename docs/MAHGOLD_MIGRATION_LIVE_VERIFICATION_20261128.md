# مه‌گلد — گزارش راستی‌آزمایی مهاجرت (۲۸ نوامبر ۲۰۲۶)

## دامنه بررسی
این گزارش بر اساس بررسی مستقیم GitHub Actions و اتصال خواندنی به پروژه Supabase با نام Mahsa-gold تهیه شده است. هیچ migration جدیدی اجرا نشده، هیچ سفارش آزمایشی ساخته نشده، هیچ محصول/قیمتی تغییر نکرده و هیچ deployment یا merge به شاخه اصلی انجام نشده است.

## نتیجه فعلی

### ساخت و پیش‌نمایش
- سه workflow ساخت با Node.js 22 همسان شدند.
- در نخستین اجرای اصلاح‌شده، `npm ci` شکست خورد چون `package-lock.json` با `package.json` هماهنگ نبود.
- برای بازکردن مسیر ساخت، workflowها به `npm install --no-audit --no-fund` برگشتند. این رفع مانع CI است؛ قفل وابستگی‌ها هنوز باید در یک مرحله مستقل و کنترل‌شده همگام شود.
- روی commit `a823957d0243600c6f3fd8eb463611183e8737ab` هر سه workflow موفق شدند:
  - Build Mahgold
  - Independent storefront build and private preview
  - Mahgold admin-only private preview
- Artifact پیش‌نمایش فروشگاه با نام `mahgold-private-preview` تولید شده (حدود 2.85 MB؛ نگهداری ۱۴ روز).
- Artifact پنل مدیر با نام `mahgold-admin-only-preview` تولید شده (حدود 2.85 MB؛ نگهداری ۱۴ روز).
- لینک اجرای موفق فروشگاه: https://github.com/mohammadgh65-arch/Mahgold/actions/runs/46080013490
- لینک اجرای موفق پنل مدیر: https://github.com/mohammadgh65-arch/Mahgold/actions/runs/46080013429

## بررسی زنده و خواندنی Supabase
- پروژه `nzvvvpbwavaodhxrnkdr` در وضعیت `ACTIVE_HEALTHY` و PostgreSQL 17 است.
- Migration history زنده تا `20261126203802` ثبت شده؛ تاریخچه شامل تغییرات مرتبط با قیمت‌گذاری، ثبت سفارش idempotent، محافظ پرداخت، رهگیری سفارش، آرشیو و soft-delete است.
- جدول‌های اصلی وجود دارند و RLS برای همه جدول‌های مشاهده‌شده در public فعال است.
- `mahgold_create_order_secure`، `mahgold_create_order_idempotent` و `zarin_is_admin` در دیتابیس وجود دارند؛ بنابراین blocker قدیمی «تابع secure سفارش موجود نیست» در وضعیت فعلی زنده برقرار نیست.
- تابع idempotent به تابع secure واگذار می‌کند و قیمت مورد انتظار و freshness نرخ را بررسی می‌کند. مسیر secure، رزرو موجودی و وضعیت `awaiting_payment` را ایجاد می‌کند؛ پرداخت واقعی از این بررسی اثبات نشده است.
- Trigger قیمت محصول در دیتابیس موجود است: `trg_mahgold_product_price`؛ trigger زمان به‌روزرسانی و MFA قیمت‌گذاری نیز وجود دارند.
- تعدادهای مشاهده‌شده: ۲۱ محصول، ۷ نرخ، ۲ سفارش، ۲ آیتم سفارش، ۲ رزرو، ۱ آیتم سبد، ۳ پروفایل. این شمارش فقط برای سلامت ساختار است و داده‌ها تغییر نکردند.

## موانع باقیمانده پیش از اعلام مهاجرت کامل

1. **همگام‌سازی lockfile:** اجرای `npm ci` شکست قبلی را نشان داد. فایل lock باید در محیط npm سازگار regenerate و commit شود؛ سپس workflowها دوباره با `npm ci` اجرا شوند.
2. **انتشار کنترل‌شده:** شاخه آزمایشی هنوز به main یا هاست production merge/deploy نشده است. ابتدا preview را در مرورگر موبایل بررسی کنید: ورود مدیر، مسیر مستقیم `/admin`، محصول، سبد، قیمت و واکنش‌گرایی.
3. **آزمون پرداخت end-to-end:** migration فعلی پرداخت تأییدنشده را مسدود می‌کند. تا وقتی درگاه، callback امن، تأیید server-side، ثبت reference، idempotency و reconciliation پیاده نشده و در sandbox آزمون نشده‌اند، سفارش را paid نکنید و پرداخت واقعی را فعال نکنید.
4. **تأمین‌کننده قیمت:** وضعیت اتصال provider در `store_settings` باید در پنل بررسی شود؛ نرخ دستی/خودکار، timestamp و freshness در خرید خودکار آزمون شوند. هیچ قیمت آزمایشی یا دستی تغییر داده نشده است.
5. **پایش امنیتی:** Security advisor هشدار می‌دهد leaked-password protection خاموش است. فعال‌سازی آن در Auth Dashboard نیازمند اقدام مدیر است.
6. **تست نقش مدیر:** تست عملی با حساب مدیر AAL2 و حساب مشتری عادی، بدون تغییر داده واقعی، باید انجام شود؛ به‌خصوص CRUD محصول، نرخ، سفارش و دسترسی مشتری به سفارش خودش.
7. **SEO و مسیرهای مستقیم:** meta محصول در React به‌صورت client-side درج می‌شود. قبل از نشر، صفحات محصول، canonical/OG/JSON-LD و پیش‌نمایش پیام‌رسان‌ها در پاسخ خام یا راهکار prerender مناسب اعتبارسنجی شوند.
8. **بازبینی advisories:** گزارش performance شامل یک FK بدون index و چند هشدار سیاست RLS/index است. قبل از تغییر، با queryهای واقعی و plan سنجیده شود؛ indexهای unused را صرفاً بر اساس هشدار حذف نکنید.

## وضعیت نهایی
**ساخت و artifact پیش‌نمایش: موفق.**
**وجود schema و migration history در Supabase: تأیید خواندنی.**
**مهاجرت production و پرداخت زنده: هنوز تأیید نشده/انجام نشده.**

برای تکمیل واقعی، ترتیب امن این است: lockfile → بررسی preview موبایل و نقش‌ها → پرداخت sandbox → قیمت و رزرو → SEO → backup/rollback plan → تأیید صریح انتشار و سپس deploy.
