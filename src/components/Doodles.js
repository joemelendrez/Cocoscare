// Hand-drawn style doodles in the logo's look: flat fill, thick ink
// outline. Every one takes className for size/position and a fill color.

const STROKE = { stroke: "var(--ink)", strokeWidth: 3, strokeLinejoin: "round", strokeLinecap: "round" };

export function Heart({ className, fill = "var(--pink)" }) {
  return (
    <svg viewBox="0 0 48 44" className={className} aria-hidden="true">
      <path
        d="M24 40C10 30 3 22 3 13.5 3 7.5 7.8 3 13.5 3c4.4 0 8 2.6 10.5 6.5C26.5 5.6 30.1 3 34.5 3 40.2 3 45 7.5 45 13.5 45 22 38 30 24 40Z"
        fill={fill}
        {...STROKE}
      />
      <path d="M11 11c1-2 3-3 5-3" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Star({ className, fill = "var(--butter)" }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <path
        d="M24 3l6.2 13 14.3 1.8-10.5 9.9 2.7 14.1L24 34.8l-12.7 7 2.7-14.1L3.5 17.8 17.8 16Z"
        fill={fill}
        {...STROKE}
      />
    </svg>
  );
}

export function Sparkle({ className, fill = "var(--paper)" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <path d="M20 2c1.6 9.5 8.5 16.4 18 18-9.5 1.6-16.4 8.5-18 18-1.6-9.5-8.5-16.4-18-18 9.5-1.6 16.4-8.5 18-18Z" fill={fill} {...STROKE} />
    </svg>
  );
}

export function Cookie({ className }) {
  return (
    <svg viewBox="0 0 52 52" className={className} aria-hidden="true">
      <circle cx="26" cy="26" r="22" fill="#f1b866" {...STROKE} />
      <circle cx="18" cy="18" r="3.4" fill="var(--ink)" />
      <circle cx="31" cy="15" r="2.6" fill="var(--ink)" />
      <circle cx="34" cy="29" r="3.4" fill="var(--ink)" />
      <circle cx="20" cy="33" r="2.8" fill="var(--ink)" />
      <circle cx="26" cy="25" r="2" fill="var(--ink)" />
    </svg>
  );
}

export function Flower({ className, fill = "var(--periwinkle)" }) {
  return (
    <svg viewBox="0 0 52 52" className={className} aria-hidden="true">
      {[0, 72, 144, 216, 288].map((r) => (
        <ellipse key={r} cx="26" cy="13" rx="8" ry="11" fill={fill} transform={`rotate(${r} 26 26)`} {...STROKE} />
      ))}
      <circle cx="26" cy="26" r="7" fill="var(--butter)" {...STROKE} />
    </svg>
  );
}

export function Bubble({ className, fill = "var(--paper)" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <circle cx="20" cy="20" r="17" fill={fill} {...STROKE} />
      <path d="M11 15c1.5-3 4-4.5 7-5" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" opacity=".5" />
    </svg>
  );
}

export function Squiggle({ className, color = "var(--ink)" }) {
  return (
    <svg viewBox="0 0 120 20" className={className} aria-hidden="true">
      <path d="M3 10c10-10 18 10 28 0s18 10 28 0 18 10 28 0 18 10 28 0" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// Category icons, drawn on a white bubble.
export function CategoryIcon({ name, className }) {
  const common = { fill: "none", ...STROKE };
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      {name === "whisk" && (
        <>
          <path d="M20 22v14" {...common} />
          <path d="M20 22c-7-4-8-17 0-18 8 1 7 14 0 18Z" fill="var(--paper)" {...STROKE} />
          <path d="M20 5v16M15.5 8c1 6 2.5 10 4.5 13M24.5 8c-1 6-2.5 10-4.5 13" {...common} strokeWidth="2" />
        </>
      )}
      {name === "bag" && (
        <>
          <path d="M8 14h24l-2 21H10Z" fill="var(--paper)" {...STROKE} />
          <path d="M14 17v-5a6 6 0 0 1 12 0v5" {...common} />
        </>
      )}
      {name === "pin" && (
        <>
          <path d="M20 36s11-11 11-19a11 11 0 0 0-22 0c0 8 11 19 11 19Z" fill="var(--paper)" {...STROKE} />
          <circle cx="20" cy="17" r="4" fill="var(--pink)" {...STROKE} strokeWidth="2.5" />
        </>
      )}
      {name === "heart" && (
        <path
          d="M20 34C9 26 5 20 5 13.5 5 9 8.5 6 12.5 6c3.2 0 5.7 1.9 7.5 4.7C21.8 7.9 24.3 6 27.5 6 31.5 6 35 9 35 13.5 35 20 31 26 20 34Z"
          fill="var(--paper)"
          {...STROKE}
        />
      )}
    </svg>
  );
}
