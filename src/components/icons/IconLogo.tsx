interface Props {
  className?: string;
  size?: number;
}

export default function IconLogo({ className, size = 48 }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="24" cy="24" r="20" strokeWidth="1.5" />
      <path
        d="M16 30c2-6 6-10 8-8s6-2 8 8"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="20" r="3" strokeWidth="1.5" />
      <path d="M24 17v-4" strokeWidth="1.5" />
      <path d="M24 27v6" strokeWidth="1.5" />
    </svg>
  );
}
