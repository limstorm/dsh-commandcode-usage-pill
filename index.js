/**
 * Host half of the usage-pill bundle.
 *
 * It has no host behaviour of its own: the numbers come from the account bridge
 * `dsh-commandcode-goat` already serves, so nothing here reads the credential or
 * registers a route. The row exists so the Client module is mounted and served.
 */
export function apply() {}
