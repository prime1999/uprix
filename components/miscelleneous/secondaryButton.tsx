import { forwardRef, type ComponentProps } from "react";

import GeneralButton from "./generalButton";

type SecondaryButtonProps = Omit<
  ComponentProps<typeof GeneralButton>,
  "variant"
> & {
  variant?: "active" | "secondary" | "default" | "disabled";
};

const SecondaryButton = forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ variant = "active", ...props }, ref) => {
    return <GeneralButton ref={ref} variant={variant} {...props} />;
  },
);

SecondaryButton.displayName = "SecondaryButton";

export default SecondaryButton;
