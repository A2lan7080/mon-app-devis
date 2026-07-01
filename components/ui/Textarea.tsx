import { forwardRef, type TextareaHTMLAttributes } from "react";
import { inputClasses } from "./Input";

const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = "", ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={`${inputClasses} resize-y leading-6 ${className}`.trim()}
      {...props}
    />
  );
});

export default Textarea;
