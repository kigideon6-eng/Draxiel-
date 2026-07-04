export default function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <path
        d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
        stroke="#C99A3E"
        strokeWidth="4"
      />
      <path
        d="M50 30 C50 30 35 40 35 55 C35 65 42 72 50 75 C58 72 65 65 65 55 C65 40 50 30 50 30 Z"
        fill="#C99A3E"
      />
      <line x1="50" y1="75" x2="50" y2="88" stroke="#C99A3E" strokeWidth="3" />
      <circle cx="30" cy="60" r="3" fill="#C99A3E" />
      <circle cx="70" cy="60" r="3" fill="#C99A3E" />
      <line x1="50" y1="88" x2="30" y2="60" stroke="#C99A3E" strokeWidth="2" />
      <line x1="50" y1="88" x2="70" y2="60" stroke="#C99A3E" strokeWidth="2" />
    </svg>
  );
    }
