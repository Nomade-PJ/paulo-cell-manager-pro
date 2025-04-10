
import * as React from "react";
import InputMask from "react-input-mask";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface MaskedInputProps extends Omit<React.ComponentPropsWithoutRef<typeof Input>, "onChange"> {
  mask: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, onChange, ...props }, ref) => {
    return (
      <InputMask
        mask={mask}
        onChange={onChange}
        className={cn(className)}
        {...props}
      >
        {(inputProps: React.InputHTMLAttributes<HTMLInputElement>) => (
          <Input
            ref={ref}
            {...inputProps}
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
