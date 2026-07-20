// ─── Constants for the Document Editor ───────────────────────────────────────

export const FONT_FAMILIES = [
  { label: 'Calibri', value: 'Calibri, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Palatino', value: 'Palatino, serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Tahoma', value: 'Tahoma, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Lucida Console', value: '"Lucida Console", monospace' },
  { label: 'Book Antiqua', value: '"Book Antiqua", serif' },
];

export const FONT_SIZES = ['8','9','10','11','12','14','16','18','20','22','24','26','28','36','48','72'];

export const TEXT_COLORS = [
  '#000000','#1f2937','#374151','#6b7280','#9ca3af','#d1d5db',
  '#dc2626','#ea580c','#d97706','#65a30d','#059669','#0891b2',
  '#2563eb','#7c3aed','#c026d3','#db2777',
  '#fca5a5','#fed7aa','#fde68a','#bbf7d0','#99f6e4','#bae6fd',
  '#bfdbfe','#ddd6fe','#fbcfe8','#ffffff',
];

export const HIGHLIGHT_COLORS = [
  '#fef9c3','#fde68a','#fed7aa','#fecaca','#d1fae5',
  '#cffafe','#dbeafe','#ede9fe','#fce7f3','#f1f5f9',
];

export const EMOJI_LIST = ['😀','😂','😊','😍','🎉','👍','🙏','❤️','⭐','✅','⚠️','📌','📎','📝','💡','🔥','🎯','📊','📈','📋'];

export const SYMBOL_LIST = ['©','®','™','°','±','≠','≤','≥','∞','√','∑','π','§','¶','†','•','–','—','…','÷','×','µ','¿','¡','€','£','¥','¢','ƒ','α','β','γ','δ','ε','θ','λ','Ω'];

export const LINE_SPACINGS = [
  { label: 'Single (1.0)', value: '1.0' },
  { label: '1.15', value: '1.15' },
  { label: '1.5', value: '1.5' },
  { label: 'Double (2.0)', value: '2.0' },
  { label: '2.5', value: '2.5' },
  { label: 'Triple (3.0)', value: '3.0' },
];

// Paper sizes in px at 96dpi
export const PAPER = {
  Letter:    { w: 816,  h: 1056, label: '8.5" × 11"', name: 'Letter' },
  Folio:     { w: 816,  h: 1248, label: '8.5" × 13"', name: 'Folio (8.5" × 13")' },
  Legal:     { w: 816,  h: 1344, label: '8.5" × 14"', name: 'Legal' },
  Tabloid:   { w: 1056, h: 1632, label: '11" × 17"', name: 'Tabloid' },
  Statement: { w: 528,  h: 816,  label: '5.5" × 8.5"', name: 'Statement' },
  Executive: { w: 696,  h: 1008, label: '7.25" × 10.5"', name: 'Executive' },
  A3:        { w: 1122, h: 1588, label: '11.69" × 16.54"', name: 'A3' },
  A4:        { w: 794,  h: 1122, label: '8.27" × 11.69"', name: 'A4' },
  A5:        { w: 560,  h: 794,  label: '5.83" × 8.27"', name: 'A5' },
  B4:        { w: 972,  h: 1376, label: '10.12" × 14.33"', name: 'B4 (JIS)' },
  B5:        { w: 688,  h: 972,  label: '7.17" × 10.12"', name: 'B5 (JIS)' },
};

export const MARGINS = {
  Normal:    96,
  Narrow:    48,
  Moderate:  72,
  Wide:      128,
  Narrative: { top: 96, bottom: 96, left: 144, right: 96 },
};

export const HEADING_OPTIONS = [
  { label: 'Normal Text', level: 0 },
  { label: 'Heading 1', level: 1 },
  { label: 'Heading 2', level: 2 },
  { label: 'Heading 3', level: 3 },
  { label: 'Heading 4', level: 4 },
  { label: 'Heading 5', level: 5 },
];

export const SHAPES = [
  { label: '★ Star', val: 'star', html: '<span style="font-size:24px;color:#eab308;display:inline-block;vertical-align:middle;">★</span>' },
  { label: '➔ Arrow', val: 'arrow', html: '<span style="font-size:20px;color:#2563eb;display:inline-block;vertical-align:middle;">➔</span>' },
  { label: '✔ Checkmark', val: 'checkmark', html: '<span style="font-size:20px;color:#16a34a;display:inline-block;vertical-align:middle;">✔</span>' },
  { label: '■ Square', val: 'square', html: '<span style="font-size:20px;color:#4b5563;display:inline-block;vertical-align:middle;">■</span>' },
  { label: '● Circle', val: 'circle', html: '<span style="font-size:20px;color:#dc2626;display:inline-block;vertical-align:middle;">●</span>' },
  { label: '▲ Triangle', val: 'triangle', html: '<span style="font-size:20px;color:#7c3aed;display:inline-block;vertical-align:middle;">▲</span>' },
  { label: '◆ Diamond', val: 'diamond', html: '<span style="font-size:20px;color:#0891b2;display:inline-block;vertical-align:middle;">◆</span>' },
  { label: '♥ Heart', val: 'heart', html: '<span style="font-size:20px;color:#dc2626;display:inline-block;vertical-align:middle;">♥</span>' },
];

export const ICONS = [
  { label: '📄 Document', val: 'doc', char: '📄' },
  { label: '📅 Calendar', val: 'calendar', char: '📅' },
  { label: '📊 Chart', val: 'chart', char: '📊' },
  { label: '👤 Person', val: 'user', char: '👤' },
  { label: '⚙️ Settings', val: 'settings', char: '⚙️' },
  { label: '📧 Email', val: 'email', char: '📧' },
  { label: '📞 Phone', val: 'phone', char: '📞' },
  { label: '🏠 Home', val: 'home', char: '🏠' },
  { label: '🔒 Lock', val: 'lock', char: '🔒' },
  { label: '💼 Briefcase', val: 'briefcase', char: '💼' },
];

export const EQUATIONS = [
  { label: 'Fraction', val: '½' },
  { label: 'Squared', val: 'x²' },
  { label: 'Cubed', val: 'x³' },
  { label: 'Square Root', val: '√x' },
  { label: 'Pi', val: 'π ≈ 3.14159' },
  { label: 'Summation', val: '∑' },
  { label: 'Integral', val: '∫' },
  { label: 'Infinity', val: '∞' },
  { label: 'Delta', val: 'Δ' },
  { label: 'Theta', val: 'θ' },
  { label: 'Alpha', val: 'α' },
  { label: 'Beta', val: 'β' },
  { label: 'Not Equal', val: '≠' },
  { label: 'Approx', val: '≈' },
  { label: 'Less/Equal', val: '≤' },
  { label: 'Greater/Equal', val: '≥' },
];
