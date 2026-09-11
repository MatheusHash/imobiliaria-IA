import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("text-sm font-medium text-slate-700", className)} {...props} />;
}

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none ring-offset-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "min-h-28 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none ring-offset-white placeholder:text-slate-400 focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm outline-none ring-offset-white focus:ring-2 focus:ring-slate-950 focus:ring-offset-2",
        className
      )}
      {...props}
    />
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-600">{message}</p>;
}
