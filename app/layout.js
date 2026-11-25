import './globals.css';

export const metadata = {
  title: 'Computing Practice',
  description: 'Мэдээллийн технологийн хичээлийн дасгал',
};

export default function RootLayout({ children }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  );
}
