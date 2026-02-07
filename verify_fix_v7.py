
import os
import sys
import re
from bs4 import BeautifulSoup

# Add project root
sys.path.append(os.getcwd())

from backend.services.gmail_service import convert_html_to_pdf
from xhtml2pdf import pisa
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

def verify_fix_v7():
    print("Verifying PDF Fix V7 (Final Regex Wrapper)...")
    
    BASE_DIR = os.getcwd()
    FONT_PATH = os.path.join(BASE_DIR, 'backend', 'static', 'fonts', 'arial.ttf')
    output_dir = "backend/static/invoices"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "verify_fix_v7.pdf")

    # Font Registration (Simulation of service)
    try:
        pdfmetrics.registerFont(TTFont('Helvetica', FONT_PATH))
    except: pass

    # Test Content
    raw_html = """
    <html>
    <body>
        <h1>בדיקה V7</h1>
        <p>This is English Text.</p>
        <p>זוהי פסקה בעברית.</p>
        <p>Mixed: Apple תפוח Banana בננה 123.</p>
        <p>Address: 123 Main St, Tel Aviv.</p>
    </body>
    </html>
    """
    
    # Logic Replication (Simplified for script, but effectively what service does)
    # Actually, let's just use the service function directly since I modified it!
    # convert_html_to_pdf now has the regex logic built-in.
    
    success = convert_html_to_pdf(raw_html, output_path)
    
    if success:
        print(f"SUCCESS: Generated {output_path}")
    else:
        print("FAILURE")

    # Also verifying the HTML transformation logic independently to print it
    soup = BeautifulSoup(raw_html, 'html.parser')
    english_pattern = re.compile(r'([a-zA-Z0-9\.,\-\+\(\)\s]+)')
    print("\n--- HTML Transformation Logic Check ---")
    for element in soup.find_all(string=True):
        if element.parent.name not in ['script', 'style', 'pre']:
            original_text = str(element)
            if english_pattern.search(original_text) and any(c for c in original_text if c.strip()):
                # Simplified check for print
                print(f"Original: '{original_text.strip()}'")
                # Logic:
                new_html = english_pattern.sub(r'<span dir="ltr">\1</span>', original_text)
                print(f"Transformed: '{new_html.strip()}'")

if __name__ == "__main__":
    verify_fix_v7()
