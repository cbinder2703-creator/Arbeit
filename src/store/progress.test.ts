import { beforeEach, describe, expect, it } from 'vitest';
import { useProgress } from './progress';

beforeEach(() => {
  localStorage.clear();
  useProgress.getState().resetAll();
});

describe('Fortschritt pro Prüfung', () => {
  it('speichert getrennt nach pruefungId', () => {
    const s = useProgress.getState();
    s.recordAnswer('a', 'x1', true, '2026-03-01');
    s.addXp('a', 50);
    s.recordAnswer('b', 'x1', false, '2026-03-01');
    const st = useProgress.getState().byPruefung;
    expect(st.a.xp).toBe(50);
    expect(st.b.xp).toBe(0);
    expect(st.a.leitner.x1.everCorrect).toBe(true);
    expect(st.b.leitner.x1.everCorrect).toBe(false);
  });
  it('Streak zählt Tage in Folge, Lücke setzt zurück', () => {
    const s = useProgress.getState();
    s.recordAnswer('a', 'x', true, '2026-03-01');
    s.recordAnswer('a', 'y', true, '2026-03-01');
    expect(useProgress.getState().byPruefung.a.streak).toBe(1);
    s.recordAnswer('a', 'x', true, '2026-03-02');
    expect(useProgress.getState().byPruefung.a.streak).toBe(2);
    expect(useProgress.getState().globalStreak).toBe(2);
    s.recordAnswer('a', 'x', true, '2026-03-05');
    expect(useProgress.getState().byPruefung.a.streak).toBe(1);
    expect(useProgress.getState().byPruefung.a.bestStreak).toBe(2);
  });
  it('Bestwerte, Abzeichen, Note', () => {
    const s = useProgress.getState();
    s.recordRound('a', 'quiz-blitz:k1', 500);
    s.recordRound('a', 'quiz-blitz:k1', 300);
    s.addBadges('a', ['b1', 'b1', 'b2']);
    s.recordExam('a', 70, 3);
    s.recordExam('a', 95, 1);
    s.recordExam('a', 40, 5);
    const a = useProgress.getState().byPruefung.a;
    expect(a.bestScores['quiz-blitz:k1']).toBe(500);
    expect(a.badges).toEqual(['b1', 'b2']);
    expect(a.bestGrade).toBe(1);
    expect(a.examAttempts).toBe(3);
  });
  it('wird in localStorage gespeichert', () => {
    useProgress.getState().addXp('a', 10);
    expect(localStorage.getItem('azubiquest-progress')).toContain('"xp":10');
  });
});
