import { SubTabScreen } from '../../components/SubTabScreen';

const tabs = [
  { label: '지원 현황', path: '/applications' },
  { label: '자기소개서', path: '/cover-letters' },
];

export default function ApplicationsTab() {
  return <SubTabScreen tabs={tabs} />;
}
