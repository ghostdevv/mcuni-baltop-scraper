import type { BalanceData, RawBalanceData } from './types';

export async function scrape(): Promise<BalanceData> {
    const response = await fetch('https://kit.mcuni.org/api/v3/balance.txt');
    const raw = await response.text();

    const parsed: RawBalanceData = JSON.parse(
        raw.replace(/[\w\d-]+(?=,)/g, '"$&"'),
    );

    return Object.fromEntries(parsed);
}
