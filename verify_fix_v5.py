
import os
import sys
import bidi.algorithm
import arabic_reshaper
from bs4 import BeautifulSoup

# Add project root
sys.path.append(os.getcwd())

from backend.services.gmail_service import convert_html_to_pdf

# We need to monkeypatch or modify convert_html_to_pdf to force LTR direction for this test logic
# But wait, I'm testing the service logic. So I should modify the service first?
# No, let's modify the service to support this mode, then test it.

# Actually, I can replicate the proposed service logic here first to verify it works locally.

from xhtml2pdf import pisa
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def verify_fix_v5():
    print("Verifying PDF Fix V5 (Visual Text + LTR Container)...")
    
    BASE_DIR = os.getcwd()
    FONT_PATH = os.path.join(BASE_DIR, 'backend', 'static', 'fonts', 'arial.ttf')
    OUTPUT_PDF = os.path.join(BASE_DIR, 'backend', 'static', 'invoices', 'verify_fix_v5.pdf')

    # 1. Register Font (Override hack)
    try:
        pdfmetrics.registerFont(TTFont('Helvetica', FONT_PATH))
        pdfmetrics.registerFont(TTFont('Arial', FONT_PATH))
    except: pass

    # 2. Process Text Function (Visual LTR)
    def process_text(text):
        if not text: return text
        reshaped = arabic_reshaper.reshape(text)
        # base_dir='L' causes bidi to output visual string for LTR context
        bidi_text = bidi.algorithm.get_display(reshaped, base_dir='L')
        return bidi_text

    # 3. HTML Content (LTR Container)
    raw_html = """
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
            @page { size: A4; margin: 1cm; }
            body { 
                font-family: 'Helvetica', 'Arial', sans-serif !important; 
                text-align: right; /* Right align but LTR direction */
                /* direction: ltr; -- default */
            }
        </style>
    </head>
    <body>
        <h1>בדיקה סופית V5</h1>
        <p>This text should be LTR. המילה הזו בעברית (Hebrew).</p>
        <p>Numbers: 123456</p>
        <p>APPLE (Not ELPPA)</p>
    </body>
    </html>
    """

    # 4. Apply Bidi
    soup = BeautifulSoup(raw_html, 'html.parser')
    for element in soup.find_all(string=True):
        if element.parent.name not in ['script', 'style']:
            original_text = str(element)
            processed_text = process_text(original_text)
            element.replace_with(processed_text)
    
    final_html = str(soup)
    
    # 5. Generate
    def link_callback(uri, rel):
        if uri.startswith('backend/static/'):
            return os.path.join(os.getcwd(), uri)
        return uri

    with open(OUTPUT_PDF, "wb") as f:
        pisa_status = pisa.CreatePDF(final_html, dest=f, encoding='utf-8', link_callback=link_callback)
    
    if pisa_status.err:
        print("FAILURE")
    else:
        print(f"SUCCESS: Generated {OUTPUT_PDF}")

if __name__ == "__main__":
    verify_fix_v5()
