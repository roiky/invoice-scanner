
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from backend.services.gmail_service import convert_html_to_pdf

def test_pdf_generation():
    print("Testing PDF Generation with Hebrew and Bidi...")
    
    html_content = """
    <div dir="rtl">
        <h1>בדיקת כותרת בעברית</h1>
        <p>זוהי בדיקה של יצירת PDF עם טקסט בעברית.</p>
        <p>This is English text checking mixed content. APPLE.</p>
        <p>מספרים: 12345</p>
        <p>
            בדיקה של פסקה ארוכה יותר כדי לראות איך הטקסט מסתדר בתוך המסמך.
            נקווה שהפונט אריאל עובד כמו שצריך ולא רואים ריבועים.
        </p>
    </div>
    """
    
    output_dir = "backend/static/invoices"
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, "test_hebrew_bidi.pdf")
    
    success = convert_html_to_pdf(html_content, output_path)
    
    if success:
        print(f"SUCCESS: PDF generated at {output_path}")
        print("Please open the file and verify Hebrew text is legible and English is not reversed.")
    else:
        print("FAILURE: PDF generation failed.")

if __name__ == "__main__":
    test_pdf_generation()
