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

class GmailService:
    def __init__(self):
        self.creds = None
        self.service = None
        
    def authenticate(self):
        """Shows the consent screen and creates a token.json"""
        if os.path.exists('backend/token.json'):
            self.creds = Credentials.from_authorized_user_file('backend/token.json', SCOPES)
            
        if not self.creds or not self.creds.valid:
            if self.creds and self.creds.expired and self.creds.refresh_token:
                self.creds.refresh(Request())
            else:
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
        if not self.service:
            self.authenticate()
            
        # Convert dates to query format (YYYY/MM/DD)
        # after:YYYY/MM/DD before:YYYY/MM/DD
        query = f'after:{start_date.strftime("%Y/%m/%d")} before:{end_date.strftime("%Y/%m/%d")}'
        
        # Add keyword filters to reduce noise
        keywords = ['invoice', 'receipt', 'bill', 'חשבונית', 'קבלה']
        keyword_query = " OR ".join(keywords)
        full_query = f"({keyword_query}) {query}"
        
        print(f"Searching Gmail with query: {full_query}")
        
        results = self.service.users().messages().list(userId='me', q=full_query, maxResults=20).execute()
        messages = results.get('messages', [])
        
        invoices = []
        
        # Ensure temp folder exists for PDFs
        import os
        pdf_dir = "backend/static/invoices" 
        os.makedirs(pdf_dir, exist_ok=True)

        for msg in messages:
            # Get full message details
            try:
                msg_detail = self.service.users().messages().get(userId='me', id=msg['id']).execute()
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
                    att = self.service.users().messages().attachments().get(userId='me', messageId=msg['id'], id=att_id).execute()
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
                
                if html_part:
                    # Prefer HTML because it usually contains the full invoice structure (tables etc)
                    # We strip tags using BeautifulSoup
                    soup = BeautifulSoup(html_part, 'html.parser')
                    # Get text with newlines to preserve structure
                    body_text = soup.get_text(separator='\n')
                elif text_part:
                    body_text = text_part
                else:
                    body_text = msg_detail.get('snippet', '')

                if body_text:
                    from backend.services.extraction_service import extraction_service
                    extracted = extraction_service.extract_from_body(body_text, "email_body")

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
                download_url=f"http://127.0.0.1:8000/files/{msg['id']}_{filename}" if pdf_data else None,
                status="Processed" if extracted.get("total_amount") else "Pending"
            )
            invoices.append(invoice)

        return ScanResult(
            total_emails_scanned=len(messages), 
            invoices_found=len(invoices),
            invoices=invoices
        )

gmail_service = GmailService()
