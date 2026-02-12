
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from backend.services.pdf_utils import generate_pdf_from_html

def test_pdf_generation():
    print("Testing PDF generation with Hebrew...")
    
    html_content = """
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {
                direction: rtl;
                text-align: right;
            }
        </style>
    </head>
    <body>
        <h1>בדיקת כותרת (Title Test)</h1>
        <p>זוהי בדיקה של טקסט בעברית.</p>
        <p>This is mixed text: שלום עולם Hello World.</p>
    </body>
    </html>
    """
    
    output_path = "test_hebrew_output.pdf"
    
    try:
        pdf_bytes = generate_pdf_from_html(html_content, output_path=output_path)
        print(f"Success! PDF generated at {output_path}")
        print(f"PDF size: {len(pdf_bytes)} bytes")
        
        # Check if file exists and is not empty
        if os.path.exists(output_path) and os.path.getsize(output_path) > 1000:
            print("Verification passed: File exists and has content.")
        else:
            print("Verification failed: File is empty or missing.")
            
    except Exception as e:
        print(f"Verification FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_pdf_generation()
