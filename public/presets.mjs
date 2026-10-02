export const baseQuery = { source: 'expiring', tld: 'com,co.uk,net', minAge: 5, minTF: 15, maxNameLength: 25, sort: 'majTF', dir: 'desc', pageSize: 100 };
export const defaults = ['seo', 'backlink', 'domain'].map((q, i) => ({
  id: `goblin-${i}`, name: ['SEO sorcery', 'Backlink buffet', 'Domain dungeon'][i],
  purpose: `Expiring names matching “${q}”, with age 5+ and TF 15+. Keyword relevance still needs human inspection.`,
  query: { ...baseQuery, q }, refinement: { maxFullLength: 25, minQS: '', pattern: '' }
}));
