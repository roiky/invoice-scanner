
import os
import sys
from xhtml2pdf import pisa
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import bidi.algorithm
import arabic_reshaper
from bs4 import BeautifulSoup

# Setup paths
BASE_DIR = os.getcwd()
FONT_PATH = os.path.join(BASE_DIR, 'backend', 'static', 'fonts', 'arial.ttf')
OUTPUT_PDF = os.path.join(BASE_DIR, 'backend', 'static', 'invoices', 'reproduce_bidi_fixed.pdf')

def process_text_for_pdf(text):
    if not text: return text
    reshaped_text = arabic_reshaper.reshape(text)
    bidi_text = bidi.algorithm.get_display(reshaped_text)
    return bidi_text

def reproduce_fixed():
    # 1. Register Font
    if os.path.exists(FONT_PATH):
        try:
            pdfmetrics.registerFont(TTFont('Arial', FONT_PATH))
            print(f"Registered Arial from {FONT_PATH}")
        except Exception as e:
            print(f"Font Reg Error: {e}")
            return
    else:
        print(f"Font not found at {FONT_PATH}")
        return

    # 2. HTML Content (Raw)
    # We remove @font-face and relies on registered font.
    # We remove dir="rtl" and let python-bidi handle visual ordering.
    raw_html = f"""
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
            @page {{ size: A4; margin: 1cm; }}
            body {{
                font-family: 'Arial', sans-serif;
                text-align: right; /* Align right for Hebrew preference, but keep LTR direction */
            }}
        </style>
    </head>
    <body>
        <p>בדיקה בעברית (Hebrew Test)</p>
        <p>APPLE (Should be APPLE, not ELPPA)</p>
        <p>12345 (Numbers)</p>
        <div>
            <p>Piska aruka (Long paragraph) mixing Hebrew עברית and English.</p>
        </div>
    </body>
    </html>
    """

    # 3. Process HTML with Bidi
    soup = BeautifulSoup(raw_html, 'html.parser')
    
    # Iterate over all text nodes recursively
    # Note: This is simplified. Complex structures might need care.
    for element in soup.find_all(string=True):
        if element.parent.name not in ['script', 'style']:
            original_text = str(element)
            processed_text = process_text_for_pdf(original_text)
            element.replace_with(processed_text)
            
    final_html = str(soup)

    # 4. Generate
    with open(OUTPUT_PDF, "wb") as f:
        pisa_status = pisa.CreatePDF(final_html, dest=f, encoding='utf-8')

    if pisa_status.err:
        print("PDF Generation Failed")
    else:
        print(f"PDF Generated at {OUTPUT_PDF}")

if __name__ == "__main__":
    reproduce_fixed()
