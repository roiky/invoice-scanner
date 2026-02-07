
import os
import sys
import logging
from xhtml2pdf import pisa
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import bidi.algorithm
import arabic_reshaper
from bs4 import BeautifulSoup

# Setup logging
logging.basicConfig(level=logging.DEBUG)

# Setup paths
BASE_DIR = os.getcwd()
FONT_PATH = os.path.join(BASE_DIR, 'backend', 'static', 'fonts', 'arial.ttf')
OUTPUT_PDF = os.path.join(BASE_DIR, 'backend', 'static', 'invoices', 'test_font_mapping.pdf')

def process_text_for_pdf(text):
    if not text: return text
    try:
        reshaped_text = arabic_reshaper.reshape(text)
        bidi_text = bidi.algorithm.get_display(reshaped_text)
        return bidi_text
    except Exception as e:
        print(f"Bidi error: {e}")
        return text

def test_font_mapping():
    print(f"Registering font from {FONT_PATH}")
    
    if not os.path.exists(FONT_PATH):
        print("Font file not found!")
        return

    # 1. Register Font with a UNIQUE name
    CUSTOM_FONT_NAME = "CustomHebrewFont"
    try:
        pdfmetrics.registerFont(TTFont(CUSTOM_FONT_NAME, FONT_PATH))
        print(f"Registered font as '{CUSTOM_FONT_NAME}'")
        
        # Verify it's registered
        registered = pdfmetrics.getRegisteredFontNames()
        print(f"Registered fonts: {registered}")
        
    except Exception as e:
        print(f"Font Reg Error: {e}")
        return

    # 2. HTML using that specific font family
    # We DO NOT use @font-face, relying on the registered name
    raw_html = f"""
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
            @page {{ size: A4; margin: 1cm; }}
            body {{
                font-family: '{CUSTOM_FONT_NAME}', sans-serif;
                text-align: right;
            }}
            p {{
                font-family: '{CUSTOM_FONT_NAME}';
            }}
        </style>
    </head>
    <body>
        <p>Using Font: {CUSTOM_FONT_NAME}</p>
        <p>בדיקה בעברית (Hebrew Test)</p>
        <p>APPLE (Should be APPLE)</p>
        <p>12345 (Numbers)</p>
    </body>
    </html>
    """

    # 3. Process Bidi
    soup = BeautifulSoup(raw_html, 'html.parser')
    for element in soup.find_all(string=True):
        if element.parent.name not in ['script', 'style']:
            original_text = str(element)
            processed_text = process_text_for_pdf(original_text)
            element.replace_with(processed_text)
            
    final_html = str(soup)

    # 4. Generate with Defaults
    # pisa.pisaDocument might be safer than CreatePDF for defaults
    with open(OUTPUT_PDF, "wb") as f:
        pisa_status = pisa.CreatePDF(
            final_html, 
            dest=f, 
            encoding='utf-8',
            # We can try to set default font here if accepted, but usually it's in CSS
        )

    if pisa_status.err:
        print("PDF Generation Failed")
    else:
        print(f"PDF Generated at {OUTPUT_PDF}")

if __name__ == "__main__":
    test_font_mapping()
