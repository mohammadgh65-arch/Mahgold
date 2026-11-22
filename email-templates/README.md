# قالب‌های ایمیل تراکنشی مه‌گلد

این پوشه شامل قالب‌های HTML مستقل با چیدمان فارسی راست‌به‌چپ است.

## فایل‌ها
- `mahgold-transactional-base.html`: قالب پایه عمومی
- `mahgold-welcome.html`: خوش‌آمدگویی پس از ایجاد حساب
- `mahgold-password-reset.html`: بازنشانی رمز عبور
- `mahgold-email-verification.html`: تأیید نشانی ایمیل
- `mahgold-account-notice.html`: اطلاعیه عمومی حساب

## متغیرها
- خوش‌آمدگویی: `customer_name`, `action_url`
- بازنشانی رمز: `customer_name`, `expiry_minutes`, `reset_url`
- تأیید ایمیل: `customer_name`, `expiry_minutes`, `verification_url`
- اطلاعیه حساب: `email_heading`, `customer_name`, `email_message`, `action_url`

## تنظیمات ضروری Mailjet
برای تفسیر متغیرها در Send API v3.1 مقدار `TemplateLanguage: true` و شیء `Variables` را ارسال کنید. در SMTP نیز هدر `X-MJ-TemplateLanguage: true` لازم است.

## نکات امنیتی و وضعیت اتصال
- پیوند بازنشانی رمز و تأیید ایمیل باید در سمت سرور تولید شوند، یک‌بارمصرف باشند و انقضای واقعی داشته باشند.
- نشانی پیش‌فرض داخل قالب فقط برای پیش‌نمایش است و نباید در ارسال واقعی جایگزین پیوند امن شود.
- این فایل‌ها هنوز به احراز هویت یا گردش سفارش مه‌گلد متصل نشده‌اند.
- قالب سفارش پس از فعال شدن فرایند واقعی سفارش و پرداخت جداگانه اضافه می‌شود.
