// Source-text catalog. Brand names, destinations and traveller-entered data stay unchanged.
export const catalog={};
export function add(rows){for(const [source,fr,de,es] of rows){catalog[source.replace(/\s+/g,' ').trim().toLowerCase()]={fr,de,es}}}
