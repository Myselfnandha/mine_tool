import { SharedLink, DomainCategoryRule } from '../../types';

export const DOMAIN_RULES: DomainCategoryRule[] = [
  {
    domainPattern: /(github\.com|gitlab\.com|stackoverflow\.com|developer\.mozilla\.org|npmjs\.com|dev\.to)/i,
    category: 'Dev & Engineering',
    folderName: 'Code & Repositories',
    icon: 'terminal',
    color: '#005EA4',
  },
  {
    domainPattern: /(youtube\.com|youtu\.be|vimeo\.com|spotify\.com|soundcloud\.com|twitch\.tv)/i,
    category: 'Media & Video',
    folderName: 'Video & Audio Logs',
    icon: 'play_circle',
    color: '#BA1A1A',
  },
  {
    domainPattern: /(figma\.com|dribbble\.com|behance\.net|awwwards\.com|are\.na|pinterest\.com)/i,
    category: 'Design & Aesthetics',
    folderName: 'Design Systems & Inspiration',
    icon: 'palette',
    color: '#C25E00',
  },
  {
    domainPattern: /(arxiv\.org|biorxiv\.org|scholar\.google\.com|nature\.com|sciencedirect\.com|ieee\.org)/i,
    category: 'Research & Academic',
    folderName: 'Academic Papers & Journals',
    icon: 'science',
    color: '#3F6212',
  },
  {
    domainPattern: /(substack\.com|medium\.com|theverge\.com|nytimes\.com|theatlantic.com|wikipedia\.org|newyorker\.com)/i,
    category: 'Articles & Essays',
    folderName: 'Reading Shelf & Longform',
    icon: 'menu_book',
    color: '#564337',
  },
  {
    domainPattern: /(x\.com|twitter\.com|reddit\.com|threads\.net|news\.ycombinator\.com|mastodon\.social)/i,
    category: 'Community & Intel',
    folderName: 'Discussions & Signal',
    icon: 'forum',
    color: '#0077CD',
  },
];

export class LinkCategorizer {
  /**
   * Extracts clean hostname from URL string
   */
  public static extractDomain(rawUrl: string): string {
    try {
      let normalized = rawUrl.trim();
      if (!/^https?:\/\//i.test(normalized)) {
        normalized = 'https://' + normalized;
      }
      const parsed = new URL(normalized);
      return parsed.hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
      // Fallback regex if URL parse fails
      const match = rawUrl.match(/^(?:https?:\/\/)?(?:www\.)?([^/:]+)/i);
      return match ? match[1].toLowerCase() : 'unknown.domain';
    }
  }

  /**
   * Generates a readable title from URL path when none is provided
   */
  public static generateTitleFromUrl(url: string, domain: string): string {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
      const pathname = parsed.pathname.replace(/^\/|\/$/g, '');
      if (!pathname) {
        return domain.charAt(0).toUpperCase() + domain.slice(1);
      }
      const parts = pathname.split('/');
      const lastPart = parts[parts.length - 1]
        .replace(/[-_]/g, ' ')
        .replace(/\.(html|php|aspx|md)$/i, '');
      if (lastPart.length > 2) {
        return lastPart
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
      }
      return `${domain} — ${parts[0]}`;
    } catch {
      return domain;
    }
  }

  /**
   * Categorizes a domain into a defined category and folder.
   */
  public static classifyDomain(domain: string) {
    for (const rule of DOMAIN_RULES) {
      if (rule.domainPattern.test(domain)) {
        return {
          category: rule.category,
          folderName: rule.folderName,
          icon: rule.icon,
          color: rule.color,
        };
      }
    }

    // Default fallback: Auto-folder created by domain name
    const formattedDomain = domain
      .split('.')[0]
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .trim();
    const folderName =
      (formattedDomain ? formattedDomain.charAt(0).toUpperCase() + formattedDomain.slice(1) : 'Web') +
      ' Archive';

    return {
      category: 'General Reference',
      folderName,
      icon: 'public',
      color: '#897265',
    };
  }

  /**
   * Zero-confirmation link intake:
   * Parses URL, automatically resolves domain and folder, and returns a fully initialized SharedLink.
   */
  public static processIncomingShare(rawText: string, providedTitle?: string): SharedLink {
    // Extract first URL found in text if user shared text with URL
    const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/i;
    const match = rawText.match(urlRegex);
    const finalUrl = match ? match[0] : rawText.trim();
    const domain = this.extractDomain(finalUrl);
    const classification = this.classifyDomain(domain);
    const title = providedTitle?.trim() || this.generateTitleFromUrl(finalUrl, domain);

    const fullUrl = /^https?:\/\//i.test(finalUrl) ? finalUrl : `https://${finalUrl}`;

    return {
      id: 'link_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      url: fullUrl,
      title,
      description: `Auto-categorized link from ${domain}. Filed directly into ${classification.folderName}.`,
      domain,
      folderCategory: classification.category,
      folderIcon: classification.icon,
      folderColor: classification.color,
      faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
      savedAt: new Date().toISOString(),
      isRead: false,
    };
  }
}
