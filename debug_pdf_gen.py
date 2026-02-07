
import os
import sys
from bs4 import BeautifulSoup
import arabic_reshaper
import bidi.algorithm

# Add project root
sys.path.append(os.getcwd())

from backend.services.gmail_service import process_text_for_pdf, convert_html_to_pdf

def debug_pdf_generation():
    print("Running Debug PDF Generation...")
    
    # 1. Define Test Content (Mixed Hebrew/English)
    # This mimics what we expect from an email body
    raw_html = """
    <div>
        <p>English Start: APPLE</p>
        <p>Hebrew Start: בדיקה</p>
        <p>Mixed 1: APPLE בדיקה</p>
        <p>Mixed 2: בדיקה APPLE</p>
        <p>Sentence: This is a test.</p>
    </div>
    """
    
    # 2. Manual Simulation of Service Logic (to allow saving intermediate HTML)
    # We copy the logic from gmail_service.py to ensure we see exactly what it does
    soup = BeautifulSoup(raw_html, 'html.parser')
    
    print("\n--- Processing Text Nodes ---")
    for element in soup.find_all(string=True):
        if element.parent.name not in ['script', 'style', 'pre']:
            original_text = str(element)
            if not original_text.strip(): continue
            
            # Use the imported service function to test IT specifically
            processed_text = process_text_for_pdf(original_text)
            
            print(f"Orig: '{original_text.strip()}'")
            print(f"Proc: '{processed_text.strip()}'")
            
            element.replace_with(processed_text)
            
    processed_html = str(soup)
    
    # 3. Save Intermediate HTML
    with open("debug_intermediate.html", "w", encoding="utf-8") as f:
        # Wrap in the same styling as service
        full_html = f"""
        <html>
        <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <style>
                body {{ 
                    font-family: 'Arial', sans-serif; 
                    direction: ltr; /* mimic service */
                    text-align: right;
                }}
            </style>
        </head>
        <body dir="ltr">
        <h1>Debug Intermediate HTML</h1>
        <p>Open this in Chrome/Edge. If it looks WRONG here, python-bidi is to blame.</p>
        <hr>
        {processed_html}
        </body>
        </html>
        """
        f.write(full_html)
    print("\nSaved 'debug_intermediate.html'")
    
    # 4. Generate PDF using Service
    # We pass the original raw_html to the service function, 
    # letting it do its own processing (which we just simulated above).
    # This verifies the service function itself.
    output_pdf = "debug_service_output.pdf"
    convert_html_to_pdf(raw_html, output_pdf)
    print(f"Generated '{output_pdf}' using service logic.")

if __name__ == "__main__":
    debug_pdf_generation()
