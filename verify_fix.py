
import os
import sys

# Add project root
sys.path.append(os.getcwd())

from backend.services.gmail_service import convert_html_to_pdf

def verify_fix_v4():
    print("Verifying PDF Fix V4 (Override Helvetica + NO Bidi processing)...")
    
    html_content = """
    <div>
        <h1>בדיקה סופית (Final Test V4)</h1>
        <p>This text should be LTR. המילה הזו בעברית (Hebrew).</p>
        <p>Numbers: 123456</p>
        <p>APPLE (Not ELPPA)</p>
        <p>
            פסקה ארוכה עם הרבה טקסט כדי לראות שהכל עובד כמו שצריך.
            Long paragraph with mixed text to verify layout.
        </p>
    </div>
    """
    
    output_dir = "backend/static/invoices"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "verify_fix_v4.pdf")
    
    success = convert_html_to_pdf(html_content, output_path)
    
    if success:
        print(f"SUCCESS: PDF generated at {output_path}")
    else:
        print("FAILURE: PDF generation failed.")

if __name__ == "__main__":
    verify_fix_v4()
