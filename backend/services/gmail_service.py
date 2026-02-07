import os.path
import base64
from typing import List, Optional
from datetime import date, datetime
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from bs4 import BeautifulSoup
from backend.models import InvoiceData, ScanResult

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.modify']
STATIC_INVOICES_DIR = "backend/static/invoices" 
BASE_URL = "http://localhost:8000/files"

from xhtml2pdf import pisa
import io
from bs4 import BeautifulSoup
import bidi.algorithm
import arabic_reshaper

def process_text_for_pdf(text):
    if not text: return text
    reshaped_text = arabic_reshaper.reshape(text)
    # base_dir='L' ensures that the overall paragraph direction is LTR, 
    # which keeps English text (L-to-R) correctly oriented, while Hebrew (R-to-L) 
    # is reversed locally by get_display for visual rendering.
    bidi_text = bidi.algorithm.get_display(reshaped_text, base_dir='L')
    return bidi_text

def convert_html_to_pdf(source_html, output_path):
    # Ensure Hebrew/UTF-8 support is attempted
    # using Arial which is known to support Hebrew well
    font_path = os.path.join(os.getcwd(), 'backend', 'static', 'fonts', 'arial.ttf').replace('\\', '/')
    
    # Manually register the font with ReportLab
    # Challenge: xhtml2pdf crashes with @font-face on Windows (temp file lock).
    # Challenge: xhtml2pdf doesn't find Python-registered fonts unless mapped in CSS.
    # Hack: Register our Hebrew font as 'Helvetica' (the default PDF font).
    # This forces xhtml2pdf to use our font for the default text without need for @font-face.
    try:
        from reportlab.pdfbase import pdfmetrics
        from reportlab.pdfbase.ttfonts import TTFont
        
        pdfmetrics.registerFont(TTFont('Helvetica', font_path))
        pdfmetrics.registerFont(TTFont('Arial', font_path)) # Register as Arial too just in case
    except Exception as e:
        print(f"Warning: Could not register font: {e}")

    # Sanitize Source HTML
    try:
        soup = BeautifulSoup(source_html, 'html.parser')
        
        # If we have a body, take its content. Else take the whole thing.
        if soup.body:
            content_soup = BeautifulSoup(soup.body.decode_contents(), 'html.parser')
        else:
            content_soup = BeautifulSoup(source_html, 'html.parser')

        # Advanced Bidi Handling:
        # 1. We use dir="rtl" on the body (see below) to ensure Hebrew is reversed correctly (Visual order).
        # 2. However, dir="rtl" also reverses English ("APPLE" -> "ELPPA").
        # 3. Fix: We wrap English/Number sequences in <span dir="ltr"> to protect them.
        import re
        
        # Regex to find English words, numbers, and basic punctuation
        # [a-zA-Z0-9\.,\-\s]+ but refined to avoid breaking HTML tags (which BS4 handles, but we modify text nodes)
        english_pattern = re.compile(r'([a-zA-Z0-9\.,\-\+\(\)\s]+)')
        
        for element in content_soup.find_all(string=True):
            if element.parent.name not in ['script', 'style', 'pre']:
                original_text = str(element)
                # If text contains Hebrew, we don't touch it (let Body RTL handle it).
                # If text contains English, we wrap the English parts.
                
                # Check if it has english/numbers
                if english_pattern.search(original_text):
                    # We need to replace this text node with a structure containing spans.
                    # BeautifulSoup string replacement is tricky with HTML structure.
                    # Easier to wrap the whole node in a customized way or split it.
                    
                    # Simple approach: If the node is purely English, wrap it.
                    # If mixed, we have to split.
                    
                    # For safety/simplicity in this "Fix Mode":
                    # We will use a helper that wraps English sequences in unicode LTR marks? 
                    # No, dir="ltr" span is safer for xhtml2pdf.
                    
                    # Replacing the string with a soup fragment:
                    new_html = english_pattern.sub(r'<span dir="ltr">\1</span>', original_text)
                    new_soup = BeautifulSoup(new_html, 'html.parser')
                    element.replace_with(new_soup)

        base_content = str(content_soup)
            
    except Exception as e:
        print(f"Warning: HTML parsing/bidi failed, using raw: {e}")
        base_content = source_html

    # Link callback to handle font loading for xhtml2pdf if needed
    def link_callback(uri, rel):
        # Allow loading local files from backend/static
        if uri.startswith('backend/static/'):
            path = os.path.join(os.getcwd(), uri)
            return path
        return uri

    # We add a specific style to force the font usage
    # Using 'Arial' or 'Helvetica' which are now mapped to our TTF
    # REMOVED @font-face to avoid crash
    # ADDED dir="rtl" back to support Hebrew visual reversing.
    styled_html = f"""
    <html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <style>
            @page {{ size: A4; margin: 1cm; }}
            body {{ 
                font-family: 'Helvetica', 'Arial', sans-serif !important; 
                text-align: right;
            }}
            * {{
                font-family: 'Helvetica', 'Arial', sans-serif !important;
            }}
            pre {{
                font-family: 'Helvetica', 'Arial', sans-serif !important;
                white-space: pre-wrap;
                text-align: right;
            }}
            span[dir="ltr"] {{
                direction: ltr; 
                display: inline-block; /* Helps xhtml2pdf handle direction change sometimes */
            }}
        </style>
    </head>
    <body dir="rtl">
    {base_content}
    </body>
    </html>
    """
    
    with open(output_path, "wb") as result_file:
        pisa_status = pisa.CreatePDF(
            src=styled_html,
            dest=result_file,
            encoding='utf-8',
            link_callback=link_callback
        )
    return not pisa_status.err



import threading
import logging

logger = logging.getLogger(__name__)

class GmailService:
    def __init__(self):
        self.creds = None
        self.service = None
        self._lock = threading.Lock()
        
    def authenticate(self):
        """Shows the consent screen and creates a token.json"""
        with self._lock:
            self._authenticate_no_lock()

    def _authenticate_no_lock(self):
        """Internal authentication without locking to avoid recursion if called from within locked block."""
        if os.path.exists('backend/token.json'):
            try:
                self.creds = Credentials.from_authorized_user_file('backend/token.json', SCOPES)
            except Exception as e:
                logger.error(f"Failed to load credentials: {e}")
                self.creds = None
            
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                try:
                    self.creds.refresh(Request())
                except Exception as e:
                    logger.error(f"Failed to refresh token: {e}")
                    # If refresh fails, we might need to re-auth. For now, let it fail or handle gracefully.
                    self.creds = None

            if not self.creds: # Check again after potential refresh failure
                if not os.path.exists('backend/credentials.json'):
                    raise FileNotFoundError("backend/credentials.json not found! Please invoke setup.")
                    
                flow = InstalledAppFlow.from_client_secrets_file(
                    'backend/credentials.json', SCOPES)
                self.creds = flow.run_local_server(port=0)
                
            # Save the credentials for the next run
            with open('backend/token.json', 'w') as token:
                token.write(self.creds.to_json())

        self.service = build('gmail', 'v1', credentials=self.creds)

    def scan_invoices(self, start_date: date, end_date: date) -> ScanResult:
        with self._lock:
            if not self.service:
                self._authenticate_no_lock()
            current_service = self.service

        # Convert dates to query format (YYYY/MM/DD)
        # after:YYYY/MM/DD before:YYYY/MM/DD
        query = f'after:{start_date.strftime("%Y/%m/%d")} before:{end_date.strftime("%Y/%m/%d")}'
        
        # Add keyword filters to reduce noise
        keywords = ['invoice', 'receipt', 'bill', 'חשבונית', 'קבלה']
        keyword_query = " OR ".join(keywords)
        full_query = f"({keyword_query}) {query}"
        
        print(f"Searching Gmail with query: {full_query}")
        
        results = current_service.users().messages().list(userId='me', q=full_query, maxResults=20).execute()
        messages = results.get('messages', [])
        
        invoices = []
        
        # Ensure temp folder exists for PDFs
        import os
        pdf_dir = "backend/static/invoices" 
        os.makedirs(pdf_dir, exist_ok=True)

        for msg in messages:
            # Get full message details
            try:
                msg_detail = current_service.users().messages().get(userId='me', id=msg['id']).execute()
            except Exception as e:
                print(f"Error fetching message {msg['id']}: {e}")
                continue

            payload = msg_detail.get('payload', {})
            headers = payload.get('headers', [])
            parts = payload.get('parts', [])
            
            subject = next((h['value'] for h in headers if h['name'] == 'Subject'), "No Subject")
            sender = next((h['value'] for h in headers if h['name'] == 'From'), "Unknown Sender")
            
            # Find PDF Attachment
            pdf_data = None
            filename = "unknown.pdf"
            
            # Recursive search for attachment in parts
            def find_pdf(params):
                for part in params:
                    if part.get('mimeType') == 'application/pdf' or part.get('filename', '').lower().endswith('.pdf'):
                        return part
                    if 'parts' in part:
                         found = find_pdf(part['parts'])
                         if found: return found
                return None
            
            pdf_part = find_pdf(parts)
            if not pdf_part and payload.get('mimeType') == 'application/pdf':
                pdf_part = payload  # The message itself is the PDF

            if pdf_part and 'body' in pdf_part and 'attachmentId' in pdf_part['body']:
                try:
                    att_id = pdf_part['body']['attachmentId']
                    att = current_service.users().messages().attachments().get(userId='me', messageId=msg['id'], id=att_id).execute()
                    data = att['data']
                    pdf_data = base64.urlsafe_b64decode(data.encode('UTF-8'))
                    filename = pdf_part['filename']
                    
                    # Save to disk for viewing
                    file_path = os.path.join(pdf_dir, f"{msg['id']}_{filename}")
                    with open(file_path, 'wb') as f:
                        f.write(pdf_data)
                except Exception as e:
                    print(f"Error downloading PDF for msg {msg['id']}: {e}")
            
            # Extract Data
            extracted = {}
            if pdf_data:
                from backend.services.extraction_service import extraction_service
                extracted = extraction_service.extract_from_pdf(pdf_data, filename)
            else:
                # Fallback: Extract from Body
                # 1. Try to find HTML body
                # 2. Try to find Text body
                # 3. Fallback to Snippet
                
                body_text = ""
                html_body = ""
                
                def find_body_content(params):
                    found_text = None
                    found_html = None
                    for part in params:
                        mime = part.get('mimeType')
                        body_data = part.get('body', {}).get('data')
                        
                        if mime == 'text/plain' and body_data:
                            found_text = base64.urlsafe_b64decode(body_data).decode('utf-8')
                        elif mime == 'text/html' and body_data:
                            found_html = base64.urlsafe_b64decode(body_data).decode('utf-8')
                        
                        if 'parts' in part:
                            nested_text, nested_html = find_body_content(part['parts'])
                            if nested_text: found_text = nested_text
                            if nested_html: found_html = nested_html
                            
                        if found_text and found_html: break # Found both
                        
                    return found_text, found_html

                text_part, html_part = find_body_content([payload]) # Wrap payload in list for recursion compatibility

                if not body_text:
                    if html_part:
                        soup = BeautifulSoup(html_part, 'html.parser')
                        body_text = soup.get_text(separator='\\n')
                    elif text_part:
                        body_text = text_part
                    else:
                        body_text = msg_detail.get('snippet', '')

                if not body_text:
                    continue

                if body_text:
                    from backend.services.extraction_service import extraction_service
                    extracted = extraction_service.extract_from_body(body_text, "email_body")

                # --- Generate PDF from Body if no attachment ---
                try:
                    pdf_filename = f"generated_{msg['id']}.pdf"
                    full_pdf_path = os.path.join(STATIC_INVOICES_DIR, pdf_filename)
                    
                    # Prefer HTML if available, use html_part from scope
                    content_to_render = html_part if html_part else f"<pre>{body_text}</pre>"
                    
                    if convert_html_to_pdf(content_to_render, full_pdf_path):
                        print(f"Generated PDF for {msg['id']}")
                        pdf_data_exists = True 
                        generated_url = f"{BASE_URL}/{pdf_filename}"
                        generated_filename = pdf_filename
                    else:
                        pdf_data_exists = False
                except Exception as e:
                    print(f"Failed to generate PDF for {msg['id']}: {e}")
                    pdf_data_exists = False
                # ----------------------------------------------------

            invoice = InvoiceData(
                id=msg['id'],
                filename=filename, 
                sender_email=sender,
                subject=subject,
                invoice_date=extracted.get("invoice_date"),
                vendor_name=extracted.get("vendor_name") or sender.split('<')[0].strip().replace('"', ''),
                total_amount=extracted.get("total_amount"),
                currency="ILS",
                vat_amount=extracted.get("vat_amount"),
                download_url=f"http://127.0.0.1:8000/files/{msg['id']}_{filename}" if pdf_data else (generated_url if 'generated_url' in locals() and generated_url else None),
                status="Processed" if extracted.get("total_amount") else "Pending"
            )
            invoices.append(invoice)

        return ScanResult(
            total_emails_scanned=len(messages), 
            invoices_found=len(invoices),
            invoices=invoices
        )

    def get_user_profile(self) -> Optional[dict]:
        """Fetches the connected user's profile (email address)."""
        with self._lock:
            # Do not force authentication if not already signed in (file doesn't exist)
            if not self.service:
                if os.path.exists('backend/token.json'):
                    try:
                        self._authenticate_no_lock()
                    except Exception as e:
                        logger.error(f"Auth failed during get_profile: {e}")
                        return None
                else:
                    return None
            
            # Capture service instance locally safely
            current_service = self.service
            
        if not current_service:
            return None

        try:
            profile = current_service.users().getProfile(userId='me').execute()
            return {"email": profile.get("emailAddress")}
        except Exception as e:
            print(f"Error fetching profile: {e}")
            return None

    def logout(self):
        """Clears in-memory credentials and deletes the token file."""
        import time
        with self._lock:
            self.creds = None
            self.service = None
            
            if os.path.exists('backend/token.json'):
                try:
                    os.remove('backend/token.json')
                except PermissionError:
                    # Retry once after a short delay, as antivirus or other processes might lock it momentarily
                    time.sleep(0.5)
                    try:
                        os.remove('backend/token.json')
                    except Exception as e:
                        print(f"CRITICAL: Failed to delete token.json on retry: {e}")
                        raise e # re-raise to notify caller
                except Exception as e:
                    print(f"CRITICAL: Failed to delete token.json: {e}")
                    raise e

gmail_service = GmailService()
