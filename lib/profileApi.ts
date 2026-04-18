import type { UserProfile } from './types';

export async function fetchProfile(): Promise<UserProfile> {
  const res = await fetch('/api/user/profile');
  if (!res.ok) throw new Error('프로필을 불러오지 못했습니다.');
  return res.json();
}

export async function updateProfile(data: Partial<Omit<UserProfile, 'id' | 'name' | 'email' | 'image'>>): Promise<UserProfile> {
  const res = await fetch('/api/user/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json();
    throw body;
  }
  return res.json();
}
