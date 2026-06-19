interface Props {
  className?: string;
  size?: number;
}

export default function IconInsights({ className, size = 24 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="11" />
      <path d="M12 4V1" />
      <path d="M12 23v-3" />
      <path d="M4 12H1" />
      <path d="M23 12h-3" />
    </svg>
  );
}
