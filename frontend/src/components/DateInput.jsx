import React, { useState, useEffect, useRef } from 'react';

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
    const inputRef = useRef(null);
    const isTypingRef = useRef(false);

    useEffect(() => {
        // Only update display value from prop if we are NOT currently typing it
        // OR if the prop value matches what we expect (validation succeeded)
        // But simpler: if prop changes and it's DIFFERENT from what our current display represents...

        // If the user clears the input (onChange("")), prop becomes "".
        // We want display to be "" too.

        // If user types "1", prop (via invalid) becomes "". 
        // We want display to REMAIN "1".

        // Problem: We can't distinguish "External Reset to Empty" vs "Internal Invalid to Empty".
        // Solution: Track if change was internal.

        if (!isTypingRef.current) {
            setDisplayValue(formatDateToDisplay(value));
        }
    }, [value]);

    const handleChange = (e) => {
        isTypingRef.current = true;
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
                // Determine if we need to release "typing" lock? 
                // Actually, if we send valid data, parent updates value.
                // Prop comes back same as we sent (hopefully).
                // isValidDate true -> we send YYYY-MM-DD.
                onChange(`${year}-${month}-${day}`);
                // We can reset typing ref on blur, but for now keep it true
                // to prevent loop if parent transforms it.
            } else {
                // Invalid date numbers (e.g. 32/01/2023)
                onChange("");
            }
        } else if (input === "") {
            onChange("");
        } else {
            // Partial input - parent value becomes empty/invalid until complete
            onChange("");
        }

        // Reset typing ref after a tick to allow prop verification? 
        // No, we need it to persist while focused usually.
    };

    const handleBlur = () => {
        isTypingRef.current = false;
        // On blur, force sync with valid value or clear if invalid?
        // If invalid, revert to prop?
        if (value) {
            setDisplayValue(formatDateToDisplay(value));
        }
        // If value is empty (invalid), leave it as is or clear? 
        // Better to leave it so user sees what they typed.
    };

    return (
        <input
            ref={inputRef}
            type="text"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={className}
            maxLength={10}
            required={required}
        />
    );
}
