const MOBILE_PATTERN = /^09\d{9}$/;

/** Iranian mobile number in the national format, e.g. 09121234567. Expects Latin digits. */
export const isValidMobile = (mobile: string) => MOBILE_PATTERN.test(mobile);
