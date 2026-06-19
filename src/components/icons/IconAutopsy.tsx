interface Props {
  className?: string;
  size?: number;
}

export default function IconAutopsy({ className, size = 24 }: Props) {
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
      <circle cx="11" cy="11" r="6" />
      <path d="M16.5 16.5L21 21" />
      <path d="M7 11l2 2 4-4" />
    </svg>
  );
}
