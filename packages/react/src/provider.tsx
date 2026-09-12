import React, { useEffect, useMemo } from "react";
import type { AgentFormSchema } from "@formaccurate/core";
import { initFormAccurate, type FormAccurateBridge } from "@formaccurate/web";
import { FormAccurateContext } from "./context.js";

export interface FormAccurateProviderProps {
  /** Form identifier matching data-fa-form attribute. */
  formId: string;
  /** Optional explicit schema definition to register on mount. */
  schema?: AgentFormSchema | undefined;
  /** Toggle verbose bridge debug logging. */
  debug?: boolean | undefined;
  /** React children rendered within this form scope. */
  children: React.ReactNode;
}

/**
 * Provider component that binds FormAccurate web bridge to a React component subtree.
 *
 * Automatically initializes window.FormAccurate bridge, registers the form schema
 * if provided, and provides context for useFormAccurate().
 *
 * @param props - FormAccurateProviderProps configuration.
 * @returns Rendered React element.
 */
export function FormAccurateProvider({
  formId,
  schema,
  debug,
  children,
}: FormAccurateProviderProps): React.JSX.Element {
  const bridge: FormAccurateBridge = useMemo(() => {
    return initFormAccurate();
  }, []);

  useEffect(() => {
    if (schema) {
      bridge.registerSchema(schema);
    }
    if (debug !== undefined) {
      bridge.debug(debug);
    }
  }, [bridge, schema, debug]);

  const contextValue = useMemo(
    () => ({
      formId,
      bridge,
    }),
    [formId, bridge],
  );

  return (
    <FormAccurateContext.Provider value={contextValue}>
      {children}
    </FormAccurateContext.Provider>
  );
}
