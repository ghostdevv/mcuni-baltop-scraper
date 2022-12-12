import type { Context as DefaultContext } from 'worktop';
import type { KV } from 'worktop/cfw.kv';

export interface Context extends DefaultContext {
    bindings: {
        BALANCES: KV.Namespace;
        USERNAMES: KV.Namespace;
    };
}

export type UUID = string;

export type RawBalanceData = Array<[uuid: UUID, bal: number]>;
export type BalanceData = Record<UUID, number>;

export type Balance = Record<string, BalanceData>;
