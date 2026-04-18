import { fetchProfile, updateProfile } from '@/lib/profileApi';

const mockProfile = {
  id: 'user1', name: '테스트', email: 'test@test.com', image: null,
  bio: '안녕하세요', desiredJob: '프론트엔드', desiredIndustry: 'IT',
  desiredRegion: '서울', school: '테스트대학교', major: '컴퓨터공학',
  careerLevel: '신입', portfolioUrl: 'https://github.com/test',
  certifications: ['정보처리기사'], techStacks: ['React', 'TypeScript'],
};

beforeEach(() => { global.fetch = jest.fn(); });

describe('fetchProfile', () => {
  it('프로필을 정상 조회한다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve(mockProfile) });
    const result = await fetchProfile();
    expect(result).toEqual(mockProfile);
    expect(fetch).toHaveBeenCalledWith('/api/user/profile');
  });
  it('실패 시 에러를 던진다', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false });
    await expect(fetchProfile()).rejects.toThrow('프로필을 불러오지 못했습니다.');
  });
});

describe('updateProfile', () => {
  it('프로필을 부분 업데이트한다', async () => {
    const updated = { ...mockProfile, bio: '변경됨' };
    (fetch as jest.Mock).mockResolvedValue({ ok: true, json: () => Promise.resolve(updated) });
    const result = await updateProfile({ bio: '변경됨' });
    expect(result.bio).toBe('변경됨');
    expect(fetch).toHaveBeenCalledWith('/api/user/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bio: '변경됨' }),
    });
  });
});
