
import os
import sys
import base64
from xhtml2pdf import pisa
import bidi.algorithm
import arabic_reshaper
from bs4 import BeautifulSoup

# Setup paths
BASE_DIR = os.getcwd()
FONT_PATH = os.path.join(BASE_DIR, 'backend', 'static', 'fonts', 'arial.ttf')
OUTPUT_PDF = os.path.join(BASE_DIR, 'backend', 'static', 'invoices', 'test_base64.pdf')

def process_text_for_pdf(text):
    if not text: return text
    try:
        reshaped_text = arabic_reshaper.reshape(text)
        bidi_text = bidi.algorithm.get_display(reshaped_text)
        return bidi_text
    except Exception as e:
        print(f"Bidi error: {e}")
        return text

def test_base64_font():
    # 1. Read Font and Encode Base64
    if not os.path.exists(FONT_PATH):
        print(f"Font not found at {FONT_PATH}")
        return

    with open(FONT_PATH, "rb") as f:
        font_data = f.read()
        font_b64 = base64.b64encode(font_data).decode('utf-8')

    # 2. HTML with Base64 Font
    # We use @font-face with data:url
    raw_html = f"""
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
            @font-face {{
                font-family: 'HebrewFont';
                src: url(data:font/ttf;charset=utf-8;base64,{font_b64});
            }}
            body {{
                font-family: 'HebrewFont', sans-serif;
                text-align: right;
            }}
        </style>
    </head>
    <body>
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

    # 4. Generate
    with open(OUTPUT_PDF, "wb") as f:
        pisa_status = pisa.CreatePDF(final_html, dest=f, encoding='utf-8')

    if pisa_status.err:
        print("PDF Generation Failed")
    else:
        print(f"PDF Generated at {OUTPUT_PDF}")

if __name__ == "__main__":
    test_base64_font()
