import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function baseProps({ size = 14, className, ...rest }: IconProps) {
  return {
    viewBox: "0 0 24 24",
    width: size,
    height: size,
    fill: "none",
    "aria-hidden": true as const,
    className: ["shrink-0", className].filter(Boolean).join(" "),
    ...rest,
  };
}

/** 카드 메타용 위치 핀 */
export function MapPinIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <path
        d="M12 21s6.5-5.2 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.8 12 21 12 21Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10.5" r="2.2" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

/** 카드 메타용 일정 */
export function CalendarIcon(props: IconProps) {
  return (
    <svg {...baseProps(props)}>
      <rect
        x="3.75"
        y="5"
        width="16.5"
        height="15"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3.5V6.5M16 3.5V6.5M3.75 9.5h16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.5 13.5h2M13.5 13.5h2M8.5 16.5h2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
