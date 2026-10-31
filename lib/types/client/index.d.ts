/**
 * Aqua client plugin body: the toggleable glassmorphism skin. Owns the durable
 * enable flag (localStorage), applies/retracts the theme layer through
 * {@link AquaLayer}, and registers the master switch and glass controls in
 * the General section's Appearance area (`settings.general.item`).
 * One click on the master switch returns the stock UI (every layer is an
 * effect, disposed on flip).
 */
import type { Context as ClientContext } from '@deepseek-ai/cordis';
import './aqua.module.css';
import './fonts.module.css';
/** Required services: theme override stack plus the settings-card surfaces. */
export declare const inject: string[];
/**
 * Client plugin body.
 * @param ctx - client cordis context.
 */
export declare function apply(ctx: ClientContext): void;
