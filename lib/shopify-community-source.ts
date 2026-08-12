import type { DiscoveryCandidate } from './discovery';

const COMMUNITY_BASE = 'https://community.shopify.com';
const USER_AGENT = 'EarlyFindBot/0.3 (+https://earlyfinds.site; public store discovery)';

const BLOCKED_HOSTS = new Set([
  'community.shopify.com',
  'shopify.com',
  'www.shopify.com',
  'help.shopify.com',
  'admin.shopify.com',
  'accounts.shopify.com',
  'apps.shopify.com',
  'themes.shopify.com',
  'partners.shopify.com',
  'youtube.com',
  'www.youtube.com',
  'youtu.be',
  'facebook.com',
  'www.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'tiktok.com',
  'www.tiktok.com',
  'x.com',
  'twitter.com',
  'www.twitter.com',
  'linkedin.com',
  'www.linkedin.com',
  'reddit.com',
  'www.reddit.com',
  'discord.com',
  'discord.gg',
]);

const BLOCKED_SUFFIXES = [
  '.shopifycdn.com',
  '.shopifycloud.com',
  '.cloudfront.net',
  '.googleusercontent.com',
  '.gravatar.com',
  '.discourse-cdn.com',
  '.doubleclick.net',
  '.google.com',
  '.gstatic.com',
];

const BLOCKED_FRAGMENTS = [
  'cdn.',
  'static.',
  'assets.',
  'analytics.',
  'pixel.',
  'tracking.',
];

type CategoryPayload = {
  topic_list?: {
    topics?: Array<{ id?: number; slug?: string; created_at?: string }>;
  };
};

type TopicPayload = {
  post_stream?: {
    posts?: Array<{ cooked?: string; raw?: string; created_at?: string }>;
  };
};

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function blockedHost(host: string) {
  if (BLOCKED_HOSTS.has(host)) return true;
  if (BLOCKED_SUFFIXES.some((suffix) => host.endsWith(suffix))) return true;
  if (BLOCKED_FRAGMENTS.some((fragment) => host.startsWith(fragment))) return true;
  if (host.endsWith('.shopify.com') && !host.endsWith('.myshopify.com')) return true;
  return false;
}

function normalizeCandidate(raw: string) {
  const cleaned = raw
    .trim()
    .replace(/&amp;/gi, '&')
    .replace(/[),.;'\"<>]+$/g, '');
  const value = /^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`;
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (!host.includes('.') || blockedHost(host)) return null;
    return host;
  } catch {
    return null;
  }
}

function extractDomains(text: string) {
  const found = new Set<string>();
  const hrefs = [...text.matchAll(/href=["'](https?:\/\/[^"']+)["']/gi)].map((match) => match[1]);
  const plain = text.match(/(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[\w\-./?%&=+#]*)?/gi) ?? [];

  for (const raw of [...hrefs, ...plain]) {
    const domain = normalizeCandidate(raw);
    if (domain) found.add(domain);
  }
  return [...found];
}

export async function getShopifyCommunityCandidates(limit = 40): Promise<DiscoveryCandidate[]> {
  const cap = Math.max(1, Math.min(limit, 80));
  const topics: Array<{ id: number; slug: string; createdAt?: string }> = [];

  for (let page = 0; page < 4 && topics.length < cap * 3; page += 1) {
    const payload = await fetchJson<CategoryPayload>(`${COMMUNITY_BASE}/c/store-feedback/125.json?page=${page}`);
    for (const topic of payload?.topic_list?.topics ?? []) {
      if (!topic.id || !topic.slug) continue;
      topics.push({ id: topic.id, slug: topic.slug, createdAt: topic.created_at });
    }
  }

  const candidates = new Map<string, DiscoveryCandidate>();

  for (const topic of topics.slice(0, 50)) {
    if (candidates.size >= cap) break;
    const payload = await fetchJson<TopicPayload>(`${COMMUNITY_BASE}/t/${topic.slug}/${topic.id}.json`);
    const firstPost = payload?.post_stream?.posts?.[0];
    if (!firstPost) continue;

    const text = `${firstPost.raw ?? ''}\n${firstPost.cooked ?? ''}`;
    for (const domain of extractDomains(text)) {
      if (candidates.has(domain)) continue;
      candidates.set(domain, {
        domain,
        source: 'shopify-community-scrape',
        firstDetectedAt: firstPost.created_at ?? topic.createdAt,
        metadata: {
          topicId: topic.id,
          topicSlug: topic.slug,
          sourceUrl: `${COMMUNITY_BASE}/t/${topic.slug}/${topic.id}`,
        },
      });
      if (candidates.size >= cap) break;
    }
  }

  return [...candidates.values()];
}
