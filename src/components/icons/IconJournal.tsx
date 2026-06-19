interface Props {
  className?: string;
  size?: number;
}

export default function IconJournal({ className, size = 24 }: Props) {
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
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5z" />
      <path d="M8 8h8" />
      <path d="M8 12h6" />
      <path d="M8 16h4" />
    </svg>
  );
}
