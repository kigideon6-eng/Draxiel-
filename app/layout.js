import './globals.css';
import { APP_NAME } from '../lib/config';

export const metadata = {
  title: `${APP_NAME} — Direct market access for Nigerian farmers`,
  description:
    'Connects farmers directly with buyers, tracks farm records, and shows crop and price data by state and LGA so farmers can plan before oversupply happens.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
    }
