
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

    def should_delete(self, invoice: InvoiceData) -> bool:
        rules = self.get_all_rules()
        active_rules = [r for r in rules if r.is_active]
        for rule in active_rules:
            is_match = self._check_conditions(rule, invoice)
            if is_match:
                for action in rule.actions:
                    if action.action_type == "delete_invoice":
                        return True
        return False

    def apply_rules(self, invoice: InvoiceData) -> Optional[InvoiceData]:
        rules = self.get_all_rules()
        
        # Only apply active rules
        active_rules = [r for r in rules if r.is_active]
        
        for rule in active_rules:
            if self._check_conditions(rule, invoice):
                action_result = self._apply_actions(rule, invoice)
                if action_result == "DELETE":
                    return None
                
        return invoice

    def _apply_actions(self, rule: Rule, invoice: InvoiceData) -> Optional[str]:
        for action in rule.actions:
            if action.action_type == "set_status":
                invoice.status = action.value
            elif action.action_type == "add_label":
                # Support multiple labels (comma-separated)
                labels_to_add = [l.strip() for l in action.value.split(",") if l.strip()]
                for label in labels_to_add:
                    if label not in invoice.labels:
                        invoice.labels.append(label)
            elif action.action_type == "delete_invoice":
                return "DELETE"
        return None

    def _check_conditions(self, rule: Rule, invoice: InvoiceData) -> bool:
        if not rule.conditions:
            return True # No conditions = match all?
            
        # Logic: AND (all must match) vs OR (any must match)
        is_or_logic = (getattr(rule, 'logic', 'AND') == 'OR')
        
        for condition in rule.conditions:
            field_value = getattr(invoice, condition.field, None)
            
            # Convert to string for comparison, handle None
            if field_value is None: 
                field_value = ""
            
            field_value_str = str(field_value).lower()
            cond_value_str = str(condition.value).lower()
            
            match = False
            if condition.operator == "contains":
                if cond_value_str in field_value_str: match = True
            elif condition.operator == "equals":
                if field_value_str == cond_value_str: match = True
            elif condition.operator == "starts_with":
                if field_value_str.startswith(cond_value_str): match = True
            elif condition.operator == "ends_with":
                if field_value_str.endswith(cond_value_str): match = True
            # Numeric comparisons
            elif condition.operator in ["gt", "lt"]:
                try:
                    f_val = float(field_value)
                    c_val = float(condition.value)
                    if condition.operator == "gt" and f_val > c_val: match = True
                    elif condition.operator == "lt" and f_val < c_val: match = True
                except ValueError:
                    match = False # Cannot compare non-numbers
            
            # Logic Check
            if is_or_logic:
                if match: return True # Found one match in OR -> Rule applies
            else:
                if not match: return False # Found one mismatch in AND -> Rule fails
                
        # End of loop
        if is_or_logic:
            return False # No matches found in OR -> Rule fails
        else:
            return True # No mismatches found in AND -> Rule applies



rule_service = RuleService()
