const API_URL = 'http://127.0.0.1:8000';

export const scanInvoices = async (startDate, endDate) => {
    const response = await fetch(`${API_URL}/scan?start_date=${startDate}&end_date=${endDate}`);
    if (!response.ok) {
        throw new Error('Scan failed');
    }
    return response.json();
};

export const getInvoices = async () => {
    const response = await fetch(`${API_URL}/invoices`);
    if (!response.ok) {
        throw new Error('Failed to fetch history');
    }
    return response.json();
};

export const updateInvoice = async (id, data) => {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error("Update failed:", response.status, errorText);
        throw new Error(`Update failed: ${response.status} ${errorText}`);
    }
    return response.json();
};

export const deleteInvoice = async (id) => {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Delete failed');
    }
    return response.json();
};

export const uploadInvoiceFile = async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_URL}/invoices/${id}/upload`, {
        method: 'POST',
        body: formData,
    });
    if (!response.ok) {
        throw new Error('Upload failed');
    }
    return response.json();
};

// --- Label Management ---

// --- User Auth ---

export const getProfile = async () => {
    try {
        const response = await fetch(`${API_URL}/auth/profile`);
        if (!response.ok) return null;
        return response.json();
    } catch (e) {
        return null;
    }
};

export const logout = async () => {
    try {
        await fetch(`${API_URL}/auth/logout`, { method: 'POST' });
        return true;
    } catch (e) {
        return false;
    }
};

export const login = async () => {
    const response = await fetch(`${API_URL}/auth/login`, { method: 'POST' });
    if (!response.ok) {
        throw new Error('Login failed');
    }
    return response.json();
};

// --- Label Management ---

export const getLabels = async () => {
    const response = await fetch(`${API_URL}/labels`);
    if (!response.ok) {
        throw new Error('Failed to fetch labels');
    }
    return response.json();
};

export const createLabel = async (label) => {
    const response = await fetch(`${API_URL}/labels`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ label }),
    });
    if (!response.ok) {
        throw new Error('Failed to create label');
    }
    return response.json();
};

export const deleteLabel = async (label) => {
    const response = await fetch(`${API_URL}/labels/${label}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Failed to delete label');
    }
    return response.json();
};

// --- Rules Management ---

export const getRules = async () => {
    const response = await fetch(`${API_URL}/rules`);
    if (!response.ok) throw new Error('Failed to fetch rules');
    return response.json();
};

export const createRule = async (rule) => {
    const response = await fetch(`${API_URL}/rules`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
    });
    if (!response.ok) throw new Error('Failed to create rule');
    return response.json();
};

export const updateRule = async (id, rule) => {
    const response = await fetch(`${API_URL}/rules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
    });
    if (!response.ok) throw new Error('Failed to update rule');
    return response.json();
};

export const deleteRule = async (id) => {
    const response = await fetch(`${API_URL}/rules/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete rule');
    return response.json();
};

export const exportData = async (format, invoiceIds) => {
    const endpoint = format === 'pdf' ? '/export/pdf' : '/export/zip';
    const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_ids: invoiceIds }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Export failed';
        try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.detail || errorMessage;
        } catch (e) {
            errorMessage = `Export failed: ${errorText}`;
        }
        throw new Error(errorMessage);
    }

    // Trigger download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = format === 'pdf' ? 'invoices_report.pdf' : 'invoices_export.zip';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
};
