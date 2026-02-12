from typing import List, Dict, Any
from datetime import datetime, date
from collections import defaultdict
from ..models import InvoiceData
from .storage_service import storage_service

class AnalyticsService:
    def get_analytics(self, start_date: date, end_date: date) -> Dict[str, Any]:
        """
        Aggregates invoice data for the given date range.
        Returns data for:
        - Monthly expenses (bar chart)
        - Expenses by Label (pie chart)
        """
        all_invoices = storage_service.get_all()
        
        # Filter by date range
        relevant_invoices = [
            inv for inv in all_invoices 
            if inv.invoice_date and start_date <= inv.invoice_date <= end_date
        ]
        
        return {
            "monthly_breakdown": self._get_monthly_breakdown(relevant_invoices),
            "label_breakdown": self._get_label_breakdown(relevant_invoices),
            "total_count": len(relevant_invoices),
            "total_amount": sum(inv.total_amount or 0 for inv in relevant_invoices)
        }

    def _get_monthly_breakdown(self, invoices: List[InvoiceData]) -> List[Dict[str, Any]]:
        """
        Groups expenses by YYYY-MM.
        Returns list of dicts: [{"month": "2024-01", "amount": 123.45}, ...]
        """
        monthly_data = defaultdict(float)
        
        for inv in invoices:
            if inv.invoice_date and inv.total_amount:
                month_key = inv.invoice_date.strftime("%Y-%m")
                monthly_data[month_key] += inv.total_amount
                
        # Sort by month
        sorted_months = sorted(monthly_data.keys())
        
        return [
            {"month": month, "amount": round(monthly_data[month], 2)}
            for month in sorted_months
        ]

    def _get_label_breakdown(self, invoices: List[InvoiceData]) -> List[Dict[str, Any]]:
        """
        Groups expenses by label.
        Returns list of dicts: [{"name": "Food", "value": 123.45}, ...]
        """
        label_data = defaultdict(float)
        
        for inv in invoices:
            amount = inv.total_amount or 0
            if not inv.labels:
                label_data["Uncategorized"] += amount
            else:
                # If multiple labels, split amount? Or count for both?
                # Splitting might be more accurate for "Pie Chart" total, 
                # but "Tagging" usually implies full amount belongs to that category context.
                # However, for a Pie Chart that sums to 100%, we can't double count.
                # Simplest approach for now:
                # If multiple labels, assign to "Multiple" or split evenly?
                # Let's split evenly for now to preserve total sum.
                share = amount / len(inv.labels)
                for label in inv.labels:
                    label_data[label] += share
                    
        return [
            {"name": label, "value": round(val, 2)}
            for label, val in label_data.items()
            if val > 0
        ]

analytics_service = AnalyticsService()
