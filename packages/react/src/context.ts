import { createContext } from "react";
import type { FormAccurateBridge } from "@formaccurate/web";

/**
 * Context value provided by FormAccurateProvider.
 */
export interface FormAccurateContextValue {
  /** The registered FormAccurate form identifier. */
  formId: string;
  /** Active FormAccurate bridge instance. */
  bridge: FormAccurateBridge;
}

/**
 * React Context for FormAccurate form scope.
 */
export const FormAccurateContext = createContext<FormAccurateContextValue | null>(null);
