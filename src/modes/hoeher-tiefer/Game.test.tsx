import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Game from './Game';
import { buildQuestions } from './questions';
import { makeProps, pruefung } from '@/test/harness';
import { mulberry32 } from '@/engine/shuffle';
import { useSettings } from '@/store/settings';

beforeEach(() => useSettings.setState({ sound: false }));
const charts = pruefung.chapters[3].charts!;

describe('Höher oder tiefer?', () => {
  it('erzeugt Fragen nur mit deutlichem Unterschied (≥ 10 Punkte bzw. ≥ 0,5 Std.)', () => {
    const qs = buildQuestions(charts, 200, mulberry32(1));
    expect(qs.length).toBeGreaterThan(20);
    for (const q of qs) {
      const diff = Math.abs(q.a.value - q.b.value);
      expect(diff).toBeGreaterThanOrEqual(q.datasetKey === 'workHours' ? 0.5 : 10);
    }
    expect(new Set(qs.map((q) => q.datasetKey)).size).toBeGreaterThan(3);
    expect(buildQuestions(charts, 10)).toHaveLength(10);
    expect(buildQuestions(undefined, 10)).toEqual([]);
  });

  it('richtig/falsch beantworten, Werte werden danach gezeigt', async () => {
    const { props, reports, onFinish } = makeProps([], { charts });
    const user = userEvent.setup();
    render(<Game {...props} />);
    expect(screen.getByTestId('value-a')).toHaveTextContent('?');
    // falsche Seite: wir kennen die Lösung nicht – beide Seiten probieren über zwei Fragen
    await user.keyboard('{ArrowLeft}');
    const first = reports[0].correct;
    expect(screen.getByTestId('value-a')).not.toHaveTextContent('?');
    expect(screen.getByTestId('feedback')).toHaveAttribute('data-correct', String(first));
    await user.keyboard('{Enter}');
    await user.keyboard('{ArrowRight}');
    expect(reports).toHaveLength(2);
    expect(onFinish).not.toHaveBeenCalled();
  });
});
