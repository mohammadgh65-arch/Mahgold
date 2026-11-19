const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 210" role="img" aria-label="مه‌گلد">
<defs>
  <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4e2b7"/><stop offset=".48" stop-color="#c6a264"/><stop offset="1" stop-color="#8e6c38"/></linearGradient>
  <linearGradient id="ink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#30291f"/><stop offset="1" stop-color="#17140f"/></linearGradient>
</defs>
<g transform="translate(8 7)">
  <circle cx="602" cy="98" r="83" fill="url(#ink)" stroke="url(#gold)" stroke-width="3"/>
  <circle cx="602" cy="98" r="73" fill="none" stroke="#d8bd83" stroke-opacity=".35" stroke-width="1.5"/>
  <path d="M548 143V55h16l38 49 38-49h16v88h-19V84l-35 45-35-45v59z" fill="url(#gold)"/>
  <path d="M583 163h38" stroke="url(#gold)" stroke-width="3" stroke-linecap="round"/>
  <path d="M667 36l5 10 11 5-11 5-5 11-5-11-11-5 11-5z" fill="#f0d9a7"/>
</g>
<g fill="#30291f">
  <text x="486" y="100" text-anchor="end" direction="rtl" unicode-bidi="bidi-override" font-family="Shabnam,Tahoma,serif" font-size="76" font-weight="700">مه‌گلد</text>
  <path d="M160 119h325" stroke="url(#gold)" stroke-width="2" stroke-linecap="round"/>
  <text x="486" y="153" text-anchor="end" font-family="Georgia,serif" font-size="17" letter-spacing="5" fill="#8d744b">MAHGOLD · FINE JEWELRY</text>
  <text x="486" y="178" text-anchor="end" direction="rtl" unicode-bidi="bidi-override" font-family="Shabnam,Tahoma,sans-serif" font-size="13" fill="#8d806a">درخششِ ماندگار، انتخابی ارزشمند</text>
</g>
</svg>`;
export const MAHGOLD_LOGO = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(logoSvg);
