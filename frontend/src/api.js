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
