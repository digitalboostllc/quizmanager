document.addEventListener('DOMContentLoaded', () => {
    // Theme toggle
    const themeToggle = document.getElementById('toggleTheme');
    const html = document.documentElement;

    // Initialize theme from localStorage or system preference
    const savedTheme = localStorage.getItem('design-system-theme');
    if (savedTheme) {
        html.classList.toggle('dark', savedTheme === 'dark');
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        html.classList.toggle('dark', prefersDark);
    }

    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        const currentTheme = html.classList.contains('dark') ? 'dark' : 'light';
        localStorage.setItem('design-system-theme', currentTheme);
    });

    // Color panel toggle
    const colorPanelToggle = document.getElementById('toggleColorPanel');
    const colorPanel = document.getElementById('controls');

    if (colorPanelToggle && colorPanel) {
        colorPanelToggle.addEventListener('click', () => {
            // Toggle visibility based on screen size
            if (window.innerWidth < 1024) { // lg breakpoint in Tailwind
                colorPanel.classList.toggle('hidden');
            }
        });
    }

    // Initialize opacity inputs
    document.querySelectorAll('input[type="range"]').forEach(input => {
        const valueDisplay = input.nextElementSibling;
        if (valueDisplay) {
            valueDisplay.textContent = input.value;
            input.addEventListener('input', () => {
                valueDisplay.textContent = input.value;
                applyChanges();
            });
        }
    });

    // Color inputs
    const colorInputs = {
        background: document.getElementById('backgroundColor'),
        primary: document.getElementById('primaryColor'),
        secondary: document.getElementById('secondaryColor'),
        muted: document.getElementById('mutedColor')
    };

    // Add event listeners to color inputs
    Object.values(colorInputs).forEach(input => {
        if (input) {
            input.addEventListener('input', applyChanges);
        }
    });

    // Initialize color inputs with current CSS variable values
    function initializeColorInputs() {
        const computedStyle = getComputedStyle(document.documentElement);

        function getHslColor(variable) {
            const hsl = computedStyle.getPropertyValue(variable).trim();
            // Convert HSL to hex for the color input
            // This is a simplified conversion and might not be perfect
            return hslToHex(hsl);
        }

        if (colorInputs.background) {
            colorInputs.background.value = getHslColor('--background');
        }

        if (colorInputs.primary) {
            colorInputs.primary.value = getHslColor('--primary');
        }

        if (colorInputs.secondary) {
            colorInputs.secondary.value = getHslColor('--secondary');
        }

        if (colorInputs.muted) {
            colorInputs.muted.value = getHslColor('--muted');
        }
    }

    // Very simplified HSL to hex conversion - would need improvement for production
    function hslToHex(hsl) {
        // Default to a middle gray if conversion isn't implemented
        return "#888888";
    }

    // Save settings
    const saveButton = document.getElementById('saveBtn');
    saveButton.addEventListener('click', saveSettings);

    function saveSettings() {
        const settings = {
            colors: {}
        };

        for (const [key, input] of Object.entries(colorInputs)) {
            if (input) settings.colors[key] = input.value;
        }

        localStorage.setItem('design-system-settings', JSON.stringify(settings));

        // Show confirmation
        alert('Settings saved! You can apply these in your design system.');
    }

    // Load settings
    const loadSettings = () => {
        const savedSettings = localStorage.getItem('design-system-settings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);

            // Restore color values
            if (settings.colors) {
                for (const [key, value] of Object.entries(settings.colors)) {
                    if (colorInputs[key]) {
                        colorInputs[key].value = value;
                    }
                }
            }

            // Apply the loaded settings
            applyChanges();
        }
    };

    // Apply changes function
    function applyChanges() {
        // Update the preview components with the new colors
        // This would involve setting CSS variables or applying classes

        // For example, to update a CSS variable:
        for (const [key, input] of Object.entries(colorInputs)) {
            if (input) {
                // Convert hex to HSL for CSS variables
                // document.documentElement.style.setProperty(`--${key}`, hexToHsl(input.value));
            }
        }

        // Create a CSS export for copying
        generateExportCSS();
    }

    // Function to generate exportable CSS
    function generateExportCSS() {
        const exportArea = document.getElementById('exportCss');
        if (!exportArea) return;

        let css = `/* Design System Colors */\n\n`;

        for (const [key, input] of Object.entries(colorInputs)) {
            if (input) {
                css += `--${key}: ${input.value};\n`;
            }
        }

        css += `\n/* Example usage with opacity */\n`;
        css += `.bg-primary-subtle { background-color: color-mix(in srgb, var(--primary) 10%, transparent); }\n`;
        css += `.bg-muted-subtle { background-color: color-mix(in srgb, var(--muted) 20%, transparent); }\n`;

        exportArea.textContent = css;
    }

    // Copy to clipboard functionality
    const copyButton = document.getElementById('copyBtn');
    if (copyButton) {
        copyButton.addEventListener('click', () => {
            const exportArea = document.getElementById('exportCss');
            if (exportArea) {
                navigator.clipboard.writeText(exportArea.textContent).then(() => {
                    const originalText = copyButton.textContent;
                    copyButton.textContent = 'Copied!';
                    setTimeout(() => {
                        copyButton.textContent = originalText;
                    }, 2000);
                });
            }
        });
    }

    // Initialize on page load
    try {
        initializeColorInputs();
        loadSettings();
    } catch (error) {
        console.error('Error initializing color settings:', error);
    }
}); 