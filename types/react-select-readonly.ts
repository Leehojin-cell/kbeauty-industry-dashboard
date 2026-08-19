import "react";

declare module "react" {
  interface SelectHTMLAttributes<T> {
    /** Compatibility for the fixed year-range selector used by the dashboard. */
    readOnly?: boolean;
  }
}
