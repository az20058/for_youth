import { SubTabScreen } from '../../components/SubTabScreen';

const tabs = [
  { label: '홈', path: '/' },
  { label: '전체 정책', path: '/programs' },
];

export default function HomeTab() {
  return <SubTabScreen tabs={tabs} />;
}
