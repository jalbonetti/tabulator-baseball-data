// styles/tableStyles.js - RESPONSIVE VERSION
export function injectStyles() {
    // Responsive table configuration
    const getResponsiveWidth = () => {
        const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        
        // Desktop
        if (vw >= 1400) return {
            matchups: '100%',
            clearances: '100%',
            stats: '100%',
            props: '100%',
            maxWidth: '1400px'
        };
        
        // Laptop
        if (vw >= 1200) return {
            matchups: '100%',
            clearances: '100%',
            stats: '100%',
            props: '100%',
            maxWidth: '1200px'
        };
        
        // Tablet
        if (vw >= 768) return {
            matchups: '100%',
            clearances: '100%',
            stats: '100%',
            props: '100%',
            maxWidth: '100%'
        };
        
        // Mobile
        return {
            matchups: '100%',
            clearances: '100%',
            stats: '100%',
            props: '100%',
            maxWidth: '100%'
        };
    };

    const widths = getResponsiveWidth();

    var style = document.createElement('style');
    style.textContent = `
        /* RESPONSIVE TABLE SYSTEM */
        
        /* Base table responsiveness */
        .tabulator {
            width: 100% !important;
            max-width: ${widths.maxWidth} !important;
            margin: 0 auto !important;
            overflow: hidden !important;
        }
        
        /* Remove horizontal scroll */
        .tabulator .tabulator-tableHolder {
            overflow-x: hidden !important;
            overflow-y: auto !important;
            max-height: 80vh !important;
        }
        
        /* Responsive column widths */
        .tabulator .tabulator-col {
            min-width: 0 !important;
            flex-shrink: 1 !important;
        }
        
        /* Matchups table specific */
        #matchups-table {
            width: ${widths.matchups} !important;
            max-width: ${widths.maxWidth} !important;
        }
        
        #matchups-table .tabulator-tableHolder {
            max-height: 600px !important;
        }
        
        /* Clearances tables */
        #batter-table,
        #pitcher-table,
        #batter-table-alt,
        #pitcher-table-alt {
            width: ${widths.clearances} !important;
            max-width: ${widths.maxWidth} !important;
        }
        
        /* Stats tables */
        #mod-batter-stats-table,
        #mod-pitcher-stats-table {
            width: ${widths.stats} !important;
            max-width: ${widths.maxWidth} !important;
        }
        
        /* Props tables */
        #batter-props-table,
        #pitcher-props-table,
        #game-props-table {
            width: ${widths.props} !important;
            max-width: ${widths.maxWidth} !important;
        }
        
        /* Responsive font sizing */
        @media screen and (max-width: 1400px) {
            .tabulator { font-size: 13px !important; }
            .tabulator .tabulator-header { font-size: 12px !important; }
        }
        
        @media screen and (max-width: 1200px) {
            .tabulator { font-size: 12px !important; }
            .tabulator .tabulator-header { font-size: 11px !important; }
            .tabulator .tabulator-cell { padding: 4px 6px !important; }
        }
        
        @media screen and (max-width: 768px) {
            .tabulator { font-size: 11px !important; }
            .tabulator .tabulator-header { font-size: 10px !important; }
            .tabulator .tabulator-cell { padding: 3px 4px !important; }
            
            /* Mobile scale transform */
            .table-wrapper {
                transform: scale(0.7);
                transform-origin: top left;
                width: 143% !important;
            }
        }
        
        /* Tab buttons responsive */
        .tab-buttons {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            margin-bottom: 20px;
        }
        
        @media screen and (max-width: 768px) {
            .tab-button {
                padding: 8px 12px !important;
                font-size: 12px !important;
                flex: 1 1 calc(50% - 5px) !important;
            }
        }
        
        /* Prevent column resize handles */
        .tabulator-col-resize-handle {
            display: none !important;
        }
        
        /* Subtable responsive sizing */
        .subrow-container {
            width: 100% !important;
            overflow-x: auto !important;
        }
        
        .subrow-container .tabulator {
            font-size: 11px !important;
            min-width: 600px !important;
        }
        
        /* Hide scrollbars globally */
        * {
            scrollbar-width: none !important;
            -ms-overflow-style: none !important;
        }
        
        *::-webkit-scrollbar {
            display: none !important;
        }
    `;
    
    document.head.appendChild(style);
    
    // Add resize listener to update styles
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Redraw all Tabulator tables
            if (window.Tabulator) {
                const tables = document.querySelectorAll('.tabulator');
                tables.forEach(table => {
                    if (table._tabulator) {
                        table._tabulator.redraw();
                    }
                });
            }
        }, 250);
    });
}
