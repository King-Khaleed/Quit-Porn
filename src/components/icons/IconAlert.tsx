interface Props {
  className?: string;
  size?: number;
}

export default function IconAlert({ className, size = 24 }: Props) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <circle cx="12" cy="16" r="0.5" fill="currentColor" />
    </svg>
  );
}
