interface Props {
  className?: string;
  size?: number;
}

export default function IconHome({ className, size = 24 }: Props) {
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
      <circle cx="12" cy="13.5" r="2" />
      <path d="M5 10.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8.5" />
      <path d="M3 12l9-8 9 8" />
    </svg>
  );
}
