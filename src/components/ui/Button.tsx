import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-primary text-white hover:bg-primary-dark",
    secondary: "bg-card text-text border border-border hover:bg-border",
    ghost: "text-text-secondary hover:bg-card",
    danger: "bg-red-500 text-white hover:bg-red-600",
  };
  const sizes = {
    sm: "px-2.5 py-1.5 text-xs gap-1",
    md: "px-3 py-2 text-sm gap-1.5",
    lg: "px-4 py-2.5 text-base gap-2",
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}