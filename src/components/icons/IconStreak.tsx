interface Props {
  className?: string;
  size?: number;
}

export default function IconStreak({ className, size = 24 }: Props) {
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
      <path d="M12 3l2 5 5.5 1L15 12l1.5 5.5L12 15l-4.5 2.5L9 12 4.5 9 10 8l2-5z" />
    </svg>
  );
}
