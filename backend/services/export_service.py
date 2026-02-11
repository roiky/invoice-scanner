import os
import io
import zipfile
from datetime import datetime
from typing import List
from xhtml2pdf import pisa
import arabic_reshaper
from bidi.algorithm import get_display

# Template for PDF
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
        /* Font registered programmatically via ReportLab */
        body {
            font-family: 'ArialHebrew', sans-serif;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
        }
        .meta {
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .rtl {
            direction: rtl;
        }
        .amount {
            text-align: right;
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
<body>
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
    reshaped_text = arabic_reshaper.reshape(text)
    bidi_text = get_display(reshaped_text)
    return bidi_text

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
            'subject': fix_hebrew(inv.get('subject', '')[:50] + '...' if len(inv.get('subject', '')) > 50 else inv.get('subject', '')),
            'status': inv.get('status', 'Pending'),
            'vat': f"{vat:,.2f} {currency}",
            'total': f"{amount:,.2f} {currency}"
        })

    # Render HTML (using Jinja2 manually or simple string replacement for now to avoid extra dependencies if possible, but Template is better)
    # Using simple replacement for this example to reduce complexity, or basic f-string
    # Ideally use Jinja2
    # Register font directly with ReportLab to bypass xhtml2pdf temp file issues
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    # Get absolute path to font
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    font_path = os.path.join(base_dir, 'backend', 'static', 'fonts', 'arial.ttf')
    
    if not os.path.exists(font_path):
        font_path = "C:/Windows/Fonts/arial.ttf"

    try:
        pdfmetrics.registerFont(TTFont('ArialHebrew', font_path))
    except Exception as e:
        print(f"Font registration warning: {e}")

    from jinja2 import Template
    template = Template(HTML_TEMPLATE)
    html_content = template.render(
        generation_date=datetime.now().strftime("%d/%m/%Y %H:%M"),
        total_count=len(invoices),
        invoices=processed_invoices,
        total_sum=f"{total_sum:,.2f} ILS",
        total_vat=f"{total_vat:,.2f} ILS",
        font_path=font_path # Not used in CSS but kept for reference
    )

    # Link callback for resolving local files (kept just in case for other resources)
    def link_callback(uri, rel):
        """
        Convert HTML URIs to absolute system paths so xhtml2pdf can verify them
        """
        sUrl = uri
        
        # If the URL is already absolute, strictly check
        if os.path.isabs(sUrl):
            if os.path.exists(sUrl):
                return sUrl
            return None # Fail if absolute path doesn't exist

        # If not absolute, it's relative to the source.
        # But since we provide source as string, we need to handle it.
        # We assume resources are relative to 'backend/static' or root.
        
        # Try finding in backend/static
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        static_path = os.path.join(base_dir, 'backend', 'static')
        
        # If uri starts with 'backend/static/', strip it to avoid duplication if we join
        if uri.startswith('backend/static/'):
            full_path = os.path.join(base_dir, uri)
        else:
            full_path = os.path.join(static_path, uri)

        if not os.path.exists(full_path):
            # Try plain relative from project root
            full_path = os.path.join(base_dir, uri)
            
        if os.path.exists(full_path):
            return full_path
            
        return None

    # Convert to PDF
    pdf_file = io.BytesIO()
    pisa_status = pisa.CreatePDF(
        src=html_content,
        dest=pdf_file,
        encoding='utf-8',
        link_callback=link_callback
    )
    
    if pisa_status.err:
        raise Exception(f"PDF generation failed: {pisa_status.err}")
    
    pdf_file.seek(0)
    return pdf_file.read()

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
