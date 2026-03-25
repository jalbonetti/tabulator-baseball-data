// components/minMaxFilter.js - Min/Max Range Filter for Tabulator
// Compact dual-input filter for numeric columns (prop values, odds)
//
// FIX APPLIED: Removed -moz-appearance: textfield, -webkit-appearance: none,
//   and appearance: none from inline styles so number input spinners (up/down arrows) are visible.

export function createMinMaxFilter(cell, onRendered, success, cancel, editorParams = {}) {
    const maxWidth = editorParams.maxWidth || 45;
    
    const container = document.createElement('div');
    container.className = 'min-max-filter-container';
    container.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 2px;
        width: 100%;
        max-width: ${maxWidth}px;
        margin: 0 auto;
    `;
    
    // FIXED: Removed -moz-appearance, -webkit-appearance, appearance to keep spinners visible
    const inputStyle = `
        width: 100%;
        padding: 2px 3px;
        font-size: 9px;
        border: 1px solid #ccc;
        border-radius: 2px;
        text-align: center;
        box-sizing: border-box;
    `;
    
    const minInput = document.createElement('input');
    minInput.type = 'number';
    minInput.className = 'min-max-input min-input';
    minInput.placeholder = 'Min';
    minInput.style.cssText = inputStyle;
    
    const maxInput = document.createElement('input');
    maxInput.type = 'number';
    maxInput.className = 'min-max-input max-input';
    maxInput.placeholder = 'Max';
    maxInput.style.cssText = inputStyle;
    
    let filterTimeout = null;
    
    function applyFilter() {
        if (filterTimeout) {
            clearTimeout(filterTimeout);
        }
        
        filterTimeout = setTimeout(() => {
            const minVal = minInput.value !== '' ? parseFloat(minInput.value) : null;
            const maxVal = maxInput.value !== '' ? parseFloat(maxInput.value) : null;
            
            if (minVal === null && maxVal === null) {
                success('');
            } else {
                success({ min: minVal, max: maxVal });
            }
        }, 300);
    }
    
    minInput.addEventListener('change', applyFilter);
    minInput.addEventListener('input', applyFilter);
    maxInput.addEventListener('change', applyFilter);
    maxInput.addEventListener('input', applyFilter);
    
    // Prevent sort trigger on click
    minInput.addEventListener('click', (e) => { e.stopPropagation(); });
    maxInput.addEventListener('click', (e) => { e.stopPropagation(); });
    
    container.appendChild(minInput);
    container.appendChild(maxInput);
    
    return container;
}

export function minMaxFilterFunction(headerValue, rowValue, rowData, filterParams) {
    if (!headerValue || headerValue === '') return true;
    
    if (typeof headerValue === 'object' && headerValue !== null) {
        const { min, max } = headerValue;
        
        if (rowValue === null || rowValue === undefined || rowValue === '' || rowValue === '-') {
            return false;
        }
        
        const numValue = parseFloat(String(rowValue).replace(/[+$%,]/g, ''));
        
        if (isNaN(numValue)) return false;
        
        if (min !== null && numValue < min) return false;
        if (max !== null && numValue > max) return false;
        
        return true;
    }
    
    return true;
}

export default { createMinMaxFilter, minMaxFilterFunction };
