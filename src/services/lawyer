import { CaseProfile, UserProfile } from '../types';

export interface LawyerMatch {
  lawyer: UserProfile;
  score: number;          // 0-100
  reasons: string[];      // human-readable match reasons, sent to the client
}

/**
 * Match lawyers to a structured CaseProfile.
 *
 * IMPORTANT (positioning + BCI safety):
 * We do NOT rank lawyers as "the best lawyer". We compute an objective
 * relevance score based on verified-profile attributes vs the requirements
 * of the client's matter, and we explain WHY each lawyer is relevant.
 * The client always makes the final choice.
 */
export function matchLawyers(
  profile: CaseProfile | null,
  lawyers: UserProfile[],
  limit = 5
): LawyerMatch[] {
  if (!profile) {
    // No profile yet: return verified lawyers unranked
    return lawyers.slice(0, limit).map(lawyer => ({ lawyer, score: 0, reasons: [] }));
  }

  const targetArea = normalize(profile.legalArea);
  const targetMatter = normalize(profile.matterType);
  const targetLocation = normalize(profile.location);

  const matches: LawyerMatch[] = lawyers.map(lawyer => {
    let score = 0;
    const reasons: string[] = [];

    // 1. Practice area relevance (strongest signal) — up to 45 pts
    const areas = (lawyer.practiceAreas || []).map(normalize);
    const areaHit = areas.find(a =>
      a && (targetArea.includes(a) || a.includes(targetArea) ||
            targetMatter.includes(a) || a.includes(targetMatter) ||
            sharesKeyword(a, targetArea) || sharesKeyword(a, targetMatter))
    );
    if (areaHit) {
      score += 45;
      reasons.push(`Practices in a relevant area for your matter`);
    }

    // 2. Jurisdiction / location — up to 20 pts
    if (targetLocation && (normalize(lawyer.state || '').includes(targetLocation) ||
        targetLocation.includes(normalize(lawyer.state || '')) ||
        (lawyer.practiceCourts || []).some(c => normalize(c).includes(targetLocation)))) {
      score += 20;
      reasons.push(`Practices in your jurisdiction (${profile.location})`);
    }

    // 3. Experience — up to 20 pts
    const exp = lawyer.experience || 0;
    if (exp >= 15) { score += 20; reasons.push('15+ years of standing'); }
    else if (exp >= 10) { score += 15; reasons.push('10+ years of standing'); }
    else if (exp >= 5) { score += 10; reasons.push('5+ years of standing'); }
    else if (exp > 0) { score += 5; }

    // 4. Language compatibility — up to 10 pts
    const langs = (lawyer.languages || []).map(normalize);
    if (langs.length === 0 || langs.includes('english') || langs.includes('hindi')) {
      score += 5;
    }
    if (profile.location && langs.some(l => normalize(profile.location).includes(l))) {
      score += 5;
      reasons.push('Speaks a language relevant to your region');
    }

    // 5. Verified + public case history — up to 5 pts
    if (lawyer.verificationStatus === 'verified') score += 3;
    if ((lawyer.publicCases || []).some(c => c.showOnProfile)) {
      score += 2;
      reasons.push('Public case history available for review');
    }

    return { lawyer, score: Math.min(100, score), reasons };
  });

  return matches
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function normalize(s: string): string {
  return (s || '').toLowerCase().trim();
}

function sharesKeyword(a: string, b: string): boolean {
  const stop = new Set(['and', 'the', 'of', 'dispute', 'matter', 'case', 'law', 'legal']);
  const wordsA = a.split(/[\s,/&\-]+/).filter(w => w.length > 3 && !stop.has(w));
  const wordsB = new Set(b.split(/[\s,/&\-]+/).filter(w => w.length > 3 && !stop.has(w)));
  return wordsA.some(w => wordsB.has(w));
}