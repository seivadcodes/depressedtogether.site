// src/components/ui/button.tsx
export default function Button({
  children,
  className = '',
  variant = 'default',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline' | 'destructive'; // ✅ add 'destructive'
  [key: string]: any;
}) {
  const baseClasses = "px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive", // ✅ add style
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}