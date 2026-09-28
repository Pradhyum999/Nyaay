export const flags = {
  newNav: true,
  todayScreen: true,
  caseDetail: true,
  caseRoom: true,
  communityForum: false,   // orphaned today; ship only after moderation exists
  videoCalls: false,
  demoMode: import.meta.env.VITE_DEMO_MODE === 'true',
};
