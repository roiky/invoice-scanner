import os
import io
import zipfile
from datetime import datetime
from typing import List
import arabic_reshaper
from bidi.algorithm import get_display
from backend.services.pdf_utils import generate_pdf_from_html
from jinja2 import Template

# Template for PDF
# Note: Fonts are handled globally by pdf_utils, which injects the necessary CSS.
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @page {
            size: A4;
            margin: 1cm;
        }
        /* Body font set by pdf_utils, but we align text here */
        body {
            font-size: 12px;
            /* CRITICAL: Force LTR direction to prevent xhtml2pdf from reversing English text */
            direction: ltr;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .meta {
            margin-bottom: 20px;
            text-align: right;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            direction: ltr; /* Ensure table doesn't reverse columns/text */
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right; /* RTL alignment for Hebrew feel */
        }
        th {
            background-color: #f2f2f2;
        }
        .rtl {
            direction: rtl;
        }
        .amount {
            text-align: left; /* LTR for numbers looks better usually, or keep right */
            direction: ltr;
            font-family: monospace;
        }
        .footer {
            margin-top: 30px;
            text-align: right;
            font-weight: bold;
            font-size: 14px;
        }
    </style>
</head>
<body dir="ltr">
    <div class="header">
        <h1>Invoice Report</h1>
        <p>Generated on: {{ generation_date }}</p>
    </div>

    <div class="meta">
        <p><strong>Total Invoices:</strong> {{ total_count }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Vendor</th>
                <th>Subject</th>
                <th>Status</th>
                <th>VAT</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            {% for inv in invoices %}
            <tr>
                <td>{{ inv.date }}</td>
                <td>{{ inv.vendor }}</td>
                <td>{{ inv.subject }}</td>
                <td>{{ inv.status }}</td>
                <td class="amount">{{ inv.vat }}</td>
                <td class="amount">{{ inv.total }}</td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <div class="footer">
        <p>Total Amount (ILS): {{ total_sum }}</p>
        <p>Total VAT (ILS): {{ total_vat }}</p>
    </div>
</body>
</html>
"""

def fix_hebrew(text):
    if not text:
        return ""
    try:
        reshaped_text = arabic_reshaper.reshape(text)
        bidi_text = get_display(reshaped_text)
        return bidi_text
    except Exception:
        return text

def format_currency(amount, currency="ILS"):
    if amount is None:
        return "0.00"
    return f"{amount:,.2f} {currency}"

def generate_pdf_report(invoices: List[dict]) -> bytes:
    # Prepare data for template
    processed_invoices = []
    total_sum = 0
    total_vat = 0

    for inv in invoices:
        amount = inv.get('total_amount', 0) or 0
        vat = inv.get('vat_amount', 0) or 0
        currency = inv.get('currency', 'ILS')
        
        # Simple summation (assuming mainly ILS for now)
        if currency == 'ILS':
            total_sum += amount
            total_vat += vat

        processed_invoices.append({
            'date': inv.get('invoice_date', ''),
            'vendor': fix_hebrew(inv.get('vendor_name', '-')),
            # Truncate long subjects
            'subject': fix_hebrew(inv.get('subject', '')[:50] + '...' if len(inv.get('subject', '')) > 50 else inv.get('subject', '')),
            'status': inv.get('status', 'Pending'),
            'vat': f"{vat:,.2f} {currency}",
            'total': f"{amount:,.2f} {currency}"
        })

    template = Template(HTML_TEMPLATE)
    html_content = template.render(
        generation_date=datetime.now().strftime("%d/%m/%Y %H:%M"),
        total_count=len(invoices),
        invoices=processed_invoices,
        total_sum=f"{total_sum:,.2f} ILS",
        total_vat=f"{total_vat:,.2f} ILS",
    )

    pdf_bytes = generate_pdf_from_html(html_content)
    return pdf_bytes

def generate_zip_export(invoices: List[dict], files_dir: str) -> bytes:
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # 1. Add Summary PDF
        pdf_content = generate_pdf_report(invoices)
        zip_file.writestr("summary_report.pdf", pdf_content)
        
        # 2. Add Invoice Files
        invoices_folder = "invoices/"
        for inv in invoices:
            if inv.get('filename'):
                file_path = os.path.join(files_dir, inv['filename'])
                if os.path.exists(file_path):
                    # Clean filename for zip
                    safe_vendor = "".join([c for c in (inv.get('vendor_name') or 'Unknown') if c.isalnum() or c in (' ', '-', '_')]).strip()
                    date_str = inv.get('invoice_date', '0000-00-00')
                    new_filename = f"{date_str}_{safe_vendor}_{inv['id'][-4:]}.pdf"
                    
                    zip_file.write(file_path, f"{invoices_folder}{new_filename}")
    
    zip_buffer.seek(0)
    return zip_buffer.read()
