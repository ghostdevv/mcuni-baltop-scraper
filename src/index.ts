import { type KV, list, read, write } from 'worktop/cfw.kv';
import { BalanceData, Context, UUID } from './types';
import { define, start } from 'worktop/cfw';
import { Router, compose } from 'worktop';
import { reply } from 'worktop/response';
import * as CORS from 'worktop/cors';
import { scrape } from './scrape';

const API = new Router<Context>();

API.prepare = compose(
    CORS.preflight({
        maxage: 3600 * 6,
        credentials: true,
    }),
);

API.add('GET', '/', async (req, ctx) => {
    const keys: string[] = [];

    for await (const chunk of list(ctx.bindings.BALANCES, {})) {
        keys.push(...chunk.keys);
    }

    const sortedKeys = keys.map((key) => Number(key)).sort((a, b) => a - b);
    const data: BalanceData[] = [];

    for (const key of sortedKeys) {
        const item = await read<BalanceData>(ctx.bindings.BALANCES, `${key}`);

        if (item) {
            data.push(item);
        }
    }

    const people: Record<UUID, number[]> = {};

    for (const point of data) {
        for (const [person, money] of Object.entries(point)) {
            if (!people[person]) people[person] = [];
            people[person] = [...people[person], money];
        }
    }

    return reply(200, people);
});

API.add('GET', '/username/:uuid', async (req, ctx) => {
    const uuid = ctx.params.uuid;

    const existing = await read<string>(ctx.bindings.USERNAMES, uuid, 'text');
    if (existing) return reply(200, existing);

    const res = await fetch(`https://api.minetools.eu/uuid/${uuid}`);
    const data: { name: string } = await res.json();

    await write<string>(ctx.bindings.USERNAMES, uuid, data.name);

    return reply(200, data.name);
});

export default define<Context['bindings']>({
    fetch: start(API.run).fetch,

    async scheduled(event, bindings, ctx) {
        const parsed = await scrape();
        await write(bindings.BALANCES, `${Date.now()}`, JSON.stringify(parsed));
    },
});
