export function IslamicPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="ip" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="currentColor" strokeWidth="0.6" opacity="0.5">
            <path d="M20 0 L40 20 L20 40 L0 20 Z" />
            <circle cx="20" cy="20" r="10" />
            <path d="M20 5 L35 20 L20 35 L5 20 Z" />
          </g>
        </pattern>
      </defs>
      <rect width="200" height="200" fill="url(#ip)" />
    </svg>
  );
}

export function MosqueSilhouette({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 800 200"
      preserveAspectRatio="xMidYEnd meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill="currentColor">
        {/* minaret left */}
        <rect x="80" y="60" width="14" height="140" />
        <circle cx="87" cy="55" r="10" />
        <path d="M82 35 L87 20 L92 35 Z" />
        {/* main dome */}
        <path d="M250 200 L250 130 Q250 70 320 60 Q330 30 350 30 Q370 30 380 60 Q450 70 450 130 L450 200 Z" />
        <path d="M340 30 L350 10 L360 30 Z" />
        {/* side domes */}
        <path d="M180 200 L180 150 Q180 110 220 105 Q220 95 230 95 Q240 95 240 105 Q280 110 280 150 L280 200 Z" />
        <path d="M420 200 L420 150 Q420 110 460 105 Q460 95 470 95 Q480 95 480 105 Q520 110 520 150 L520 200 Z" />
        {/* minaret right */}
        <rect x="600" y="70" width="14" height="130" />
        <circle cx="607" cy="65" r="10" />
        <path d="M602 45 L607 30 L612 45 Z" />
      </g>
    </svg>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <line x1="0" y1="20" x2="70" y2="20" />
        <line x1="130" y1="20" x2="200" y2="20" />
        <path d="M100 5 Q115 20 100 35 Q85 20 100 5 Z" />
        <circle cx="100" cy="20" r="3" fill="currentColor" />
        <circle cx="78" cy="20" r="2" fill="currentColor" />
        <circle cx="122" cy="20" r="2" fill="currentColor" />
      </g>
    </svg>
  );
}
