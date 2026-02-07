
import os
import sys
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import arabic_reshaper
from bidi.algorithm import get_display

# Setup paths
BASE_DIR = os.getcwd()
FONT_PATH = os.path.join(BASE_DIR, 'backend', 'static', 'fonts', 'arial.ttf')
OUTPUT_PDF = os.path.join(BASE_DIR, 'backend', 'static', 'invoices', 'debug_reportlab.pdf')

def debug_reportlab():
    print(f"Testing ReportLab direct generation with font: {FONT_PATH}")
    c = canvas.Canvas(OUTPUT_PDF)
    
    # 1. Register Font
    try:
        pdfmetrics.registerFont(TTFont('Arial', FONT_PATH))
        c.setFont('Arial', 14)
        print("Font registered successfully in ReportLab.")
    except Exception as e:
        print(f"ReportLab Font/File Error: {e}")
        return

    # 2. Draw Text (Hebrew needs visual reversing for direct PDF writing usually)
    text_he = "בדיקה בעברית"
    text_en = "APPLE"
    
    # Simple draw
    y = 800
    c.drawString(100, y, f"English Direct: {text_en}")
    y -= 30
    
    # Hebrew Direct (might be reversed/squares if encoding fails?)
    # ReportLab standard text drawing usually requires utf-8 and font support
    c.drawString(100, y, "Hebrew Direct: " + text_he)
    y -= 30
    
    # With Bidi/Reshaping
    reshaped_text = arabic_reshaper.reshape(text_he)
    bidi_text = get_display(reshaped_text)
    c.drawString(100, y, f"Hebrew Bidi: {bidi_text}")
    y -= 30

    # Mixed
    mixed = "Test בדיקה 123"
    bidi_mixed = get_display(arabic_reshaper.reshape(mixed), base_dir='L')
    c.drawString(100, y, f"Mixed Bidi (L): {bidi_mixed}")
    
    c.save()
    print(f"Generated {OUTPUT_PDF}")

if __name__ == "__main__":
    debug_reportlab()
