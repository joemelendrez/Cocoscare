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

// The Grocery List tool's icon: a paper bag of groceries (a baguette,
// greens and an apple) with a little heart on the front.
export function GroceryBag({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="38" y="2" width="9" height="32" rx="4.5" transform="rotate(22 42.5 18)" fill="#f1b866" {...STROKE} />
      <path d="M41 11.5l4 1.6M39.4 16.5l4 1.6M37.8 21.5l4 1.6" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 30C12 27 8 16 11 9c6 2 10 8 11 14 1-7 5-12 11-13 1 8-4 16-11 20Z" fill="#4cc38a" {...STROKE} />
      <path d="M22 29c-2-5-5-10-8-14M22 28c2-5 5-9 9-12" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
      <circle cx="31" cy="25" r="7.5" fill="#ff5a5f" {...STROKE} />
      <path d="M31 17.5c0-2 1-3.5 3-4.5" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27.5 22.5c.6-1.4 1.6-2.2 3-2.6" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M8 29h48l-3.6 29.5a3 3 0 0 1-3 2.5H14.6a3 3 0 0 1-3-2.5Z" fill="#e8c48f" {...STROKE} />
      <path d="M8 29h48l-.9 6.5H8.9Z" fill="#d9ad6e" {...STROKE} />
      <path
        d="M32 55c-6-4-8.5-7-8.5-10.3 0-2.4 1.9-4.2 4.2-4.2 1.8 0 3.3 1 4.3 2.6 1-1.6 2.5-2.6 4.3-2.6 2.3 0 4.2 1.8 4.2 4.2 0 3.3-2.5 6.3-8.5 10.3Z"
        fill="var(--pink)"
        {...STROKE}
        strokeWidth="2.5"
      />
    </svg>
  );
}

// The Meal Planner's icon: a week calendar with a heart on today.
export function PlannerDoodle({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect x="7" y="11" width="50" height="47" rx="7" fill="var(--paper)" {...STROKE} />
      <path d="M7 18a7 7 0 0 1 7-7h36a7 7 0 0 1 7 7v7H7Z" fill="var(--pink)" {...STROKE} />
      <path d="M20 6v10M44 6v10" fill="none" {...STROKE} strokeWidth="4" />
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2, 3].map((col) =>
          row === 1 && col === 2 ? null : (
            <rect key={`${row}-${col}`} x={13 + col * 10.5} y={30 + row * 8.5} width="6" height="5" rx="1.5" fill="var(--ink)" opacity=".25" />
          ),
        ),
      )}
      <path
        d="M37 47c-4-2.7-5.7-4.7-5.7-6.9 0-1.6 1.3-2.8 2.8-2.8 1.2 0 2.2.7 2.9 1.8.7-1.1 1.7-1.8 2.9-1.8 1.5 0 2.8 1.2 2.8 2.8 0 2.2-1.7 4.2-5.7 6.9Z"
        fill="var(--pink)"
        {...STROKE}
        strokeWidth="2.2"
      />
    </svg>
  );
}

// The Kitchen Converter's icon: a measuring cup with its lines.
export function MeasuringCup({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M48 24h4a7 7 0 0 1 7 7v6a7 7 0 0 1-7 7h-5" fill="none" {...STROKE} strokeWidth="4" />
      <path d="M10 12h40l-3 44a4 4 0 0 1-4 3.7H17a4 4 0 0 1-4-3.7Z" fill="var(--periwinkle)" {...STROKE} />
      <path d="M12.6 34h35.8l-1.4 22a4 4 0 0 1-4 3.7H18a4 4 0 0 1-4-3.7Z" fill="var(--butter)" {...STROKE} />
      <path d="M38 20h7M40 27h5M38 34h7M40 41h5M38 48h7" fill="none" stroke="var(--ink)" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M17 18c0 6 .5 10 1 13" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity=".8" />
    </svg>
  );
}

// The Boredom Buster's icon: a kite on a wiggly string.
export function KiteDoodle({ className }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <path d="M33 4 54 22 37 44 14 26Z" fill="var(--butter)" {...STROKE} />
      <path d="M33 4 37 44M14 26l40-4" fill="none" {...STROKE} strokeWidth="2.5" />
      <path d="M33 4 54 22 35.5 23Z" fill="var(--pink)" {...STROKE} strokeWidth="2.5" />
      <path d="M14 26l21.5-3 1.5 21Z" fill="var(--mint)" {...STROKE} strokeWidth="2.5" />
      <path d="M37 44c-4 4 2 6-2 10s-8 1-11 6" fill="none" {...STROKE} strokeWidth="2.5" />
      <path d="M32 50.5l-4-2 1 4ZM26 58l-4-1 2 3.5Z" fill="var(--periwinkle)" {...STROKE} strokeWidth="2" />
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
