export const en = {
    app: {
        name: "Invoice Scanner",
        workspace: "Workspace"
    },
    nav: {
        dashboard: "Dashboard",
        history: "History"
    },
    dashboard: {
        welcome: "Welcome Back",
        subtitle: "Here's what's happening with your invoices.",
        stats: {
            total_invoices: "Total Invoices",
            total_volume: "Total Volume",
            new_invoices: "New Invoices Found",
            emails_scanned: "Emails Scanned"
        }
    },
    scan: {
        title: "Run New Scan",
        subtitle: "Select a date range to check for invoices in your Gmail",
        date_range: "Date Range",
        start_date: "Start Date",
        end_date: "End Date",
        button: "Scan Now",
        scanning: "Scanning...",
        results_title: "Scanning your inbox...",
        results_desc: "This might take a moment depending on the date range and number of emails.",
        shortcuts: {
            this_month: "This Month",
            last_month: "Last Month",
            this_year: "This Year",
            last_year: "Last Year"
        },
        clear_selection: "Clear Selection",
        done: "Done",
        quick_select: "Quick Select"
    },
    history: {
        title: "Invoice History",
        subtitle: "Manage, categorize, and export your invoices.",
        add_manual: "Add Manual Invoice",
        export_csv: "Export CSV"
    },
    labels: {
        title: "Manage Labels",
        add: "Add",
        placeholder: "New label name...",
        no_labels: "No labels created yet."
    },
    filters: {
        search_placeholder: "Search invoices...",
        all_vendors: "All Vendors",
        all_labels: "All Labels",
        status: {
            all: "All Statuses",
            pending: "Pending",
            warning: "Warning",
            processed: "Processed",
            cancelled: "Cancelled"
        }
    },
    table: {
        date: "Date",
        vendor: "Vendor",
        amount: "Amount",
        status: "Status",
        actions: "Actions",
        subject: "Subject",
        labels: "Labels",
        comments: "Comments",
        add_comment: "Add a comment...",
        no_labels: "No labels",
        no_invoices: "No invoices found matching your filters."
    },
    status: {
        pending: "Pending",
        warning: "Warning",
        processed: "Processed",
        cancelled: "Cancelled"
    },
    auth: {
        connected_as: "Connected as",
        logout: "Logout",
        logout_confirm: "Are you sure you want to logout? You will need to re-authenticate with Google.",
        connect: "Login with Gmail"
    },
    actions: {
        edit: "Edit",
        save: "Save",
        cancel: "Cancel",
        delete: "Delete",
        delete_selected: "Delete Selected",
        mark_processed: "Mark Processed",
        mark_pending: "Mark Pending",
        mark_warning: "Mark Warning",
        mark_cancelled: "Mark Cancelled",
        selected: "Selected",
        add_label: "Add Label"
    },
    manual: {
        title: "Add Manual Invoice",
        upload_title: "Upload Invoice File",
        upload_desc: "Drag & drop a PDF, JPG, or PNG file here, or click to browse",
        drag_active: "Drop the file here...",
        or_divider: "OR ENTER DETAILS MANUALLY",
        vendor_label: "Vendor Name",
        date_label: "Invoice Date",
        amount_label: "Amount (ILS)",
        currency_label: "Currency",
        currency: "Currency",
        submit: "Add Invoice",
        add_button: "Add Invoice",
        creating: "Creating...",
        submitting: "Adding...",
        success: "Invoice added successfully",
        file_placeholder: "Click or drag file here",
        file_change: "Change file",
        vendor_placeholder: "Vendor Name (e.g. Acme Corp)",
        subject: "Subject",
        subject_placeholder: "Transaction details (optional)",
        select_label: "Select Label...",
        date_required: "Please select a date"
    },
    common: {
        loading: "Loading...",
        error: "Error",
        full_preview: "Full Preview"
    },
    rules: {
        title: "Automation Rules",
        subtitle: "Define rules to automatically process incoming invoices.",
        create_new: "Create New Rule",
        create_first: "Create your first rule",
        no_rules: "No rules defined yet.",
        error_fetching: "Failed to load rules",
        error_saving: "Failed to save rule",
        error_deleting: "Failed to delete rule",
        delete_confirm: "Are you sure you want to delete this rule?",
        edit_rule: "Edit Rule",
        create_rule: "Create Rule",
        rule_name: "Rule Name",
        is_active: "Active",
        conditions: "Conditions",
        actions: "Actions",
        select_field: "Select Field",
        select_operator: "Select Operator",
        select_action: "Select Action",
        select_label: "Select Label..."
    },
    pagination: {
        rows_per_page: "Rows per page",
        page_x_of_y: "Page {current} of {total}",
        previous: "Previous",
        next: "Next"
    }
};

// Force update
