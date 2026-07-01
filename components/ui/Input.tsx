import { forwardRef, type InputHTMLAttributes } from "react";

export const inputClasses =
  "block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition duration-150 placeholder:text-slate-400 hover:border-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100/80 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-70 aria-[invalid=true]:border-red-300 aria-[invalid=true]:focus:border-red-400 aria-[invalid=true]:focus:ring-red-100 motion-reduce:transition-none";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`${inputClasses} ${className}`.trim()}
        {...props}
      />
    );
  }
);

export default Input;
