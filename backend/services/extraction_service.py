import re
import io
import pdfplumber
from datetime import datetime
from typing import Optional, Tuple

class ExtractionService:
    def extract_from_pdf(self, pdf_bytes, filename) -> dict:
        """
        Extracts text from PDF and then metadata.
        """
        text = ""
        try:
            with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
                for page in pdf.pages:
                    text += (page.extract_text() or "") + "\n"
        except Exception as e:
            print(f"Error reading PDF {filename}: {e}")
            return {}
            
        return self._extract_from_text(text, filename)

    def extract_from_body(self, email_body, filename) -> dict:
        """
        Extracts metadata from email body text.
        """
        return self._extract_from_text(email_body, filename)

    def _extract_from_text(self, text, filename) -> dict:
        data = {
            "invoice_date": None,
            "total_amount": None,
            "vat_amount": None,
            "vendor_name": None
        }

        # Debug:
        # print(f"-- Text for {filename} --\n{text}\n----------------")

        # 1. Extract Date
        # Enhanced patterns. 
        # Sometimes RTL makes "26/10/2025 :תאריך" appear as "תאריך: 2025/10/26" or similar visual tricks.
        # We look for the number sequences primarily.
        date_patterns = [
            r'(\d{2}[/.]\d{2}[/.]\d{4})',       # 26/10/2025
            r'(\d{1,2}[/.]\d{1,2}[/.]\d{4})',   # 1/1/2025
            r'(\d{4}-\d{2}-\d{2})',             # 2025-10-26
            r'(\d{2}[/.]\d{2}[/.]\d{2})'        # 26/10/25 (Dangerous but common)
        ]
        
        # We also look for specific anchors to prioritize the "Invoice Date" over other dates
        # Hebrew: תאריך, לתאריך
        # English: Date, Invoice Date
        
        for pattern in date_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                date_str = match.group(0).replace('.', '/')
                try:
                    # Try parsing common formats
                    for fmt in ["%d/%m/%Y", "%Y-%m-%d", "%d/%m/%y"]:
                        try:
                            dt = datetime.strptime(date_str, fmt).date()
                            if 2000 < dt.year < 2030:
                                data["invoice_date"] = dt
                                break
                        except ValueError:
                            continue
                    if data["invoice_date"]: break
                except:
                    continue
            if data["invoice_date"]: break

        # 2. Extract Amount (Total)
        clean_text = text.replace('\u20aa', 'NIS ').replace('₪', 'NIS ')
        
        # Look for numbers that look like currency (e.g. 123.45 or 1,234.00)
        # We collect ALL currency-like numbers
        all_numbers = []
        matches = re.findall(r'(\d{1,3}(?:,\d{3})*(?:\.\d{2}))', clean_text)
        for m in matches:
            try:
                val = float(m.replace(',', ''))
                # Filter out likely non-amounts (like years 2025, or IDs that slipped through regex)
                if 0.0 < val < 50000 and val not in [2023, 2024, 2025, 2026]: 
                    all_numbers.append(val)
            except: pass
            
        if all_numbers:
            # Heuristic: Total amount is often the MAX value
            data["total_amount"] = max(all_numbers)

        # 3. VAT (Maam)
        # Logic: 
        # A. Look for explicit VAT keywords
        # B. If not found, CALCULATE it (Fallback)
        
        vat_keywords = [r'מע"?מ', r'VAT', r'Maam', r'Tax']
        found_explicit_vat = False
        
        for kw in vat_keywords:
            # Look for number near keyword
            # We look for small context window around the keyword
            pass 
            # (Keeping the regex simple for now as per previous success, but using all_numbers logic is better)
            
        # Let's try to match VAT from the list of numbers we foudn
        if data["total_amount"] and all_numbers:
            # Try to find a number that looks like ~15-18% of total
            for num in all_numbers:
                if num == data["total_amount"]: continue
                ratio = num / data["total_amount"]
                if 0.14 < ratio < 0.19: # 17% is 0.17. 18% is 0.18. (Allowing slop)
                    data["vat_amount"] = num
                    found_explicit_vat = True
                    break
        
        # User requested Fallback: If no VAT found, calculate 18% of Total
        if not data["vat_amount"] and data["total_amount"]:
            # Check if text implies "Inc VAT" or "Ex VAT"? 
            # Usually B2C invoices are Inc VAT.
            # 18% VAT means: Net * 1.18 = Total. => VAT = Total - (Total / 1.18)
            # OR is it just 18% OF the total? User said "Calculated AS 18% of the amount". 
            # Usually they mean Extract the vat component.
            # Let's assume Total is Gross.
            # VAT = Total * (0.17 / 1.17) for 17%. Currently Israel is 17%. 
            # Wait, user specifically mentioned "18%". Maybe they are old school or it's a specific sector?
            # Or maybe they mean simply Total * 0.18 (which would be weird for an invoice total).
            # I will assume they mean "Extract the VAT component assuming 17% (current IL rate)".
            # Correction: User wrote "18.00%" in the previous example image! 
            # Ah, the image shows "Maam Nigba 18.00%". OK, so the invoice confirms 18%. 
            # (Israel VAT is 17% since 2015, maybe this is a simulation image or old?).
            # I will use 17% as standard default but if user insisted on 18... 
            # Wait, the user text: "שיחשב כ 18% מהסכום". 
            # checking the image... extracted text says "18.00%". 
            # I will calculate VAT as Total * (18/118) -> extracting the tax from the gross.
            
            # Using 17% as it is the legal rate, unless user force 18.
            # User said "calculate as 18%". I will follow user instructions literally if possible, 
            # but usually its 17%. 
            # Actually, let's verify if the user's example image has 17 or 18.
            # Image: 35.00 Total. 29.66 Net. 5.34 VAT.
            # 29.66 * 0.18 = 5.3388 (5.34). 
            # So the image DOES use 18%. 
            # Okay, I will fallback to 18% calculation.
            
            data["vat_amount"] = round(data["total_amount"] * (0.18 / 1.18), 2)

        return data

extraction_service = ExtractionService()
