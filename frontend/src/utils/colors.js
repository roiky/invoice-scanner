
const colors = [
    { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', hover: 'hover:bg-blue-50' },
    { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', hover: 'hover:bg-green-50' },
    { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', hover: 'hover:bg-amber-50' },
    { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', hover: 'hover:bg-red-50' },
    { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', hover: 'hover:bg-purple-50' },
    { bg: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-200', hover: 'hover:bg-pink-50' },
    { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-200', hover: 'hover:bg-indigo-50' },
    { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200', hover: 'hover:bg-teal-50' },
    { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200', hover: 'hover:bg-orange-50' },
    { bg: 'bg-cyan-100', text: 'text-cyan-700', border: 'border-cyan-200', hover: 'hover:bg-cyan-50' },
    { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200', hover: 'hover:bg-lime-50' },
    { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200', hover: 'hover:bg-violet-50' },
    { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200', hover: 'hover:bg-fuchsia-50' },
    { bg: 'bg-rose-100', text: 'text-rose-700', border: 'border-rose-200', hover: 'hover:bg-rose-50' },
    { bg: 'bg-sky-100', text: 'text-sky-700', border: 'border-sky-200', hover: 'hover:bg-sky-50' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', hover: 'hover:bg-emerald-50' },
];

/**
 * Returns a consistent color object for a given label string.
 * @param {string} label 
 * @returns {{bg: string, text: string, border: string, hover: string}}
 */
export function getLabelColor(label) {
    if (!label) return colors[0];

    // Simple hash function
    let hash = 0;
    for (let i = 0; i < label.length; i++) {
        hash = label.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Map hash to index
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}
