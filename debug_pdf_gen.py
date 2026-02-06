import os
from xhtml2pdf import pisa
import io

def convert_html_to_pdf(source_html, output_path):
    # Ensure Hebrew/UTF-8 support is attempted
    # Using Arial from local static folder
    # Must use forward slashes for CSS url or absolute file uri
    font_path = os.path.join(os.getcwd(), 'backend', 'static', 'fonts', 'arial.ttf').replace('\\', '/')
    print(f"Font path: {font_path}")
    print(f"Font exists: {os.path.exists(font_path)}")
    
    # Manually register the font with ReportLab
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        
        # Register properly
        pdfmetrics.registerFont(TTFont('Arial', font_path))
        print("Font registered successfully via ReportLab")
    except Exception as e:
        print(f"Failed to register font: {e}")

    styled_html = f"""
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
            @page {{ size: A4; margin: 1cm; }}
            body {{ 
                font-family: 'Arial', sans-serif; 
                direction: rtl;
            }}
            pre {{
                font-family: 'Arial', sans-serif;
                white-space: pre-wrap;
            }}
        </style>
    </head>
    <body dir="rtl">
    {source_html}
    </body>
    </html>
    """
    
    try:
        with open(output_path, "wb") as result_file:
            pisa_status = pisa.CreatePDF(
                src=styled_html,
                dest=result_file,
                encoding='utf-8'
            )
        print(f"Pisa err: {pisa_status.err}")
        return not pisa_status.err
    except Exception as e:
        print(f"Exception: {e}")
        return False

# Test
if __name__ == "__main__":
    # 1. Verify Encoding of Hebrew String
    hebrew_text = "בדיקה"
    print(f"Hebrew Text: {hebrew_text}")
    print(f"Hebrew Hex: {[hex(ord(c)) for c in hebrew_text]}")
    
    # Simulate an email with full HTML structure
    email_html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Email</title>
    </head>
    <body style="font-family: sans-serif;">
        <h1>קבלה לתשלום / Payment Receipt</h1>
        <p>שלום רב,</p>
        <p>מצורפת הקבלה עבור העסקה האחרונה.</p>
        <p>תודה רבה!</p>
    </body>
    </html>
    """
    
    # Test with David
    print("\n--- Testing David Font ---")
    output_david = "test_gen_david.pdf"
    convert_html_to_pdf(email_html, output_david)
    
    # Test with Arial (changing code dynamically for test would be hard, 
    # but let's assume the function uses David currently. 
    # To test Arial we'd need to change the function logic or pass font as arg.
    # For now, let's stick to validating the CURRENT setup.)

    # Verify Output File Size
    if os.path.exists(output_david):
        size = os.path.getsize(output_david)
        print(f"Generated PDF Size: {size} bytes")
    else:
        print("Failed to generate PDF file.")
