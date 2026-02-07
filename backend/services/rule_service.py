
import json
import os
import uuid
from typing import List, Optional
from ..models import Rule, InvoiceData

RULES_FILE = "backend/data/rules.json"

class RuleService:
    def __init__(self):
        self._ensure_file()

    def _ensure_file(self):
        if not os.path.exists(RULES_FILE):
            os.makedirs(os.path.dirname(RULES_FILE), exist_ok=True)
            with open(RULES_FILE, "w") as f:
                json.dump([], f)

    def get_all_rules(self) -> List[Rule]:
        with open(RULES_FILE, "r") as f:
            data = json.load(f)
            return [Rule(**item) for item in data]

    def _save_rules(self, rules: List[Rule]):
        with open(RULES_FILE, "w") as f:
            json.dump([rule.dict() for rule in rules], f, indent=2)

    def create_rule(self, rule: Rule) -> Rule:
        if not rule.id:
            rule.id = str(uuid.uuid4())
        rules = self.get_all_rules()
        rules.append(rule)
        self._save_rules(rules)
        return rule

    def update_rule(self, rule_id: str, updated_rule: Rule) -> Optional[Rule]:
        rules = self.get_all_rules()
        for i, r in enumerate(rules):
            if r.id == rule_id:
                # Ensure ID persists
                updated_rule.id = rule_id
                rules[i] = updated_rule
                self._save_rules(rules)
                return updated_rule
        return None

    def delete_rule(self, rule_id: str) -> bool:
        rules = self.get_all_rules()
        initial_len = len(rules)
        rules = [r for r in rules if r.id != rule_id]
        if len(rules) < initial_len:
            self._save_rules(rules)
            return True
        return False

    def apply_rules(self, invoice: InvoiceData) -> InvoiceData:
        rules = self.get_all_rules()
        
        # Only apply active rules
        active_rules = [r for r in rules if r.is_active]
        
        for rule in active_rules:
            if self._check_conditions(rule, invoice):
                print(f"Applying rule '{rule.name}' to invoice {invoice.id}")
                self._apply_actions(rule, invoice)
                
        return invoice

    def _check_conditions(self, rule: Rule, invoice: InvoiceData) -> bool:
        # ALL conditions must match (AND logic)
        for condition in rule.conditions:
            field_value = getattr(invoice, condition.field, None)
            
            # Convert to string for comparison, handle None
            if field_value is None: 
                field_value = ""
            
            field_value_str = str(field_value).lower()
            cond_value_str = str(condition.value).lower()
            
            if condition.operator == "contains":
                if cond_value_str not in field_value_str: return False
            elif condition.operator == "equals":
                if field_value_str != cond_value_str: return False
            elif condition.operator == "starts_with":
                if not field_value_str.startswith(cond_value_str): return False
            elif condition.operator == "ends_with":
                if not field_value_str.endswith(cond_value_str): return False
            # Numeric comparisons (try to convert back to float)
            elif condition.operator in ["gt", "lt"]:
                try:
                    f_val = float(field_value)
                    c_val = float(condition.value)
                    if condition.operator == "gt" and not (f_val > c_val): return False
                    if condition.operator == "lt" and not (f_val < c_val): return False
                except ValueError:
                    return False # Cannot compare non-numbers
                    
        return True

    def _apply_actions(self, rule: Rule, invoice: InvoiceData):
        for action in rule.actions:
            if action.action_type == "set_status":
                invoice.status = action.value
            elif action.action_type == "add_label":
                if action.value not in invoice.labels:
                    invoice.labels.append(action.value)

rule_service = RuleService()
