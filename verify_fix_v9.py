
import os
import sys
from xhtml2pdf import pisa
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Add project root
sys.path.append(os.getcwd())

def verify_fix_v9():
    print("Verifying PDF Fix V9 (HTML Variations)...")
    
    BASE_DIR = os.getcwd()
    output_dir = "backend/static/invoices"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "verify_fix_v9_variations.pdf")

    # Font
    FONT_PATH = os.path.join(BASE_DIR, 'backend', 'static', 'fonts', 'arial.ttf')
    try:
        pdfmetrics.registerFont(TTFont('Helvetica', FONT_PATH))
    except: pass

    # Content
    # We test:
    # 1. Body RTL (Standard)
    # 2. Body LTR ("Visual" approach)
    # 3. Span LTR
    # 4. Div LTR
    # 5. BDO LTR
    
    html_content = """
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
            @page { size: A4; margin: 1cm; }
            body { 
                font-family: 'Helvetica', 'Arial', sans-serif !important; 
                text-align: right;
            }
            .rtl-box { direction: rtl; border: 1px solid black; margin: 5px; padding: 5px; }
            .ltr-box { direction: ltr; border: 1px solid red; margin: 5px; padding: 5px; text-align: left; }
        </style>
    </head>
    <body>
        <h1>Test Variations V9</h1>
        
        <div class="rtl-box">
            <h3>1. RTL Container (Standard)</h3>
            <p>1a. Hebrew Logical: בדיקה</p>
            <p>1b. Hebrew Visual (Reversed): הקידב</p>
            <p>1c. English Logical: APPLE</p>
            <p>1d. English Manual Reverse: ELPPA</p>
            <p>1e. English Span LTR: <span dir="ltr">APPLE</span></p>
            <p>1f. English BDO LTR: <bdo dir="ltr">APPLE</bdo></p>
        </div>

        <div class="ltr-box">
            <h3>2. LTR Container (Visual Strategy)</h3>
            <p>2a. Hebrew Logical: בדיקה</p>
            <p>2b. Hebrew Visual (Reversed): הקידב</p>
            <p>2c. English Logical: APPLE</p>
            <p>2d. English Manual Reverse: ELPPA</p>
        </div>
        
    </body>
    </html>
    """
    
    def link_callback(uri, rel):
        if uri.startswith('backend/static/'):
            return os.path.join(os.getcwd(), uri)
        return uri
        
    with open(output_path, "wb") as f:
        pisa.CreatePDF(html_content, dest=f, encoding='utf-8', link_callback=link_callback)
    
    print(f"Generated {output_path}")

if __name__ == "__main__":
    verify_fix_v9()
