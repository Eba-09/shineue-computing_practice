'use client';
export default function PrintButton({ children }) {
  return (
    <button type="button" className="btn ghost sm noprint" onClick={() => window.print()}>
      {children}
    </button>
  );
}
