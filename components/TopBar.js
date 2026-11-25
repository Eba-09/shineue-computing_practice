import Link from 'next/link';

export default function TopBar({ children, nav, active }) {
  return (
    <header className="top">
      <div className="top-in">
        <Link href="/" className="brand">
          <b>Computing Practice</b>
          <span>Шинэ Үе сургууль</span>
        </Link>
        {nav && (
          <nav>
            {nav.map(([href, label]) => (
              <Link key={href} href={href} className={active === href ? 'on' : ''}>
                {label}
              </Link>
            ))}
          </nav>
        )}
        <div className="who">{children}</div>
      </div>
    </header>
  );
}
