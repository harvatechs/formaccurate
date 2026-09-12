/**
 * @formaccurate/web
 * Browser SDK for FormAccurate: progressive enhancement via data-fa-*
 * attributes and window.FormAccurate bridge.
 */

export type { FormBinding } from "./bind.js";
export { FormRegistry } from "./bind.js";

export type { FormAccurateBridge, FormSummary } from "./bridge.js";
export {
  FormAccurateBridgeImpl,
  getFormAccurate,
  initFormAccurate,
  resetFormAccurate,
} from "./bridge.js";

export {
  clearErrors,
  readFieldValue,
  renderErrors,
  setNativeValue,
  writeFieldValue,
} from "./dom-adapter.js";
