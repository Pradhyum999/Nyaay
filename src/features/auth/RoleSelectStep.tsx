import React from 'react';
import { Card } from '../../design/ui/Card';
import { Button } from '../../design/ui/Button';
import { Language, UserRole } from '../../types';
import { Gavel, User, ChevronRight, AlertCircle, ArrowLeft } from 'lucide-react';

interface RoleSelectStepProps {
  language: Language;
  onSelectRole: (role: UserRole) => void;
  onOpenOther: () => void;
  onBack: () => void;
  roleConflict?: {
    email: string;
    existingRole: UserRole;
    attemptedRole: UserRole;
  } | null;
  onResolveConflict?: (keepRole: UserRole) => void;
}

export const RoleSelectStep: React.FC<RoleSelectStepProps> = ({
  language,
  onSelectRole,
  onOpenOther,
  onBack,
  roleConflict,
  onResolveConflict,
}) => {
  return (
    <div className="space-y-5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-sub hover:text-main flex items-center gap-1 transition"
        >
          <ArrowLeft size={14} />
          <span>{language === 'mr' ? 'मागे' : language === 'hi' ? 'पीछे' : 'Back'}</span>
        </button>
      </div>

      <div className="text-center space-y-1.5">
        <h2 className="text-lg sm:text-xl font-bold text-main">
          {language === 'mr'
            ? 'आपली भूमिका निवडा'
            : language === 'hi'
            ? 'अपनी भूमिका चुनें'
            : 'Select Your Role'}
        </h2>
        <p className="text-xs text-sub">
          {language === 'mr'
            ? 'न्यायनीतीमध्ये आपण कशासाठी सहभागी होत आहात?'
            : language === 'hi'
            ? 'न्यायनीति में आप किस रूप में जुड़ना चाहते हैं?'
            : 'How will you be using NYAAYNEETI?'}
        </p>
      </div>

      {roleConflict && (
        <Card className="p-4 border-amber-400/30 bg-amber-400/10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
            <AlertCircle size={16} />
            <span>
              {language === 'mr' ? 'खाते भूमिका संघर्ष' : language === 'hi' ? 'भूमिका टकराव' : 'Role Conflict Detected'}
            </span>
          </div>
          <p className="text-xs text-sub leading-relaxed">
            {language === 'mr'
              ? `हा ईमेल (${roleConflict.email}) आधीच ${roleConflict.existingRole === 'lawyer' ? 'वकील' : 'नागरिक'} म्हणून नोंदणीकृत आहे.`
              : language === 'hi'
              ? `यह ईमेल (${roleConflict.email}) पहले से ${roleConflict.existingRole === 'lawyer' ? 'अधिवक्ता' : 'नागरिक'} के रूप में पंजीकृत है।`
              : `This email (${roleConflict.email}) is already registered as a ${roleConflict.existingRole === 'lawyer' ? 'Advocate' : 'Citizen'}.`}
          </p>
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              variant="primary"
              onClick={() => onResolveConflict?.(roleConflict.existingRole)}
            >
              {language === 'mr'
                ? `${roleConflict.existingRole === 'lawyer' ? 'वकील' : 'नागरिक'} म्हणून सुरू ठेवा`
                : language === 'hi'
                ? `${roleConflict.existingRole === 'lawyer' ? 'अधिवक्ता' : 'नागरिक'} के रूप में जारी रखें`
                : `Continue as ${roleConflict.existingRole === 'lawyer' ? 'Advocate' : 'Citizen'}`}
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {/* Advocate Choice */}
        <Card
          interactive
          onClick={() => onSelectRole('lawyer')}
          className="flex items-center justify-between p-4 hover:border-amber-400/40 transition-all ios-press"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <Gavel size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-main">
                {language === 'mr' ? 'मी वकील आहे' : language === 'hi' ? 'मैं अधिवक्ता / वकील हूं' : "I'm an Advocate"}
              </h3>
              <p className="text-xs text-sub mt-0.5">
                {language === 'mr'
                  ? 'खटले, सुनावणी डायरी व पक्षकार व्यवस्थापन'
                  : language === 'hi'
                  ? 'केस डायरी, सुनवाई व मुवक्किल प्रबंधन'
                  : 'Manage cases, court diary & client roster'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </Card>

        {/* Citizen Choice */}
        <Card
          interactive
          onClick={() => onSelectRole('client')}
          className="flex items-center justify-between p-4 hover:border-amber-400/40 transition-all ios-press"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-300">
              <User size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-main">
                {language === 'mr' ? 'मला कायदेशीर मदत हवी आहे' : language === 'hi' ? 'मुझे कानूनी सहायता चाहिए' : 'I Need Legal Help (Citizen)'}
              </h3>
              <p className="text-xs text-sub mt-0.5">
                {language === 'mr'
                  ? 'एआय मार्गदर्शन व पडताळणी झालेले वकील'
                  : language === 'hi'
                  ? 'एआई मार्गदर्शन व सत्यापित अधिवक्ताओं से परामर्श'
                  : 'AI case intake & verified advocate matching'}
              </p>
            </div>
          </div>
          <ChevronRight size={18} className="text-faint" />
        </Card>
      </div>

      <div className="text-center pt-2">
        <button
          type="button"
          onClick={onOpenOther}
          className="text-xs text-sub hover:text-amber-400 transition underline underline-offset-4"
        >
          {language === 'mr'
            ? 'लॉ फर्म, कॉलेज किंवा सदस्य लॉगिन →'
            : language === 'hi'
            ? 'लॉ फर्म, कॉलेज या सदस्य लॉगिन →'
            : 'Firm, college or member sign-in →'}
        </button>
      </div>
    </div>
  );
};
