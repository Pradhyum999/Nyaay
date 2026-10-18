import React from 'react';
import { CaseRoom, CaseRoomProps } from '../../components/client/CaseRoom';

export type CaseRoomPageProps = CaseRoomProps;

export const CaseRoomPage: React.FC<CaseRoomPageProps> = (props) => {
  return <CaseRoom {...props} />;
};

export { CaseRoom };
export default CaseRoomPage;
