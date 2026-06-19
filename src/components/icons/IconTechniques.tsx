interface Props {
  className?: string;
  size?: number;
}

export default function IconTechniques({ className, size = 24 }: Props) {
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
      <path d="M12 3L3 12l9 9 9-9-9-9z" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}
