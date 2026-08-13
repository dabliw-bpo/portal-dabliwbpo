/**
 * Single source for the password length rule. The forms use it for the
 * browser-side hint and the actions re-check it on the server, so both sides
 * move together instead of drifting apart.
 */
export const MIN_PASSWORD_LENGTH = 9;

export const PASSWORD_TOO_SHORT = `A senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;

export const NEW_PASSWORD_TOO_SHORT = `A nova senha deve ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`;
