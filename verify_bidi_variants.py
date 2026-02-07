
import os
import sys
import bidi.algorithm
import arabic_reshaper

# Add project root
sys.path.append(os.getcwd())

from backend.services.gmail_service import convert_html_to_pdf

def verify_bidi_variants():
    print("Verifying Bidi Variants...")
    
    # Text: "בדיקה" (Bet, Dalet, Yod, Qof, He)
    # Logical: "בדיקה"
    # Visual (Reversed): "הקידב" (He, Qof, Yod, Dalet, Bet)
    
    logical_hebrew = "בדיקה"
    
    # Manual Reverse check
    visual_hebrew_manual = logical_hebrew[::-1]
    
    # Bidi Algo check
    reshaped = arabic_reshaper.reshape(logical_hebrew)
    bidi_L = bidi.algorithm.get_display(reshaped, base_dir='L')
    bidi_R = bidi.algorithm.get_display(reshaped, base_dir='R')

    print(f"Logical: {logical_hebrew}")
    print(f"Manual Rev: {visual_hebrew_manual}")
    print(f"Bidi L: {bidi_L}")
    print(f"Bidi R: {bidi_R}")

    # Helper to inject variants into HTML
    # Note: We BYPASS the service's internal bidi processing by passing raw HTML 
    # but the service MIGHT process it again if we rely on convert_html_to_pdf.
    # Actually, convert_html_to_pdf APPLIES bidi!
    # So if I pass "Logical" -> Service converts to "Visual".
    
    # To test effectively, I should modify the service to NOT apply Bidi temporarily?
    # Or I can pass already processed text which will get processed AGAIN?
    # "Visual" -> "Logical".
    
    # Let's create a NEW custom generation function here that uses the SAME setup but NO Bidi
    # to test 'xhtml2pdf' raw behavior.
    
    from xhtml2pdf import pisa
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    
    font_path = os.path.join(os.getcwd(), 'backend', 'static', 'fonts', 'arial.ttf').replace('\\', '/')
    try:
        pdfmetrics.registerFont(TTFont('Helvetica', font_path))
        pdfmetrics.registerFont(TTFont('Arial', font_path)) 
    except: pass

    def link_callback(uri, rel):
        if uri.startswith('backend/static/'):
            return os.path.join(os.getcwd(), uri)
        return uri

    html_template = """
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
            @page {{ size: A4; margin: 1cm; }}
            body {{ 
                font-family: 'Helvetica', 'Arial', sans-serif !important; 
                text-align: right;
                font-size: 24px;
            }}
        </style>
    </head>
    <body>
        <h1>Bidi Verification</h1>
        <p>1. Logical (Raw Input): {logical}</p>
        <p>2. Manual Reversed: {manual}</p>
        <p>3. Bidi L: {bidi_l}</p>
        <p>4. Bidi R: {bidi_r}</p>
        <p>5. English: APPLE</p>
    </body>
    </html>
    """
    
    content = html_template.format(
        logical=logical_hebrew,
        manual=visual_hebrew_manual,
        bidi_l=bidi_L,
        bidi_r=bidi_R
    )
    
    output_path = "backend/static/invoices/bidi_test.pdf"
    with open(output_path, "wb") as f:
        pisa.CreatePDF(content, dest=f, encoding='utf-8', link_callback=link_callback)
        
    print(f"Generated {output_path}")

if __name__ == "__main__":
    verify_bidi_variants()
