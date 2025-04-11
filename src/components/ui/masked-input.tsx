
import * as React from "react";
import InputMask from "react-input-mask";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface MaskedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, onChange, ...props }, ref) => {
    return (
      <InputMask
        mask={mask}
        onChange={onChange}
        disabled={props.disabled}
        readOnly={props.readOnly}
        {...props}
      >
        {(inputProps: any) => (
          <Input
            ref={ref}
            className={cn(className)}
            {...inputProps}
          />
        )}
      </InputMask>
    );
  }
);

MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
