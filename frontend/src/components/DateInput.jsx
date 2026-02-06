import React, { useState, useEffect } from 'react';

export function DateInput({ value, onChange, className, placeholder = "DD/MM/YYYY", required = false }) {
    // value is expected to be YYYY-MM-DD or empty
    // displayValue is DD/MM/YYYY

    const formatDateToDisplay = (isoDate) => {
        if (!isoDate) return "";
        const [year, month, day] = isoDate.split('-');
        if (!year || !month || !day) return "";
        return `${day}/${month}/${year}`;
    };

    const [displayValue, setDisplayValue] = useState(formatDateToDisplay(value));

    useEffect(() => {
        setDisplayValue(formatDateToDisplay(value));
    }, [value]);

    const handleChange = (e) => {
        let input = e.target.value;

        // Allow only numbers and slashes
        if (!/^[0-9\/]*$/.test(input)) return;

        // Simple masking logic (optional, but helpful)
        if (input.length === 2 && displayValue.length === 1) input += '/';
        if (input.length === 5 && displayValue.length === 4) input += '/';

        // Setup internal state
        setDisplayValue(input);

        // Validation pattern: DD/MM/YYYY
        // regex: ^\d{2}/\d{2}/\d{4}$
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {
            const [day, month, year] = input.split('/');

            // Basic date validity check
            const dateObj = new Date(`${year}-${month}-${day}`);
            const isValidDate = dateObj instanceof Date && !isNaN(dateObj) && dateObj.getDate() === Number(day) && dateObj.getMonth() + 1 === Number(month);

            if (isValidDate) {
                onChange(`${year}-${month}-${day}`);
            } else {
                // Invalid date numbers (e.g. 32/01/2023)
                // We don't update parent, effectively "invalid" state in parent
                onChange("");
            }
        } else if (input === "") {
            onChange("");
        } else {
            // Partial input - parent value becomes empty/invalid until complete
            onChange("");
        }
    };

    return (
        <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            placeholder={placeholder}
            className={className}
            maxLength={10}
            required={required}
        />
    );
}
