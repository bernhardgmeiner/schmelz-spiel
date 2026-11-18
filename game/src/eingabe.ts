// Tastatur, Maus und Touch. Liefert pro Frame Bewegung und Blickänderung.

export class Eingabe {
  vor = 0;
  seite = 0;
  laufen = false;
  blickX = 0;
  blickY = 0;
  zoom = 0;
  aktiv = true; // false, solange ein Aufgabenfenster offen ist
  touch = false;
  beiAktion: () => void = () => {};

  private tasten = new Set<string>();
  private ziehen: { id: number; x: number; y: number } | null = null;
  private stick: { id: number; x: number; y: number; dx: number; dy: number } | null = null;
  private sammelX = 0;
  private sammelY = 0;
  private sammelZoom = 0;
  private stickEl: HTMLElement;
  private knopfEl: HTMLElement;

  constructor(private flaeche: HTMLElement) {
    this.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    this.stickEl = document.getElementById('stick')!;
    this.knopfEl = document.getElementById('aktion')!;

    window.addEventListener('keydown', (e) => {
      if (!this.aktiv || (e.target instanceof Element && e.target.closest('input, select, textarea'))) return;
      this.tasten.add(e.code);
      if (e.code === 'KeyE' || e.code === 'Enter') this.beiAktion();
      if (e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => this.tasten.delete(e.code));
    window.addEventListener('blur', () => this.tasten.clear());

    flaeche.addEventListener('pointerdown', (e) => this.runter(e));
    window.addEventListener('pointermove', (e) => this.bewegt(e));
    window.addEventListener('pointerup', (e) => this.hoch(e));
    window.addEventListener('pointercancel', (e) => this.hoch(e));
    flaeche.addEventListener('wheel', (e) => { this.sammelZoom += Math.sign(e.deltaY) * 0.6; e.preventDefault(); }, { passive: false });
    flaeche.addEventListener('contextmenu', (e) => e.preventDefault());
    this.knopfEl.addEventListener('pointerdown', (e) => { e.stopPropagation(); this.beiAktion(); });
  }

  private runter(e: PointerEvent) {
    if (!this.aktiv) return;
    const linkeHaelfte = e.clientX < window.innerWidth * 0.45;
    if (e.pointerType === 'touch' && linkeHaelfte && !this.stick) {
      this.stick = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0 };
      this.stickEl.style.left = `${e.clientX}px`;
      this.stickEl.style.top = `${e.clientY}px`;
      this.stickEl.classList.add('an');
    } else if (!this.ziehen) {
      this.ziehen = { id: e.pointerId, x: e.clientX, y: e.clientY };
    }
    this.flaeche.setPointerCapture?.(e.pointerId);
  }

  private bewegt(e: PointerEvent) {
    if (this.stick && e.pointerId === this.stick.id) {
      const max = 50;
      let dx = e.clientX - this.stick.x;
      let dy = e.clientY - this.stick.y;
      const l = Math.hypot(dx, dy);
      if (l > max) { dx *= max / l; dy *= max / l; }
      this.stick.dx = dx / max; this.stick.dy = dy / max;
      (this.stickEl.firstElementChild as HTMLElement).style.transform = `translate(${dx}px, ${dy}px)`;
    } else if (this.ziehen && e.pointerId === this.ziehen.id) {
      const faktor = e.pointerType === 'touch' ? 0.006 : 0.005;
      this.sammelX += (e.clientX - this.ziehen.x) * faktor;
      this.sammelY += (e.clientY - this.ziehen.y) * faktor;
      this.ziehen.x = e.clientX; this.ziehen.y = e.clientY;
    }
  }

  private hoch(e: PointerEvent) {
    if (this.stick && e.pointerId === this.stick.id) {
      this.stick = null;
      this.stickEl.classList.remove('an');
      (this.stickEl.firstElementChild as HTMLElement).style.transform = '';
    }
    if (this.ziehen && e.pointerId === this.ziehen.id) this.ziehen = null;
  }

  zeigeAktion(an: boolean, text: string) {
    this.knopfEl.hidden = !an;
    this.knopfEl.textContent = text;
  }

  loslassen() {
    this.tasten.clear();
    this.stick = null;
    this.ziehen = null;
    this.stickEl.classList.remove('an');
  }

  /** Einmal pro Frame aufrufen. */
  lesen() {
    const k = (c: string) => this.tasten.has(c);
    let vor = (k('KeyW') || k('ArrowUp') ? 1 : 0) - (k('KeyS') || k('ArrowDown') ? 1 : 0);
    let seite = (k('KeyD') || k('ArrowRight') ? 1 : 0) - (k('KeyA') || k('ArrowLeft') ? 1 : 0);
    let laufen = k('ShiftLeft') || k('ShiftRight');
    if (this.stick) {
      vor = -this.stick.dy;
      seite = this.stick.dx;
      laufen = Math.hypot(this.stick.dx, this.stick.dy) > 0.95;
    }
    this.vor = this.aktiv ? vor : 0;
    this.seite = this.aktiv ? seite : 0;
    this.laufen = laufen;
    this.blickX = this.aktiv ? this.sammelX : 0;
    this.blickY = this.aktiv ? this.sammelY : 0;
    this.zoom = this.aktiv ? this.sammelZoom : 0;
    this.sammelX = this.sammelY = this.sammelZoom = 0;
  }
}
