import React, { useState } from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { AIInquiryBrief, Language } from '../../types';
import { Bot, Check, X, ChevronDown, ChevronUp, FileText, AlertCircle, Phone, MapPin } from 'lucide-react';

interface InquiryCardProps {
  inquiry: AIInquiryBrief;
  language?: Language;
  onAccept: (inquiry: AIInquiryBrief) => void;
  onDecline: (inquiryId: string) => void;
}

export const InquiryCard: React.FC<InquiryCardProps> = ({
  inquiry,
  language = 'en',
  onAccept,
  onDecline,
}) => {
  const [expanded, setExpanded] = useState(false);
  const profile = inquiry.profile;

  const urgency = profile?.urgency || 'medium';
  const urgencyBadgeClass =
    urgency === 'high'
      ? 'bg-red-500/15 border-red-500/30 text-red-400'
      : urgency === 'medium'
      ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
      : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';

  return (
    <Card className="space-y-3 border-amber-400/20 bg-gradient-to-b from-white/[0.04] to-transparent">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300 shrink-0">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-main">{inquiry.clientName}</h3>
            <p className="text-xs text-sub font-mono">
              {profile?.legalArea || profile?.matterType || 'Legal Inquiry'}
            </p>
          </div>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase ${urgencyBadgeClass}`}>
          {urgency} Urgency
        </span>
      </div>

      {/* Location & Contact if present */}
      {(profile?.location || inquiry.clientPhone) && (
        <div className="flex flex-wrap items-center gap-3 text-xs text-sub">
          {profile?.location && (
            <span className="flex items-center gap-1">
              <MapPin size={12} className="text-amber-400" />
              {profile.location}
            </span>
          )}
          {inquiry.clientPhone && (
            <span className="flex items-center gap-1">
              <Phone size={12} className="text-amber-400" />
              {inquiry.clientPhone}
            </span>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-sub leading-relaxed">
        <p className="text-[11px] font-semibold text-faint uppercase tracking-wider mb-1 font-mono">
          {language === 'mr' ? 'एआय केस सारांश:' : language === 'hi' ? 'एआई केस सारांश:' : 'AI Structured Matter Brief:'}
        </p>
        <p className="text-main">{profile?.summaryText || inquiry.preparedPacket?.slice(0, 200) || 'Client consultation brief submitted.'}</p>
      </div>

      {/* Expandable Facts & Missing Info */}
      {expanded && profile && (
        <div className="space-y-3 pt-2 border-t border-white/[0.06] text-xs animate-in fade-in">
          {profile.facts && profile.facts.length > 0 && (
            <div>
              <span className="font-semibold text-sub block mb-1">
                {language === 'mr' ? 'प्रमुख तथ्य:' : language === 'hi' ? 'प्रमुख तथ्य:' : 'Key Facts:'}
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-sub">
                {profile.facts.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {profile.missingInfo && profile.missingInfo.length > 0 && (
            <div>
              <span className="font-semibold text-amber-400 block mb-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {language === 'mr' ? 'अपूर्ण माहिती:' : language === 'hi' ? 'अधूरी जानकारी:' : 'Missing Information:'}
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-sub">
                {profile.missingInfo.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          {profile.documentsRequired && profile.documentsRequired.length > 0 && (
            <div>
              <span className="font-semibold text-sub block mb-1 flex items-center gap-1">
                <FileText size={12} />
                {language === 'mr' ? 'आवश्यक कागदपत्रे:' : language === 'hi' ? 'आवश्यक दस्तावेज:' : 'Required Documents:'}
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {profile.documentsRequired.map((doc, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-[11px] text-sub">
                    {doc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
        {profile ? (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-sub hover:text-main font-medium"
          >
            {expanded ? (
              <>
                <span>{language === 'mr' ? 'कमी माहिती' : language === 'hi' ? 'कम देखें' : 'Less Details'}</span>
                <ChevronUp size={14} />
              </>
            ) : (
              <>
                <span>{language === 'mr' ? 'पूर्ण माहिती' : language === 'hi' ? 'विस्तार से देखें' : 'View Full Brief'}</span>
                <ChevronDown size={14} />
              </>
            )}
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<X size={13} />}
            onClick={() => onDecline(inquiry.id)}
          >
            {language === 'mr' ? 'नाकारा' : language === 'hi' ? 'अस्वीकार' : 'Decline'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Check size={13} />}
            onClick={() => onAccept(inquiry)}
          >
            {language === 'mr' ? 'स्वीकारा' : language === 'hi' ? 'स्वीकारें' : 'Accept Case'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
