import Link from "next/link";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-slate-950 text-white hover:bg-slate-800",
  outline: "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-700 hover:bg-slate-100"
};

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

type LinkButtonProps = React.ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  className?: string;
};

export function LinkButton({ className, variant = "default", ...props }: LinkButtonProps) {
  return (
    <Link
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
