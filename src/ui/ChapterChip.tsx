import type { ChapterRef } from '@/modes/types';
import { Chip } from './Chip';

export function ChapterChip({ chapter }: { chapter?: ChapterRef }) {
  if (!chapter) return null;
  return <Chip color={chapter.color}>K{chapter.number} · {chapter.title}</Chip>;
}
