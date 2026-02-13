export const he = {
    app: {
        name: "סורק חשבוניות",
        workspace: "סביבת עבודה"
    },
    nav: {
        dashboard: "לוח בקרה",
        history: "היסטוריה"
    },
    dashboard: {
        welcome: "ברוך שובך",
        subtitle: "נהל את החשבוניות שלך בצורה חכמה.",
        stats: {
            total_invoices: "סה״כ חשבוניות",
            total_volume: "נפח כולל",
            new_invoices: "חשבוניות חדשות",
            emails_scanned: "מיילים נסרקו"
        }
    },
    scan: {
        title: "סריקה חדשה",
        subtitle: "בחר טווח תאריכים לסריקת חשבוניות ב-Gmail.",
        date_range: "טווח תאריכים",
        start_date: "תאריך התחלה",
        end_date: "תאריך סיום",
        button: "סרוק עכשיו",
        scanning: "סורק...",
        results_title: "סורק את תיבת הדואר...",
        results_desc: "זה עשוי לקחת רגע, תלוי בטווח התאריכים ובכמות המיילים.",
        shortcuts: {
            this_month: "החודש",
            last_month: "חודש שעבר",
            this_year: "השנה",
            last_year: "שנה שעברה"
        },
        clear_selection: "נקה בחירה",
        done: "סיום",
        quick_select: "בחירה מהירה"
    },
    history: {
        title: "היסטוריית חשבוניות",
        subtitle: "נהל, קטלג וייצא את החשבוניות שלך.",
        add_manual: "הוסף ידנית",
        export_csv: "ייצוא CSV"
    },
    labels: {
        title: "ניהול תגיות",
        add: "הוסף",
        placeholder: "שם תגית חדשה...",
        no_labels: "עוד לא נוצרו תגיות."
    },
    filters: {
        search_placeholder: "חפש חשבוניות...",
        all_vendors: "כל הספקים",
        all_labels: "כל התגיות",
        no_label: "ללא תגית",
        status: {
            all: "כל הסטטוסים",
            pending: "ממתין",
            warning: "אזהרה",
            processed: "טופל",
            cancelled: "בוטל"
        }
    },
    table: {
        date: "תאריך",
        vendor: "ספק",
        amount: "סכום",
        status: "סטטוס",
        actions: "פעולות",
        subject: "נושא",
        labels: "תגיות",
        comments: "הערות",
        add_comment: "הוסף הערה...",
        no_labels: "אין תגיות",
        no_invoices: "לא נמצאו חשבוניות התואמות לחיפוש."
    },
    status: {
        pending: "ממתין",
        warning: "אזהרה",
        processed: "טופל",
        cancelled: "בוטל"
    },
    auth: {
        connected_as: "מחובר כ-",
        logout: "התנתק",
        logout_confirm: "האם אתה בטוח שברצונך להתנתק? תצטרך להתחבר מחדש דרך גוגל.",
        connect: "התחברות עם Gmail"
    },
    actions: {
        edit: "ערוך",
        save: "שמור",
        cancel: "ביטול",
        delete: "מחק",
        delete_selected: "מחק בחירה",
        mark_processed: "סמן כטופל",
        mark_pending: "סמן כממתין",
        mark_warning: "סמן כאזהרה",
        mark_cancelled: "סמן כמבוטל",
        selected: "נבחרו",
        clear_filters: "נקה סינונים",
        add_label: "הוסף תווית"
    },
    manual: {
        title: "הוספת חשבונית ידנית",
        upload_title: "העלאת קובץ חשבונית",
        upload_desc: "גרור לכאן קובץ PDF, JPG או PNG, או לחץ לדפדוף",
        drag_active: "שחרר את הקובץ כאן...",
        or_divider: "או הזן פרטים ידנית",
        vendor_label: "שם הספק",
        date_label: "תאריך חשבונית",
        amount_label: "סכום (₪)",
        currency_label: "מטבע",
        currency: "מטבע",
        submit: "הוסף חשבונית",
        add_button: "הוסף חשבונית",
        creating: "יוצר...",
        submitting: "מוסיף...",
        success: "החשבונית נוספה בהצלחה",
        file_placeholder: "לחץ או גרור קובץ לכאן",
        file_change: "שינוי קובץ",
        vendor_placeholder: "שם הספק (לדוגמה: בזק)",
        subject: "נושא",
        subject_placeholder: "פירוט העסקה (אופציונלי)",
        date_required: "נא לבחור תאריך",
        select_label: "בחר תווית..."
    },
    common: {
        loading: "טוען...",
        error: "שגיאה",
        full_preview: "תצוגה מלאה"
    },
    rules: {
        title: "חוקי אוטומציה",
        subtitle: "הגדר חוקים לעיבוד אוטומטי של חשבוניות נכנסות.",
        create_new: "צור חוק חדש",
        create_first: "צור את החוק הראשון שלך",
        no_rules: "עדיין לא הוגדרו חוקים.",
        error_fetching: "שגיאה בטעינת החוקים",
        error_saving: "שגיאה בשמירת החוק",
        error_deleting: "שגיאה במחיקת החוק",
        delete_confirm: "האם אתה בטוח שברצונך למחוק חוק זה?",
        edit_rule: "ערוך חוק",
        create_rule: "צור חוק",
        rule_name: "שם החוק",
        is_active: "פעיל",
        conditions: "תנאים",
        actions: "פעולות",
        delete_invoice: "מחק חשבונית",
        delete_invoice_desc: "החשבונית תימחק לצמיתות",
        select_field: "בחר שדה",
        select_operator: "בחר אופרטור",
        select_action: "בחר פעולה",
        select_label: "בחר תגית...",
        apply_to_all: "הרץ חוקים על כל החשבוניות",
        apply_success: "החוקים הוחלו בהצלחה",
        apply_confirm: "האם אתה בטוח? פעולה זו תחיל את החוקים על כל החשבוניות הקיימות."
    },
    pagination: {
        rows_per_page: "שורות בעמוד",
        page_x_of_y: "עמוד {current} מתוך {total}",
        previous: "הקודם",
        next: "הבא"
    },
    analytics: {
        title: "לוח מחוונים",
        subtitle: "סקירה כללית של הוצאות ומגמות.",
        total_expenses: "סך הוצאות",
        total_invoices: "סה״כ חשבוניות",
        monthly_expenses: "הוצאות חודשיות",
        expenses_by_category: "הוצאות לפי קטגוריה",
        export_title: "ייצוא",
        export_png: "תמונה (PNG)",
        export_pdf: "דוח PDF",
        export_excel: "אקסל (XLSX)",
        no_data: "אין נתונים להציג עבור הטווח שנבחר."
    }
};
