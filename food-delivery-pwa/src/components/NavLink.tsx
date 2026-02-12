import * as React from "react";
import { NavLink as RouterNavLink } from "react-router-dom";
import { cn } from "../lib/utils";

type NavLinkCompatProps = React.ComponentPropsWithoutRef<typeof RouterNavLink> & {
  activeClassName?: string;
  pendingClassName?: string;
};

const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  (
    { className, activeClassName, pendingClassName, to, ...props },
    ref
  ) => {
    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";

export { NavLink };
