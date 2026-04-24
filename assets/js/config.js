// ============================================================
// QuieroMiParcela — Configuration
// Replace GAS_URL with your Google Apps Script Web App URL
// after deploying Code.gs
// ============================================================

const CONFIG = {
  // Google Apps Script Web App URL (replace after deploying)
  GAS_URL: 'https://script.google.com/macros/s/AKfycbzMvScku3OZOfPHu1SyRxTktvxxgbck83ANN3N2HNRx78ltVu3Yfzo_mTgxB6anz3Bo_w/exec',

  // WhatsApp fallback (overridden by Sheet config)
  WHATSAPP_DEFAULT: '56900000000',

  // CLP currency formatter
  formatCLP(amount) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  },
};
