export interface PlayerHymn {
  id: string;
  number: number;
  title: string;
  audioUrl?: string;
}

export function playableQueue(hymns: readonly PlayerHymn[]): PlayerHymn[] {
  return hymns.filter((hymn) => Boolean(hymn.audioUrl?.trim()))
    .sort((a, b) => a.number - b.number || a.id.localeCompare(b.id));
}

export function queueNeighbors(queue: readonly PlayerHymn[], currentId: string | null) {
  const index = currentId ? queue.findIndex((hymn) => hymn.id === currentId) : -1;
  return {
    previous: index > 0 ? queue[index - 1] : null,
    next: index >= 0 && index < queue.length - 1 ? queue[index + 1] : null,
  };
}
