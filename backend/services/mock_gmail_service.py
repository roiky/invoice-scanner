from typing import List
from datetime import date, timedelta
import random
import uuid
from ..models import InvoiceData, ScanResult

class MockGmailService:
    def scan_invoices(self, start_date: date, end_date: date) -> ScanResult:
        """
        Simulates scanning Gmail for invoices.
        Generates random invoice data within the date range.
        """
        vendors = ["Amazon", "Google Cloud", "DigitalOcean", "Upwork", "Fiverr", "Partner Communications", "Electric Company"]
        invoices = []
        
        # Simulate finding 5-15 invoices
        num_invoices = random.randint(5, 15)
        
        for _ in range(num_invoices):
            # Random date within range
            days_diff = (end_date - start_date).days
            if days_diff <= 0:
                random_days = 0
            else:
                random_days = random.randint(0, days_diff)
                
            invoice_date = start_date + timedelta(days=random_days)
            
            vendor = random.choice(vendors)
            amount = round(random.uniform(50.0, 2000.0), 2)
            vat = round(amount * 0.17, 2)
            
            invoice = InvoiceData(
                id=str(uuid.uuid4()),
                filename=f"Invoice_{vendor}_{invoice_date}.pdf",
                sender_email=f"billing@{vendor.lower().replace(' ', '')}.com",
                subject=f"Invoice from {vendor} - {random.randint(1000, 9999)}",
                invoice_date=invoice_date,
                vendor_name=vendor,
                total_amount=amount,
                currency="ILS",
                vat_amount=vat,
                is_processed=random.choice([True, False])
            )
            invoices.append(invoice)
            
        return ScanResult(
            total_emails_scanned=random.randint(100, 500),
            invoices_found=len(invoices),
            invoices=invoices
        )

mock_gmail_service = MockGmailService()
