
import os
import io
import logging
from xhtml2pdf import pisa
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

logger = logging.getLogger(__name__)

# Font Registration - Global execution on import
FONT_NAME = 'ArialHebrew'
FONT_PATH_SYSTEM = "C:/Windows/Fonts/arial.ttf"
FONT_PATH_LOCAL = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'backend', 'static', 'fonts', 'arial.ttf')

font_registered = False

def register_fonts():
    global font_registered
    if font_registered:
        return

    font_path = FONT_PATH_SYSTEM
    if not os.path.exists(font_path):
        font_path = FONT_PATH_LOCAL
        
    try:
        # Register the font with ReportLab
        # This makes it available to xhtml2pdf if mapped correctly or used as default
        pdfmetrics.registerFont(TTFont(FONT_NAME, font_path))
        
        # Also register as 'Helvetica' and 'Arial' to override defaults if xhtml2pdf falls back
        # This is a brute-force way to ensure Hebrew support even if CSS fails
        pdfmetrics.registerFont(TTFont('Helvetica', font_path))
        pdfmetrics.registerFont(TTFont('Arial', font_path))
        
        logger.info(f"Successfully registered font {FONT_NAME} from {font_path}")
        font_registered = True
    except Exception as e:
        logger.error(f"CRITICAL: Failed to register font from {font_path}: {e}")

# Register immediately
register_fonts()

def generate_pdf_from_html(html_content: str, output_path: str = None) -> bytes:
    """
    Generates a PDF from HTML content using xhtml2pdf.
    Can either return bytes or write to a file path.
    """
    
    # 1. Prepend CSS for Font Usage if not present
    # We force the body to use our registered font
    # and we definitely use a file:// URL for @font-face as a backup for xhtml2pdf's internal parser
    
    # Check which path we are using for the URL
    font_path_url = FONT_PATH_SYSTEM if os.path.exists(FONT_PATH_SYSTEM) else FONT_PATH_LOCAL
    font_url = f"file:///{font_path_url.replace(os.sep, '/')}"

    style_block = f"""
    <style>
        @font-face {{
            font-family: '{FONT_NAME}';
            src: url('{font_url}');
        }}
        body, td, th, p, div, span, pre {{
            font-family: '{FONT_NAME}', 'Arial', 'Helvetica', sans-serif;
        }}
    </style>
    """
    
    # Inject style at the beginning of the HTML (or head if we wanted to be polite, but prepend works for pisa)
    full_html = style_block + html_content

    # 2. Link Callback
    def link_callback(uri, rel):
        # Convert URI to absolute system path
        sUrl = uri
        if sUrl.startswith('backend/static/'):
            # Resolve relative to project root
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            sUrl = os.path.join(base_dir, sUrl)
            
        if not os.path.exists(sUrl) and not sUrl.startswith('file:///'):
             # Try other resolutions if needed
             pass
             
        return sUrl

    # 3. Generate
    result_file = io.BytesIO()
    
    pisa_status = pisa.CreatePDF(
        src=full_html,
        dest=result_file,
        encoding='utf-8',
        link_callback=link_callback
    )
    
    if pisa_status.err:
        raise Exception(f"PDF generation failed: {pisa_status.err}")
        
    pdf_bytes = result_file.getvalue()
    
    if output_path:
        with open(output_path, "wb") as f:
            f.write(pdf_bytes)
            
    return pdf_bytes
